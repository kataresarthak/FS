import { AlertTriangle, HeartPulse, Lightbulb, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value || 0));
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date();
  return { start, end };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getFinancialHealth({
  budgetAmount,
  currentSpent,
  totalIncome,
  totalExpenses,
  topCategoryPercent,
}) {
  // 1) Budget adherence (40%)
  const budgetSubScore =
    budgetAmount > 0
      ? clamp(100 - (currentSpent / budgetAmount - 1) * 100, 0, 100)
      : 60;

  // 2) Savings behavior (35%)
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  let savingsSubScore = 40;
  if (savingsRate >= 30) savingsSubScore = 100;
  else if (savingsRate >= 20) savingsSubScore = 85;
  else if (savingsRate >= 10) savingsSubScore = 70;
  else if (savingsRate >= 0) savingsSubScore = 55;
  else savingsSubScore = 25;

  // 3) Spending concentration risk (25%)
  const concentrationSubScore =
    totalExpenses > 0
      ? clamp(100 - Math.max(topCategoryPercent - 30, 0) * 2.2, 35, 100)
      : 70;

  const weighted =
    budgetSubScore * 0.4 +
    savingsSubScore * 0.35 +
    concentrationSubScore * 0.25;
  const score = Math.round(clamp(weighted, 0, 100));

  if (score >= 80) {
    return {
      score,
      level: "Excellent",
      color: "#22C55E",
      bg: "#F0FDF4",
      border: "#BBF7D0",
      text: "Your money habits are strong this month. Keep this consistency.",
    };
  }

  if (score >= 60) {
    return {
      score,
      level: "Good",
      color: "#0EA5E9",
      bg: "#F0F9FF",
      border: "#BAE6FD",
      text: "You are doing well overall. Small spending adjustments can improve this score.",
    };
  }

  if (score >= 40) {
    return {
      score,
      level: "Needs Attention",
      color: "#F59E0B",
      bg: "#FFFBEB",
      border: "#FDE68A",
      text: "Your cash flow is under pressure. Tighten high-category expenses this month.",
    };
  }

  return {
    score,
    level: "Critical",
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
    text: "Your finances need immediate correction. Prioritize budget control and savings.",
  };
}

export default function AIInsightsPanel({
  transactions = [],
  budget,
  currentExpenses = 0,
}) {
  const { start, end } = getCurrentMonthRange();

  const monthTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return date >= start && date <= end;
  });

  const monthExpenses = monthTransactions.filter(
    (transaction) => transaction.type === "EXPENSE",
  );

  const monthIncome = monthTransactions.filter(
    (transaction) => transaction.type === "INCOME",
  );

  const totalIncome = monthIncome.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );

  const totalExpenses = monthExpenses.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );

  const byCategory = monthExpenses.reduce((acc, transaction) => {
    const key = transaction.category || "other-expense";
    acc[key] = (acc[key] || 0) + Number(transaction.amount || 0);
    return acc;
  }, {});

  const sortedCategories = Object.entries(byCategory).sort(
    (a, b) => b[1] - a[1],
  );
  const [topCategoryName = "food", topCategoryAmount = 0] =
    sortedCategories[0] || [];

  const topCategoryPercent =
    totalExpenses > 0 ? (topCategoryAmount / totalExpenses) * 100 : 0;

  const budgetAmount = Number(budget?.amount || 0);
  const currentSpent = Number(currentExpenses || totalExpenses);
  const overspentAmount = Math.max(currentSpent - budgetAmount, 0);

  const health = getFinancialHealth({
    budgetAmount,
    currentSpent,
    totalIncome,
    totalExpenses,
    topCategoryPercent,
  });

  const suggestedFoodCut = Math.round((topCategoryAmount * 0.2) / 100) * 100;

  const insightOne =
    overspentAmount > 0
      ? `You overspent ${formatINR(overspentAmount)} this month.`
      : budgetAmount > 0
        ? `You are within budget this month by ${formatINR(Math.max(budgetAmount - Number(currentExpenses || totalExpenses), 0))}.`
        : `You spent ${formatINR(totalExpenses)} this month.`;

  const insightTwo =
    totalExpenses > 0
      ? `${topCategoryName.charAt(0).toUpperCase() + topCategoryName.slice(1).replace(/-/g, " ")} is your highest expense (${topCategoryPercent.toFixed(0)}%).`
      : "No expense trend yet for this month.";

  const insightThree =
    topCategoryAmount > 0
      ? `Reduce ${topCategoryName.replace(/-/g, " ")} spending to save ${formatINR(Math.max(suggestedFoodCut, 100))}.`
      : "Add a few expense entries to unlock personalized savings tips.";

  const cards = [
    {
      title: "Financial Health Score",
      text: health.text,
      icon: HeartPulse,
      iconColor: health.color,
      bg: health.bg,
      border: health.border,
      score: health.score,
      level: health.level,
      isScoreCard: true,
    },
    {
      title: "Spending Alert",
      text: insightOne,
      icon: AlertTriangle,
      iconColor: "#E87171",
      bg: "#FFF4F4",
      border: "#F7D6D6",
    },
    {
      title: "Top Category",
      text: insightTwo,
      icon: PieChart,
      iconColor: "#CAA166",
      bg: "#FFFAF2",
      border: "#F4E4C8",
    },
    {
      title: "Savings Tip",
      text: insightThree,
      icon: Lightbulb,
      iconColor: "#4F9CF9",
      bg: "#F2F8FF",
      border: "#D9E9FF",
    },
  ];

  return (
    <section
      className="rounded-2xl border bg-white p-4 md:p-5"
      style={{ borderColor: "#DDE4E5" }}
    >
      <div className="mb-4">
        <h2 className="text-2xl font-semibold" style={{ color: "#32484F" }}>
          AI Insights
        </h2>
        <p className="text-sm" style={{ color: "#6E858B" }}>
          Personalized suggestions based on this month&apos;s spending pattern
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              className="border shadow-none"
              style={{ backgroundColor: item.bg, borderColor: item.border }}
            >
              <CardHeader className="pb-2">
                <CardTitle
                  className="text-base flex items-center gap-2"
                  style={{ color: "#32484F" }}
                >
                  <Icon className="h-4 w-4" style={{ color: item.iconColor }} />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {item.isScoreCard ? (
                  <div className="mb-2 flex items-end gap-2">
                    <p
                      className="text-4xl font-bold leading-none"
                      style={{ color: item.iconColor }}
                    >
                      {item.score}
                    </p>
                    <p
                      className="mb-1 text-sm font-semibold"
                      style={{ color: item.iconColor }}
                    >
                      / 100 · {item.level}
                    </p>
                  </div>
                ) : null}
                <p className="text-sm" style={{ color: "#32484F" }}>
                  {item.text}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
