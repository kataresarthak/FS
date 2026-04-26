"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Target, Lightbulb, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import useFetch from "@/hooks/use-fetch";
import { toast } from "react-toastify";

async function generateFinancialPlan(transactions, accounts, budget) {
  try {
    const response = await fetch("/api/ai/planner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactions,
        accounts,
        budget,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate plan");
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
}

export default function AIPlannerPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [budget, setBudget] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const {
    loading: planLoading,
    fn: generatePlanFn,
    data: planData,
  } = useFetch(generateFinancialPlan);

  useEffect(() => {
    async function loadData() {
      try {
        const [accountsData, transactionsData] = await Promise.all([
          getUserAccounts(),
          getDashboardData(),
        ]);

        setAccounts(accountsData || []);
        setTransactions(transactionsData || []);

        const defaultAccount = accountsData?.find((a) => a.isDefault);
        if (defaultAccount) {
          const budgetData = await getCurrentBudget(defaultAccount.id);
          setBudget(budgetData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load financial data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (planData && !planLoading) {
      setPlan(planData);
      setGenerating(false);
      toast.success("Financial plan generated successfully!");
    }
  }, [planData, planLoading]);

  const handleGeneratePlan = async () => {
    if (transactions.length === 0) {
      toast.error("Please add some transactions first");
      return;
    }

    setGenerating(true);
    await generatePlanFn(transactions, accounts, budget);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-5 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 py-12 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          <h1 className="text-4xl font-bold">AI Financial Planner</h1>
        </div>
        <p className="text-muted-foreground">
          Get personalized financial insights and recommendations powered by AI
        </p>
      </div>

      {!plan && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Your Financial Plan</CardTitle>
            <CardDescription>
              Analyze your financial data to receive personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Total Accounts</span>
                <span className="font-bold">{accounts.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Total Transactions</span>
                <span className="font-bold">{transactions.length}</span>
              </div>
              {budget && (
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Monthly Budget</span>
                  <span className="font-bold">${budget.budget?.amount?.toFixed(2) || 0}</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleGeneratePlan}
              disabled={generating || planLoading || transactions.length === 0}
              className="w-full"
              size="lg"
            >
              {generating || planLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Financial Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {plan && (
        <div className="space-y-6">
          {/* Goals & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Financial Goals & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan.goals?.map((goal, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <h3 className="font-semibold mb-2">{goal.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.insights?.map((insight, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.actionPlan?.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-300">
                      {index + 1}
                    </div>
                    <p className="text-sm flex-1">{action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleGeneratePlan}
            disabled={generating || planLoading}
            variant="outline"
            className="w-full"
          >
            {generating || planLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              "Regenerate Plan"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
