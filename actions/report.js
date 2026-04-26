"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath, unstable_cache } from "next/cache";
import { startOfMonth, endOfMonth } from "date-fns";
import { GoogleGenAI } from "@google/genai";
import EmailTemplate from "@/emails/template";

const DEFAULT_REPORT_SETTINGS = {
  enabled: true,
  email: "",
  frequency: "MONTHLY",
};

// Create a cached version of the AI call at the module level
const getCachedAIInsights = unstable_cache(
  async (prompt) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const AI_RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);
    const AI_MAX_RETRIES = 1;

    let result;
    for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
      try {
        result = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });
        if (result) break;
      } catch (error) {
        const status = error?.status;
        if (status === 429 || error.message?.toLowerCase().includes("quota"))
          throw error;
        if (attempt === AI_MAX_RETRIES || !AI_RETRYABLE_STATUS_CODES.has(status))
          throw error;
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }

    const rawText = typeof result.text === "function" ? result.text() : "";
    const text = rawText.replace(/```(?:json)?\n?/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else throw new Error("Could not parse AI response");
    }
    return parsed;
  },
  ["financial-insights"],
  { revalidate: 3600 * 24 }, // 24 hour cache
);

function getLastMonthDate() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d;
}

function getMonthDateFromName(monthName) {
  if (!monthName) return null;
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const idx = months.indexOf(monthName.toLowerCase());
  if (idx === -1) return null;

  const now = new Date();
  let year = now.getFullYear();
  if (idx > now.getMonth()) {
    year -= 1;
  }

  return new Date(year, idx, 1);
}

function extractMonthNameFromSubject(subject) {
  const match = subject?.match(/-\s*([A-Za-z]+)$/);
  return match?.[1] || null;
}

async function getMonthlyStats(userId, monthDate) {
  const startDate = startOfMonth(monthDate);
  const endDate = endOfMonth(monthDate);

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
    (stats, transaction) => {
      const amount = transaction.amount ? Number(transaction.amount) : 0;

      if (transaction.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[transaction.category] =
          (stats.byCategory[transaction.category] || 0) + amount;
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

async function generateFinancialInsights(stats, monthName) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `
Analyze this monthly financial data and provide exactly 3 concise insights.
Keep insights practical and action-oriented.

Month: ${monthName}
Total Income: ${stats.totalIncome}
Total Expenses: ${stats.totalExpenses}
Net: ${stats.totalIncome - stats.totalExpenses}
Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ${amount}`)
      .join(", ")}

Respond as valid JSON array only, e.g. ["insight 1", "insight 2", "insight 3"]. Do not include markdown or other text.
`;

    const parsed = await getCachedAIInsights(prompt);
    if (!Array.isArray(parsed)) throw new Error("Invalid AI response format");
    return parsed.slice(0, 3);
  } catch (error) {
    const isQuotaError = error.status === 429 || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED");
    if (isQuotaError) {
      console.warn("AI generation limit reached (Quota Exceeded). Using local fallback generator for insights.");
    } else {
      console.warn("AI generation error, using local fallback generator:", error.message);
    }
    
    // High-quality local insight generator
    const insights = [];
    const isDeficit = stats.totalIncome < stats.totalExpenses;
    const sortedCategories = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0]?.[0] || "spending";
    const savingsRate = stats.totalIncome > 0 ? ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100 : 0;

    // 1. Budget Summary Insight
    if (isDeficit) {
      insights.push(`Your spending exceeded income by ₹${(stats.totalExpenses - stats.totalIncome).toLocaleString()} this month. Consider reviewing your non-essential expenses.`);
    } else if (savingsRate > 20) {
      insights.push(`Great job! You saved ${savingsRate.toFixed(0)}% of your income this month. Consider investing your surplus for better returns.`);
    } else {
      insights.push(`You saved ₹${(stats.totalIncome - stats.totalExpenses).toLocaleString()} this month, with a savings rate of ${savingsRate.toFixed(1)}%.`);
    }

    // 2. Category specific insight
    if (topCategory !== "spending") {
      const topCategoryPercent = stats.totalExpenses > 0 ? (sortedCategories[0][1] / stats.totalExpenses) * 100 : 0;
      insights.push(`${topCategory.charAt(0).toUpperCase() + topCategory.slice(1)} was your top expense at ${topCategoryPercent.toFixed(0)}% of total spend. Reviewing this could yield significant savings.`);
    } else {
      insights.push("Start categorizing more of your transactions to identify specific spending patterns.");
    }

    // 3. Actionable general tip
    if (stats.transactionCount > 20) {
      insights.push("Reviewing your 20+ transactions might help identify small recurring costs that add up over time.");
    } else {
      insights.push("Regularly tracking even small expenses will give you a more accurate picture of your financial health.");
    }

    return insights;
  }
}

async function sendMonthlyReportForUser(user, monthDate) {
  let reportSettings = null;
  if (db.reportSettings) {
    reportSettings = await db.reportSettings.findUnique({
      where: { userId: user.id },
    });
  }

  const monthName = monthDate.toLocaleString("default", { month: "long" });
  const stats = await getMonthlyStats(user.id, monthDate);
  const insights = await generateFinancialInsights(stats, monthName);
  const toEmail = reportSettings?.email || user.email;

  const { sendEmail } = await import("./send-email");

  const result = await sendEmail({
    to: toEmail,
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

  revalidatePath("/reports");
  return result;
}

export async function getReportSettings() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  if (!db.reportSettings) {
    return { success: true, data: DEFAULT_REPORT_SETTINGS };
  }

  const settings = await db.reportSettings.findUnique({
    where: { userId: user.id },
  });

  return {
    success: true,
    data: {
      enabled: settings?.enabled ?? true,
      email: user.email, // Always return user's primary email
      frequency: settings?.frequency ?? "MONTHLY",
    },
  };
}

export async function updateReportSettings(payload) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  if (!db.reportSettings) {
    return {
      success: false,
      error: {
        message: "Report settings storage not available. Run Prisma migration.",
      },
    };
  }

  const enabled = Boolean(payload?.enabled);
  const frequency = payload?.frequency === "WEEKLY" ? "WEEKLY" : "MONTHLY";

  // We no longer allow custom email addresses to avoid sending failures
  const updated = await db.reportSettings.upsert({
    where: { userId: user.id },
    update: {
      enabled,
      email: null, // Force null to always use user's primary email
      frequency,
    },
    create: {
      userId: user.id,
      enabled,
      email: null,
      frequency,
    },
  });

  revalidatePath("/reports");

  return {
    success: true,
    data: {
      enabled: updated.enabled,
      email: user.email,
      frequency: updated.frequency,
    },
  };
}

export async function getEmailReportHistory() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Backward-compatible guard: if Prisma client wasn't regenerated yet,
  // db.emailLog is undefined and we should not crash the page.
  if (!db.emailLog) {
    return [];
  }

  const logs = await db.emailLog.findMany({
    where: {
      userId: user.id,
      type: {
        in: ["MONTHLY_REPORT", "BUDGET_ALERT"],
      },
    },
    orderBy: { sentAt: "desc" },
    take: 200,
  });

  return logs.map((log) => ({
    ...log,
    sentAt: log.sentAt.toISOString(),
    createdAt: log.createdAt.toISOString(),
  }));
}

// Resend a report email (creates a new EmailLog via sendEmail)
export async function resendReport(logId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  if (!db.emailLog) {
    throw new Error("Email logging not available");
  }

  const log = await db.emailLog.findUnique({ where: { id: logId } });
  if (!log) throw new Error("Log not found");

  if (log.type === "MONTHLY_REPORT") {
    const monthName = extractMonthNameFromSubject(log.subject);
    const monthDate = getMonthDateFromName(monthName) || getLastMonthDate();
    return sendMonthlyReportForUser(user, monthDate);
  } else if (log.type === "BUDGET_ALERT") {
    // For budget alerts, we can just resend the same data or trigger a new check
    // Here we'll just re-trigger the sendEmail with the same subject and a placeholder for now
    // Actually, it's better to fetch the current budget and resend a fresh alert
    const { sendEmail } = await import("./send-email");
    const budget = await db.budget.findUnique({
      where: { userId: user.id },
    });

    if (!budget) throw new Error("Budget not found");

    // Recalculate expenses for the month
    const startOfMonthDate = startOfMonth(new Date());

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: { gte: startOfMonthDate },
      },
      _sum: { amount: true },
    });

    const totalExpenses = expenses._sum.amount?.toNumber() || 0;
    const budgetAmount = budget.amount.toNumber();
    const percentageUsed = (totalExpenses / budgetAmount) * 100;

    return await sendEmail({
      to: log.email,
      userId: user.id,
      type: "BUDGET_ALERT",
      subject: `Resent: Budget Alert for ${user.name}`,
      react: EmailTemplate({
        userName: user.name,
        type: "budget-alert",
        data: {
          percentageUsed,
          budgetAmount: budgetAmount.toFixed(1),
          totalExpenses: totalExpenses.toFixed(1),
        },
      }),
    });
  }

  throw new Error("Unsupported report type for resend");
}

const getCachedMonthlyReportData = unstable_cache(
  async (userId, monthKey) => {
    const monthDate = new Date(monthKey + "-01");
    const stats = await getMonthlyStats(userId, monthDate);
    const monthName = monthDate.toLocaleString("default", { month: "long" });
    const insights = await generateFinancialInsights(stats, monthName);

    return {
      month: monthName,
      stats,
      insights,
    };
  },
  ["monthly-report"],
  { revalidate: 3600, tags: ["report-data"] }
);

export async function getMonthlyReportData(monthDate = new Date()) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) throw new Error("User not found");

  const monthKey = monthDate.toISOString().slice(0, 7); // "2024-04"
  return await getCachedMonthlyReportData(user.id, monthKey);
}

export async function triggerEmailReport(type = "last-month") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  let reportDate = new Date();
  if (type === "last-month") {
    // Set to 1st of current month first, then subtract to get previous month correctly
    reportDate.setDate(1);
    reportDate.setMonth(reportDate.getMonth() - 1);
  } else {
    // Current month progress
    reportDate.setDate(1);
  }

  return await sendMonthlyReportForUser(user, reportDate);
}
