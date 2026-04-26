"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import { defaultCategories } from "@/data/categories";
import { sendEmail } from "./send-email";
import EmailTemplate from "@/emails/template";

const AI_RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const AI_MAX_RETRIES = 2;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorStatus = (error) => {
  const status = Number(error?.status);
  return Number.isNaN(status) ? undefined : status;
};

const isRetryableAiError = (error) => {
  const status = getErrorStatus(error);
  if (status && AI_RETRYABLE_STATUS_CODES.has(status)) return true;

  const message = error?.message?.toLowerCase() || "";
  return (
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("resource_exhausted") ||
    message.includes("quota exceeded") ||
    message.includes("timeout")
  );
};

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

const serializeTransactionWithAccount = (transaction) => ({
  ...serializeAmount(transaction),
  account: transaction.account
    ? {
        ...transaction.account,
        balance: transaction.account.balance.toNumber(),
      }
    : null,
});

async function getBudgetNotificationForExpense({
  userId,
  accountId,
  expenseAmount,
}) {
  const budget = await db.budget.findUnique({
    where: { userId },
  });

  if (!budget) return null;

  const budgetAmount = Number(budget.amount || 0);
  if (!budgetAmount || budgetAmount <= 0) return null;

  const currentDate = new Date();
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const expenses = await db.transaction.aggregate({
    where: {
      userId,
      accountId,
      type: "EXPENSE",
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const currentExpenses = Number(expenses._sum.amount || 0);
  const previousExpenses = Math.max(
    currentExpenses - Number(expenseAmount || 0),
    0,
  );

  const previousPercent = (previousExpenses / budgetAmount) * 100;
  const currentPercent = (currentExpenses / budgetAmount) * 100;

  if (previousPercent < 100 && currentPercent >= 100) {
    const overBy = currentExpenses - budgetAmount;
    return {
      level: "critical",
      title: "Overspending Alert",
      message: `You have exceeded this month's budget by ₹${overBy.toFixed(2)}.`,
      percentUsed: Number(currentPercent.toFixed(1)),
      currentExpenses,
      budgetAmount,
    };
  }

  if (previousPercent < 80 && currentPercent >= 80) {
    return {
      level: "warning",
      title: "Budget Alert",
      message: `You have used ${currentPercent.toFixed(1)}% of this month's budget.`,
      percentUsed: Number(currentPercent.toFixed(1)),
      currentExpenses,
      budgetAmount,
    };
  }

  return null;
}

// Create Transaction
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Calculate new balance
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    let budgetNotification = null;
    if (data.type === "EXPENSE") {
      budgetNotification = await getBudgetNotificationForExpense({
        userId: user.id,
        accountId: data.accountId,
        expenseAmount: data.amount,
      });

      if (budgetNotification) {
        const budget = await db.budget.findUnique({
          where: { userId: user.id },
        });

        const lastAlertDate = budget?.lastAlertSent
          ? new Date(budget.lastAlertSent)
          : null;
        const now = new Date();
        const isNewMonth =
          !lastAlertDate ||
          lastAlertDate.getMonth() !== now.getMonth() ||
          lastAlertDate.getFullYear() !== now.getFullYear();

        // Only send email alert if it's a new month or it's a critical alert
        if (isNewMonth || budgetNotification.level === "critical") {
          await sendEmail({
            to: user.email,
            subject: budgetNotification.title,
            userId: user.id,
            type: "BUDGET_ALERT",
            react: EmailTemplate({
              userName: user.name,
              type: "budget-alert",
              data: {
                percentageUsed: budgetNotification.percentUsed,
                budgetAmount: budgetNotification.budgetAmount,
                totalExpenses: budgetNotification.currentExpenses,
              },
            }),
          });

          // Update lastAlertSent
          await db.budget.update({
            where: { userId: user.id },
            data: { lastAlertSent: new Date() },
          });
        }
      }
    }

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);
    revalidatePath("/transactions");
    revalidatePath("/reports");

    return {
      success: true,
      data: serializeAmount(transaction),
      budgetNotification,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);
    revalidatePath("/transactions");
    revalidatePath("/reports");

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Duplicate Transaction
export async function duplicateTransaction(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    const account = await db.account.findUnique({
      where: {
        id: originalTransaction.accountId,
        userId: user.id,
      },
    });

    if (!account) throw new Error("Account not found");

    // Calculate new balance
    const balanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();
    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          type: originalTransaction.type,
          amount: originalTransaction.amount,
          description: originalTransaction.description
            ? `${originalTransaction.description} (Copy)`
            : "Copy",
          date: new Date(),
          receiptUrl: originalTransaction.receiptUrl,
          isRecurring: originalTransaction.isRecurring,
          recurringInterval: originalTransaction.recurringInterval,
          nextRecurringDate:
            originalTransaction.isRecurring &&
            originalTransaction.recurringInterval
              ? calculateNextRecurringDate(
                  new Date(),
                  originalTransaction.recurringInterval,
                )
              : null,
          category: originalTransaction.category,
          paymentMethod: originalTransaction.paymentMethod,
          accountId: originalTransaction.accountId,
          userId: user.id,
          status: originalTransaction.status,
        },
      });

      await tx.account.update({
        where: { id: originalTransaction.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);
    revalidatePath("/transactions");
    revalidatePath("/reports");

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
      // Adding a default safe limit to prevent catastrophic OOM on large accounts
      take: 200, 
    });

    return {
      success: true,
      data: transactions.map(serializeTransactionWithAccount),
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Scan Receipt
export async function scanReceipt(formData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const file = formData instanceof FormData ? formData.get("file") : formData;

    if (!file) {
      throw new Error("No file provided");
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size should be less than 5MB");
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Prepare prompt with available categories
    const expenseCategories = defaultCategories
      .filter((cat) => cat.type === "EXPENSE")
      .map((cat) => cat.name)
      .join(", ");

    const prompt = `
You are a financial data extraction system.

Analyze this receipt image and extract the following information:
1. Total amount (as a number)
2. Date (if visible, otherwise use today's date in YYYY-MM-DD format)
3. Description (merchant name and description of items)
4. Category (choose the most appropriate category from this list: ${expenseCategories})

Return the data in this exact JSON format:
{
  "amount": <number>,
  "date": "YYYY-MM-DD",
  "description": "<description>",
  "category": "<category name exactly as it appears in the list>"
}

Only return the JSON object, no additional text or markdown formatting.
`;

    // Process image with Gemini and retry transient API failures.
    let result;
    for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
      try {
        result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          responseMimeType: "application/json",
          generationConfig: {
            temperature: 0.2,
          },
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                  },
                },
              ],
            },
          ],
        });
        break;
      } catch (apiError) {
        const shouldRetry =
          attempt < AI_MAX_RETRIES && isRetryableAiError(apiError);

        if (!shouldRetry) {
          throw apiError;
        }

        const backoffMs = 700 * 2 ** attempt + Math.floor(Math.random() * 300);
        await wait(backoffMs);
      }
    }

    let text =
      result.candidates?.[0]?.content?.parts?.[0]?.text ?? result.text ?? "";

    // Clean up the response (remove markdown code blocks if any)
    text = text.replace(/```(?:json)?\n?/g, "").trim();

    // Parse JSON response
    let receiptData;
    try {
      receiptData = JSON.parse(text);
    } catch (parseError) {
      // Try to extract JSON from text if wrapped in text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        receiptData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse receipt data");
      }
    }

    if (typeof receiptData.amount === "string") {
      receiptData.amount = parseFloat(
        receiptData.amount.replace(/[^0-9.]/g, ""),
      );
    }

    // Validate and normalize the data
    if (!receiptData.amount || isNaN(receiptData.amount)) {
      throw new Error("Invalid amount extracted from receipt");
    }

    // Match category to available categories
    const matchedCategory = defaultCategories.find(
      (cat) => cat.name.toLowerCase() === receiptData.category?.toLowerCase(),
    );

    if (!matchedCategory) {
      receiptData.category = "other-expense";
    }

    // Format date
    let receiptDate = new Date();
    if (receiptData.date) {
      const parsedDate = new Date(receiptData.date);
      if (!isNaN(parsedDate.getTime())) {
        receiptDate = parsedDate;
      }
    }

    return {
      success: true,
      data: {
        amount: receiptData.amount,
        date: receiptDate.toISOString(),
        description: receiptData.description || "Receipt purchase",
        category: matchedCategory ? matchedCategory.id : "other-expense",
      },
    };
  } catch (error) {
    console.error("Error scanning receipt:", error);
    const status = getErrorStatus(error);
    const errorMessage = (error?.message || "").toLowerCase();

    // Handle Gemini quota exceeded
    if (
      status === 429 ||
      errorMessage.includes("quota") ||
      errorMessage.includes("resource_exhausted") ||
      errorMessage.includes("rate limit")
    ) {
      throw new Error(
        "AI receipt scan limit reached right now. Please try again after some time.",
      );
    }

    if (
      status === 503 ||
      errorMessage.includes("unavailable") ||
      errorMessage.includes("high demand")
    ) {
      throw new Error(
        "AI service is busy at the moment. Please try again after some time.",
      );
    }

    // Handle general API errors
    if (status >= 500) {
      throw new Error("AI service is temporarily unavailable.");
    }

    throw new Error(
      error?.message || "Failed to scan receipt. Please try again.",
    );
  }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}
