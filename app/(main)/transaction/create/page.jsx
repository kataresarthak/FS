import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../_components/transaction-form";
import { getTransaction } from "@/actions/transaction";

export default async function AddTransactionPage({ searchParams }) {
  const accounts = await getUserAccounts();
  const params = await searchParams;
  const editId = params?.edit;
  const duplicateId = params?.duplicate;
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const targetId = editId || duplicateId;

  let initialData = null;
  if (targetId) {
    const transaction = await getTransaction(targetId);
    initialData = transaction;
  }

  return (
    <div className="mx-auto max-w-6xl px-2 py-1.5 md:px-3 md:py-2">
      <div
        className="rounded-2xl border bg-white p-3 shadow-sm md:p-4"
        style={{ borderColor: "#DDE4E5" }}
      >
        <div className="mb-2">
          <h1
            className="text-xl font-semibold md:text-2xl"
            style={{ color: "#32484F" }}
          >
            {editId
              ? "Edit Transaction"
              : duplicateId
                ? "Duplicate Transaction"
                : "Add Transaction"}
          </h1>
          <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>
            Today: {todayLabel}
          </p>
        </div>

        <AddTransactionForm
          accounts={accounts}
          categories={defaultCategories}
          editMode={!!editId}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
