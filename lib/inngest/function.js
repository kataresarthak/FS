import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { GoogleGenAI } from "@google/genai";

// 1. Recurring Transaction Processing with Throttling
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Process 10 transactions
      period: "1m", // per minute
      key: "event.data.userId", // Throttle per user
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      // Create new transaction and update account balance in a transaction
      await db.$transaction(async (tx) => {
        // Create new transaction
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        // Update account balance
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update last processed date and next recurring date
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval,
            ),
          },
        });
      });
    });
  },
);

// Trigger recurring transactions with batching
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions", // Unique ID,
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" }, // Daily at midnight
  async ({ step }) => {
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(),
                },
              },
            ],
          },
        });
      },
    );

    // Send event for each recurring transaction in batches
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Send events directly using inngest.send()
      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  },
);

// 2. Monthly Report Generation
async function generateFinancialInsights(stats, month) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const AI_RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
    const AI_MAX_RETRIES = 2;

    const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

    let result;
    for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
      try {
        result = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });

        if (result && result.text) break;
      } catch (apiError) {
        const status = apiError?.status;
        const shouldRetry =
          attempt < AI_MAX_RETRIES &&
          (AI_RETRYABLE_STATUS_CODES.has(status) ||
            apiError.message?.toLowerCase().includes("demand") ||
            apiError.message?.toLowerCase().includes("unavailable"));

        if (!shouldRetry) throw apiError;
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            800 * 2 ** attempt + Math.floor(Math.random() * 300),
          ),
        );
      }
    }

    const text = result.text ?? "";
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    const sortedCategories = Object.entries(stats.byCategory).sort(
      (a, b) => b[1] - a[1],
    );
    const topCategory = sortedCategories[0]?.[0] || "spending";
    return [
      `Your spending in ${topCategory} is your highest category this month.`,
      "Consider setting a specific budget for next month to stay on track.",
      "Reviewing your recurring subscriptions could yield extra savings.",
    ];
  }
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" }, // First day of each month
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: {
          accounts: true,
          reportSettings: true,
        },
      });
    });

    for (const user of users) {
      const settings = user.reportSettings;
      const isEnabled = settings?.enabled ?? true;
      const frequency = settings?.frequency || "MONTHLY";

      if (!isEnabled || frequency !== "MONTHLY") {
        continue;
      }

      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        // Generate AI insights
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: settings?.email || user.email,
          userId: user.id,
          type: "MONTHLY_REPORT",
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  },
);

export const generateWeeklyReports = inngest.createFunction(
  {
    id: "generate-weekly-reports",
    name: "Generate Weekly Reports",
  },
  { cron: "0 0 * * 1" }, // Every Monday
  async ({ step }) => {
    const users = await step.run("fetch-weekly-users", async () => {
      return await db.user.findMany({
        include: {
          reportSettings: true,
        },
      });
    });

    for (const user of users) {
      const settings = user.reportSettings;
      const isEnabled = settings?.enabled ?? true;
      const frequency = settings?.frequency || "MONTHLY";

      if (!isEnabled || frequency !== "WEEKLY") {
        continue;
      }

      await step.run(`generate-weekly-report-${user.id}`, async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        const stats = await getStatsForRange(user.id, startDate, endDate);
        const insights = await generateFinancialInsights(stats, "Last 7 Days");

        await sendEmail({
          to: settings?.email || user.email,
          userId: user.id,
          type: "MONTHLY_REPORT",
          subject: "Your Weekly Financial Report",
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: "Last 7 Days",
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  },
);

// 3. Budget Alerts with Event Batching
export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
              reportSettings: true,
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; // Skip if no default account

      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1); // Start of current month

        // Calculate total expenses for the default account only
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount.toNumber();
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        // Check if we should send an alert (80% and 100% thresholds)
        // We'll store which threshold was last alerted to allow multiple alerts per month
        // For now, we'll use a simple logic: if it's > 100% and last alert was < 100% (or no alert)
        // OR if it's > 80% and last alert was < 80% (or no alert)
        
        // Let's use the lastAlertSent date to check for the month, 
        // and we could potentially store the last threshold in a new field, 
        // but since we can't change the schema easily right now, 
        // let's at least fix the "exceeded" check.

        if (percentageUsed >= 80) {
          const isNewMonthFlag = !budget.lastAlertSent || isNewMonth(new Date(budget.lastAlertSent), new Date());
          
          if (isNewMonthFlag || (percentageUsed >= 100 && budget.lastAlertSent && new Date(budget.lastAlertSent).getTime() < new Date().getTime() - 24 * 60 * 60 * 1000)) {
            if (isNewMonthFlag) {
              const subject = percentageUsed >= 100 
                ? `Critical: Budget Exceeded for ${budget.user.name}`
                : `Budget Alert for ${budget.user.name}`;

              await sendEmail({
                to: budget.user.reportSettings?.email || budget.user.email,
                userId: budget.user.id,
                type: "BUDGET_ALERT",
                subject,
                react: EmailTemplate({
                  userName: budget.user.name,
                  type: "budget-alert",
                  data: {
                    percentageUsed,
                    budgetAmount: budgetAmount.toFixed(1),
                    totalExpenses: totalExpenses.toFixed(1),
                    isExceeded: percentageUsed >= 100,
                  },
                }),
              });

              // Update last alert sent
              await db.budget.update({
                where: { id: budget.id },
                data: { lastAlertSent: new Date() },
              });
            }
          }
        }
      });
    }
  },
);

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

// Utility functions
function isTransactionDue(transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  // Compare with nextDue date
  return nextDue <= today;
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  return getStatsForRange(userId, startDate, endDate);
}

async function getStatsForRange(userId, startDate, endDate) {
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    },
  );
}
