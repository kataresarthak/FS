"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, PenBox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddTransactionDrawer from "@/components/add-transaction-drawer";
import { Switch } from "@/components/ui/switch";
import useFetch from "@/hooks/use-fetch";
import { createTransaction } from "@/actions/transaction";
import { toast } from "react-toastify";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERIODS = {
  30: "Last 30 Days",
  90: "Last 3 Months",
  180: "Last 6 Months",
  365: "Last 12 Months",
};

const DEFAULT_PERIOD = "30";
const DIRECT_ADD_STORAGE_KEY = "dashboard_quick_add_direct_v1";

function safePercentChange(current, previous) {
  const denominator = (Math.abs(current) + Math.abs(previous)) / 2;
  if (denominator === 0) {
    return 0;
  }
  // Symmetric percentage change gives a real % even when previous is 0.
  return ((current - previous) / denominator) * 100;
}

function getPeriodTransactions(transactions, start, end) {
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= start && date <= end;
  });
}

function getSummary(transactions, accounts, periodDays) {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(now.getDate() - periodDays);

  const prevEnd = new Date(currentStart);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - periodDays);

  const currentTx = getPeriodTransactions(transactions, currentStart, now);
  const previousTx = getPeriodTransactions(transactions, prevStart, prevEnd);

  const sumByType = (arr, type) =>
    arr
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const incomeCurrent = sumByType(currentTx, "INCOME");
  const incomePrevious = sumByType(previousTx, "INCOME");

  const expenseCurrent = sumByType(currentTx, "EXPENSE");
  const expensePrevious = sumByType(previousTx, "EXPENSE");

  const savingsCurrent =
    incomeCurrent > 0
      ? ((incomeCurrent - expenseCurrent) / incomeCurrent) * 100
      : 0;
  const savingsPrevious =
    incomePrevious > 0
      ? ((incomePrevious - expensePrevious) / incomePrevious) * 100
      : 0;

  const balanceCurrent = (accounts || []).reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0,
  );

  const netCurrent = incomeCurrent - expenseCurrent;
  const netPrevious = incomePrevious - expensePrevious;

  return {
    balanceCurrent,
    balanceTrend: safePercentChange(netCurrent, netPrevious),
    incomeCurrent,
    incomeTrend: safePercentChange(incomeCurrent, incomePrevious),
    expenseCurrent,
    expenseTrend: safePercentChange(expenseCurrent, expensePrevious),
    savingsCurrent,
    savingsTrend: safePercentChange(savingsCurrent, savingsPrevious),
  };
}

function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const start = performance.now();
    const from = 0;
    const to = Number(target) || 0;

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out for a smoother finish.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (to - from) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration]);

  return value;
}

export default function DashboardHero({
  accounts,
  summaryAccounts,
  transactions,
}) {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [quickPreset, setQuickPreset] = useState(null);
  const [directAddEnabled, setDirectAddEnabled] = useState(false);
  const [activeQuickKey, setActiveQuickKey] = useState(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const quickButtons = [
    { amount: 100, category: "food", label: "Food" },
    { amount: 200, category: "travel", label: "Travel" },
    { amount: 50, category: "groceries", label: "Grocery" },
  ];

  const { fn: createTransactionFn } = useFetch(createTransaction);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DIRECT_ADD_STORAGE_KEY);
      if (saved === "true" || saved === "false") {
        setDirectAddEnabled(saved === "true");
      }
    } catch (error) {
      // Ignore localStorage errors in restricted environments.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        DIRECT_ADD_STORAGE_KEY,
        directAddEnabled ? "true" : "false",
      );
    } catch (error) {
      // Ignore localStorage errors in restricted environments.
    }
  }, [directAddEnabled]);

  const resolveAccountId = () => {
    const selectedAccountId = searchParams.get("account");
    if (
      selectedAccountId &&
      selectedAccountId !== "ALL" &&
      accounts?.some((a) => a.id === selectedAccountId)
    ) {
      return selectedAccountId;
    }

    return accounts?.find((a) => a.isDefault)?.id || accounts?.[0]?.id || "";
  };

  const quickAddDirect = async (amount, category, label) => {
    const quickKey = `${amount}-${category}-${label}`;
    if (activeQuickKey) return;

    const accountId = resolveAccountId();
    if (!accountId) {
      toast.error("Please create an account first");
      return;
    }

    setActiveQuickKey(quickKey);
    try {
      const result = await createTransactionFn({
        type: "EXPENSE",
        amount,
        category,
        accountId,
        paymentMethod: "CASH",
        date: new Date(),
        isRecurring: false,
        description: label,
      });

      if (result?.success) {
        toast.success(`Added ₹${amount} ${label}`);

        if (result?.budgetNotification) {
          const alert = result.budgetNotification;
          if (alert.level === "critical") {
            toast.error(alert.message);
          } else {
            toast.warn(alert.message);
          }
        }

        router.refresh();
        return;
      }

      toast.error(result?.error?.message || "Failed to add transaction");
    } finally {
      setActiveQuickKey(null);
    }
  };

  const handleQuickAdd = (amount, category) => {
    if (directAddEnabled) {
      const preset = quickButtons.find(
        (item) => item.amount === amount && item.category === category,
      );
      quickAddDirect(amount, category, preset?.label || "Quick Expense");
      return;
    }

    setQuickPreset({
      type: "EXPENSE",
      amount,
      category,
      date: new Date(),
      description: "",
      isRecurring: false,
      paymentMethod: "CASH",
    });
    setIsAddDrawerOpen(true);
  };

  const handleDrawerOpenChange = (nextOpen) => {
    setIsAddDrawerOpen(nextOpen);
    if (!nextOpen) {
      setQuickPreset(null);
    }
  };

  const periodFromQuery = searchParams.get("period");
  const periodDays = PERIODS[periodFromQuery]
    ? periodFromQuery
    : DEFAULT_PERIOD;

  const handlePeriodChange = (value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const summary = useMemo(
    () =>
      getSummary(
        transactions || [],
        summaryAccounts || accounts || [],
        Number(periodDays),
      ),
    [transactions, summaryAccounts, accounts, periodDays],
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const animatedBalance = useCountUp(summary.balanceCurrent);
  const animatedIncome = useCountUp(summary.incomeCurrent);
  const animatedExpense = useCountUp(summary.expenseCurrent);
  const animatedSavings = useCountUp(summary.savingsCurrent, 1000);

  return (
    <section
      className="rounded-3xl px-6 py-7 md:px-8 md:py-8"
      style={{
        background: "linear-gradient(to right, #1A2436, #142033, #1A2436)",
      }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xl font-small" style={{ color: "#A7B8BD" }}>
          Quick Add:
        </span>
        <div
          className="ml-1 inline-flex items-center gap-2 rounded-full border px-2 py-1"
          style={{
            borderColor: "#3E4A63",
            backgroundColor: "rgba(39,50,72,0.75)",
          }}
        >
          <span className="text-[11px] font-medium text-white">Direct Add</span>
          <Switch
            checked={directAddEnabled}
            onCheckedChange={setDirectAddEnabled}
            disabled={!!activeQuickKey}
          />
        </div>
        {quickButtons.map((item) =>
          (() => {
            const quickKey = `${item.amount}-${item.category}-${item.label}`;
            const isActive = activeQuickKey === quickKey;
            return (
              <Button
                key={`${item.amount}-${item.label}`}
                type="button"
                variant="outline"
                className="h-8 rounded-full border text-xs text-white hover:text-white"
                style={{
                  borderColor: "#3E4A63",
                  backgroundColor: "rgba(39,50,72,0.75)",
                }}
                disabled={isActive}
                onClick={() => handleQuickAdd(item.amount, item.category)}
              >
                {isActive ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                +₹{item.amount} {item.label}
              </Button>
            );
          })(),
        )}
      </div>

      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: "#A7B8BD" }}>
            This is your overview report for the selected period
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={periodDays} onValueChange={handlePeriodChange}>
            <SelectTrigger
              className="w-[145px] border text-white"
              style={{
                borderColor: "#3E4A63",
                backgroundColor: "rgba(39,50,72,0.75)",
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIODS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("account") || "ALL"}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());
              if (value === "ALL") params.delete("account");
              else params.set("account", value);
              router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
              });
            }}
          >
            <SelectTrigger
              className="w-[145px] border text-white"
              style={{
                borderColor: "#3E4A63",
                backgroundColor: "rgba(39,50,72,0.75)",
              }}
            >
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Accounts</SelectItem>
              {accounts?.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AddTransactionDrawer
            open={isAddDrawerOpen}
            onOpenChange={handleDrawerOpenChange}
            initialData={quickPreset}
          >
            <Button
              className="flex items-center gap-2 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover-gradient-button"
              style={{
                background:
                  "linear-gradient(to right, #32484F, #233A41, #CAA166)",
              }}
            >
              <PenBox size={18} />
              <span className="hidden sm:inline font-medium">
                Add Transaction
              </span>
            </Button>
          </AddTransactionDrawer>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          className="border-0 text-white"
          style={{ backgroundColor: "#273248" }}
        >
          <CardContent className="pt-5">
            <p className="text-sm" style={{ color: "#A7B8BD" }}>
              Available Balance
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "#8FD3FF" }}>
              {formatCurrency(animatedBalance)}
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-0 text-white"
          style={{ backgroundColor: "#273248" }}
        >
          <CardContent className="pt-5">
            <p className="text-sm" style={{ color: "#A7B8BD" }}>
              Total Income
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "#7EE2A8" }}>
              {formatCurrency(animatedIncome)}
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-0 text-white"
          style={{ backgroundColor: "#273248" }}
        >
          <CardContent className="pt-5">
            <p className="text-sm" style={{ color: "#A7B8BD" }}>
              Total Expenses
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "#FF9EA5" }}>
              {formatCurrency(-Math.abs(animatedExpense))}
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-0 text-white"
          style={{ backgroundColor: "#273248" }}
        >
          <CardContent className="pt-5">
            <p className="text-sm" style={{ color: "#A7B8BD" }}>
              Savings Rate
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "#FFD27A" }}>
              {Math.max(animatedSavings, 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
