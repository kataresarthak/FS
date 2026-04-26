import { getUserTransactions } from "@/actions/transaction";
import dynamicImport from "next/dynamic";
import { Suspense } from "react";

const TransactionTable = dynamicImport(
  () =>
    import("@/app/(main)/account/_components/transaction-table").then(
      (mod) => mod.TransactionTable,
    ),
  {
    loading: () => (
      <div className="rounded-xl border p-6 text-sm text-[#6E858B]">
        Loading transactions...
      </div>
    ),
  },
);

const DashboardOverview = dynamicImport(
  () =>
    import("@/app/(main)/dashboard/_components/transaction-overview").then(
      (mod) => mod.DashboardOverview,
    ),
  {
    loading: () => (
      <div className="rounded-xl border p-6 text-sm text-[#6E858B]">
        Loading overview...
      </div>
    ),
  },
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TransactionsPage() {
  const response = await getUserTransactions();

  const transactions = (response?.data || []).map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
    date: new Date(transaction.date).toISOString(),
    nextRecurringDate: transaction.nextRecurringDate
      ? new Date(transaction.nextRecurringDate).toISOString()
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="relative">
        <section
          className="rounded-3xl px-6 py-8 md:px-8 md:py-10 pb-12 md:pb-16"
          style={{
            background: "linear-gradient(to right, #1A2436, #142033, #1A2436)",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                All Transactions
              </h1>
              <p className="text-sm mt-1" style={{ color: "#A7B8BD" }}>
                Manage and analyze your financial history
              </p>
            </div>
          </div>
        </section>

        <div
          className="-mt-8 md:-mt-12 rounded-2xl border bg-white p-4 md:p-5 shadow-xl relative z-10"
          style={{ borderColor: "#DDE4E5" }}
        >
          <TransactionTable transactions={transactions} />
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div className="h-96 bg-gray-50 animate-pulse rounded-2xl" />}>
          <DashboardOverview transactions={transactions} />
        </Suspense>
      </div>
    </div>
  );
}
