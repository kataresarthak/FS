import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactions, accounts, budget } = await request.json();

    // Calculate financial stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyExpenses = transactions.filter(
      (t) =>
        t.type === "EXPENSE" &&
        new Date(t.date) >= startOfMonth &&
        new Date(t.date) <= endOfMonth,
    );

    const monthlyIncome = transactions.filter(
      (t) =>
        t.type === "INCOME" &&
        new Date(t.date) >= startOfMonth &&
        new Date(t.date) <= endOfMonth,
    );

    const totalExpenses = monthlyExpenses.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0,
    );
    const totalIncome = monthlyIncome.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0,
    );

    // Group expenses by category
    const categoryExpenses = {};
    monthlyExpenses.forEach((t) => {
      const cat = t.category || "other";
      categoryExpenses[cat] =
        (categoryExpenses[cat] || 0) + parseFloat(t.amount || 0);
    });

    // Get account balances
    const totalBalance = accounts.reduce(
      (sum, a) => sum + parseFloat(a.balance || 0),
      0,
    );

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
Analyze this financial data and provide personalized financial planning recommendations:

Financial Summary:
- Monthly Income: $${totalIncome.toFixed(2)}
- Monthly Expenses: $${totalExpenses.toFixed(2)}
- Net Income: $${(totalIncome - totalExpenses).toFixed(2)}
- Total Account Balance: $${totalBalance.toFixed(2)}
- Monthly Budget: $${budget?.budget?.amount?.toFixed(2) || "Not set"}

Expense Breakdown by Category:
${Object.entries(categoryExpenses)
  .map(([cat, amount]) => `  - ${cat}: $${amount.toFixed(2)}`)
  .join("\n")}

Please provide a comprehensive financial plan in this exact JSON format:
{
  "goals": [
    {
      "title": "Short-term goal title",
      "description": "Detailed description and steps to achieve this goal"
    },
    {
      "title": "Long-term goal title",
      "description": "Detailed description and steps to achieve this goal"
    }
  ],
  "insights": [
    "Insight 1 about spending patterns or financial health",
    "Insight 2 about opportunities or risks",
    "Insight 3 with actionable advice"
  ],
  "actionPlan": [
    "Action item 1 - specific and actionable",
    "Action item 2 - specific and actionable",
    "Action item 3 - specific and actionable",
    "Action item 4 - specific and actionable"
  ]
}

Only return the JSON object, no additional text or markdown formatting. Make recommendations practical and based on the actual data provided.
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    let text = result.text ?? "";

    // Clean up the response
    text = text.replace(/```(?:json)?\n?/g, "").trim();

    // Parse JSON response
    let planData;
    try {
      planData = JSON.parse(text);
    } catch (parseError) {
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    // Validate structure
    if (!planData.goals || !planData.insights || !planData.actionPlan) {
      throw new Error("Invalid plan structure");
    }

    return NextResponse.json(planData);
  } catch (error) {
    console.error("Error generating financial plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate financial plan" },
      { status: 500 },
    );
  }
}
