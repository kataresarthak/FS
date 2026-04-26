import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

function wantsDetailedResponse(message) {
  const text = (message || "").toLowerCase();
  const detailPhrases = [
    "in detail",
    "detailed",
    "details",
    "elaborate",
    "explain more",
    "tell me more",
    "step by step",
    "full explanation",
    "why",
    "how exactly",
    "breakdown",
  ];

  return detailPhrases.some((phrase) => text.includes(phrase));
}

function sanitizeChatResponse(text) {
  return (text || "")
    .replace(/\*\*/g, "")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .trim();
}

function enforceConciseReply(text) {
  const cleaned = sanitizeChatResponse(text);
  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    return `${lines[0]}\n${lines[1]}`;
  }

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    return `${sentences[0]}\n${sentences[1]}`;
  }

  return cleaned;
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    const { messages } = await req.json();
    const lastUserMessage = messages?.[messages.length - 1]?.content || "";
    const detailedMode = wantsDetailedResponse(lastUserMessage);

    if (!process.env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error: Missing API Key" },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const formatINR = (value) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(Number(value) || 0);

    let systemInstruction = "";

    if (userId) {
      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
        include: {
          accounts: {
            where: { isDefault: true },
          },
        },
      });

      if (user) {
        // Fetch financial data
        const accounts = await db.account.findMany({
          where: { userId: user.id },
        });

        const transactions = await db.transaction.findMany({
          where: { userId: user.id },
          orderBy: { date: "desc" },
          take: 30, // Last 30 transactions for context
        });

        // Calculate stats
        const totalBalance = accounts.reduce(
          (sum, acc) => sum + (Number(acc.balance) || 0),
          0,
        );

        const monthlyTransactions = transactions.filter((t) => {
          const date = new Date(t.date);
          const now = new Date();
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        });

        const totalExpenses = monthlyTransactions
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const totalIncome = monthlyTransactions
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        // Logged-in user context with data
        systemInstruction = `
          You are a helpful and knowledgeable financial assistant for the finance platform.
          Your goal is to help the user with their financial questions, budgeting, and platform usage.
          Always present currency values in INR (₹) by default.
          Keep replies short and human by default: maximum 1-2 short lines.
          Give detailed explanations only when the user explicitly asks for details.
          Do not use markdown titles, bold markers, emojis, or robotic tone.

          Here is the user's current financial context:

          - Total Account Balance: ${formatINR(totalBalance)}
          - Monthly Income (Current Month): ${formatINR(totalIncome)}
          - Monthly Expenses (Current Month): ${formatINR(totalExpenses)}
          - Net Cash Flow (Current Month): ${formatINR(totalIncome - totalExpenses)}

          - Recent Transactions:
          ${transactions
            .slice(0, 5)
            .map(
              (t) =>
                `  * ${t.date.toISOString().split("T")[0]}: ${t.description || t.category} (${formatINR(t.amount)}) - ${t.type}`,
            )
            .join("\n")}

          - Accounts:
          ${accounts.map((a) => `  * ${a.name} (${a.type}): ${formatINR(a.balance)}`).join("\n")}
        `;
      } else {
        systemInstruction = `You are a helpful financial assistant for the finance platform. The user is logged in but their record was not found.`;
      }
    } else {
      systemInstruction = `
        You are a helpful assistant for the finance platform.
        The platform offers expense tracking, budgeting, and financial insights.
        Always present currency values in INR (₹) by default.
        Keep replies short and human by default: maximum 1-2 short lines.
        Give detailed explanations only when the user explicitly asks for details.
      `;
    }

    const prompt = `
      ${systemInstruction}
      Conversation: ${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}
      Response mode: ${detailedMode ? "Detailed" : "Concise"}
      Assistant:
    `;

    const AI_RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);
    const AI_MAX_RETRIES = 1;
    let result;

    for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
      try {
        result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        if (result) break;
      } catch (error) {
        const status = error?.status;
        if (status === 429 || error.message?.toLowerCase().includes("quota")) throw error;
        if (attempt === AI_MAX_RETRIES || !AI_RETRYABLE_STATUS_CODES.has(status)) throw error;
        
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    
    const rawText = result?.text || "";
    const text = detailedMode
      ? sanitizeChatResponse(rawText)
      : enforceConciseReply(rawText);

    return NextResponse.json({ role: "assistant", content: text });
  } catch (error) {
    console.error("Chat API Error:", error);
    const status = error.status || 500;
    const isQuotaError = status === 429 || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED");
    const message = isQuotaError ? "Chat limit reached. Please try again in about a minute." : (error.message || "Internal server error.");
    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
