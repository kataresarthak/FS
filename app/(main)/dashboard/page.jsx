import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import dynamicImport from "next/dynamic";
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import DashboardHero from "./_components/dashboard-hero";
import AIInsightsPanel from "./_components/ai-insights-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CashFlowSankey } from "./_components/cash-flow-sankey";
import { WealthForecaster } from "./_components/wealth-forecaster";

// Removed DashboardOverview as per user request to replace with Cash Flow Breakdown

const RecentTransactionsTable = dynamicImport(
  () =>
    import("./_components/recent-transactions-table").then(
      (mod) => mod.RecentTransactionsTable,
    ),
  {
    loading: () => (
      <div
        className="rounded-xl border bg-white p-6 text-sm"
        style={{ borderColor: "#DDE4E5", color: "#6E858B" }}
      >
        Loading recent transactions...
      </div>
    ),
  },
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_PERIODS = new Set(["30", "90", "180", "365"]);

async function DashboardData({ periodDays, selectedAccountId }) {
  const accountsPromise = getUserAccounts();
  const transactionsPromise = getDashboardData();

  // Start budget fetch as soon as accounts resolve, without waiting for transactions.
  const budgetPromise = accountsPromise.then((resolvedAccounts) => {
    const defaultAccount = resolvedAccounts?.find(
      (account) => account.isDefault,
    );
    return defaultAccount ? getCurrentBudget(defaultAccount.id) : null;
  });

  const [accounts, transactions, budgetData] = await Promise.all([
    accountsPromise,
    transactionsPromise,
    budgetPromise,
  ]);

  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - periodDays);

  let filteredTransactions = transactions || [];
  let filteredAccounts = accounts || [];

  if (selectedAccountId && selectedAccountId !== "ALL") {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.accountId === selectedAccountId,
    );
    filteredAccounts = filteredAccounts.filter(
      (a) => a.id === selectedAccountId,
    );
  }

  const recentTransactions = filteredTransactions
    .filter((transaction) => {
      const date = new Date(transaction.date);
      return date >= periodStart && date <= now;
    })
    .slice(0, 10);

  // Calculate account breakdown for the current month's expenses
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const accountBreakdown = (transactions || [])
    .filter((t) => t.type === "EXPENSE" && new Date(t.date) >= currentMonthStart)
    .reduce((acc, t) => {
      acc[t.accountId] = (acc[t.accountId] || 0) + Number(t.amount);
      return acc;
    }, {});

  return (
    <>
      <DashboardHero
        accounts={accounts || []}
        summaryAccounts={filteredAccounts}
        transactions={filteredTransactions}
      />

      <AIInsightsPanel
        transactions={filteredTransactions}
        budget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Cash Flow Breakdown (Replaced Dashboard Overview) */}
      <CashFlowSankey
        transactions={filteredTransactions}
        days={String(periodDays)}
      />

      <section
        className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm"
        style={{ borderColor: "#DDE4E5" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: "#32484F" }}>
              Recent Transactions
            </h2>
            <p className="text-sm" style={{ color: "#6E858B" }}>
              Showing latest 10 transactions for last {periodDays} days
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-[#DDE4E5] text-[#32484F] hover:bg-[#EEF6F8]"
          >
            <Link href="/transactions">View All</Link>
          </Button>
        </div>
        <RecentTransactionsTable transactions={recentTransactions} />
      </section>

      {/* Wealth Forecaster & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Wealth Forecaster */}
        <div className="lg:col-span-2">
          <WealthForecaster
            transactions={transactions}
            accounts={accounts}
          />
        </div>

        {/* Right Side: Monthly Budget and Accounts */}
        <div className="space-y-6">
          <BudgetProgress
            initialBudget={budgetData?.budget}
            currentExpenses={budgetData?.currentExpenses || 0}
            accounts={accounts || []}
            accountBreakdown={accountBreakdown}
          />

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#32484F] px-1">Your Accounts</h2>
            <div className="grid gap-4">
              {filteredAccounts.length > 0 &&
                filteredAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              <CreateAccountDrawer>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-[#DDE4E5]">
                  <CardContent className="flex flex-col items-center justify-center text-muted-foreground py-8">
                    <Plus className="h-8 w-8 mb-2" />
                    <p className="text-xs font-medium">Add New Account</p>
                  </CardContent>
                </Card>
              </CreateAccountDrawer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function DashboardPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const selectedPeriod = resolvedSearchParams?.period;
  const selectedAccountId = resolvedSearchParams?.account;
  const periodDays = VALID_PERIODS.has(selectedPeriod)
    ? Number(selectedPeriod)
    : 30;

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <Loader2
              className="h-10 w-10 animate-spin mb-4"
              style={{ color: "#CAA166" }}
            />
            <p className="text-lg font-medium" style={{ color: "#6E858B" }}>
              Loading dashboard data...
            </p>
          </div>
        }
      >
        <DashboardData
          periodDays={periodDays}
          selectedAccountId={selectedAccountId}
        />
      </Suspense>
    </div>
  );
}
