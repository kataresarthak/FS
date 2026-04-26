"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, subDays } from "date-fns";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Calendar, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { defaultCategories } from "@/data/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VALID_PERIODS = new Set(["7", "30", "90", "180", "365"]);

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

function AnimatedValue({
  value,
  duration = 1100,
  minimumFractionDigits = 0,
  maximumFractionDigits = 0,
  prefix = "",
  suffix = "",
  className,
}) {
  const animatedValue = useCountUp(value, duration);
  const text = Number(animatedValue).toLocaleString("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return <span className={className}>{`${prefix}${text}${suffix}`}</span>;
}

export function DashboardOverview({ transactions }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedPeriod = searchParams.get("period");
  const periodDays = VALID_PERIODS.has(selectedPeriod)
    ? Number(selectedPeriod)
    : 30;

  const handlePeriodChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("period", value);
    } else {
      params.delete("period");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const periodLabels = {
    7: "7 Days",
    30: "30 Days",
    90: "3 Months",
    180: "6 Months",
    365: "1 Year",
  };

  const chartData = useMemo(() => {
    const now = new Date();
    const startRange = subDays(now, periodDays);

    const rangeTransactions = transactions.filter(
      (t) => new Date(t.date) >= startRange && new Date(t.date) <= now,
    );

    const groupedByDay = {};
    rangeTransactions.forEach((t) => {
      const dayKey = format(new Date(t.date), "MMM d");
      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = {
          day: dayKey,
          income: 0,
          expense: 0,
          rawDate: new Date(t.date),
        };
      }

      if (t.type === "INCOME") {
        groupedByDay[dayKey].income += Number(t.amount || 0);
      } else {
        groupedByDay[dayKey].expense += Number(t.amount || 0);
      }
    });

    const bars = Object.values(groupedByDay)
      .sort((a, b) => a.rawDate - b.rawDate)
      .slice(-24)
      .map((item) => ({
        day: item.day,
        income: item.income,
        expense: item.expense,
      }));

    const incomeCount = rangeTransactions.filter(
      (t) => t.type === "INCOME",
    ).length;
    const expenseCount = rangeTransactions.filter(
      (t) => t.type === "EXPENSE",
    ).length;

    return { bars, incomeCount, expenseCount };
  }, [transactions, periodDays]);

  const expenseData = useMemo(() => {
    const now = new Date();
    const periodStart = subDays(now, periodDays);

    const monthlyExpenses = transactions.filter(
      (t) =>
        t.type === "EXPENSE" &&
        new Date(t.date) >= periodStart &&
        new Date(t.date) <= now,
    );

    const categoryMap = {};
    monthlyExpenses.forEach((t) => {
      const categoryId = t.category || "other-expense";
      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = 0;
      }
      categoryMap[categoryId] += Number(t.amount || 0);
    });

    const pieData = Object.entries(categoryMap)
      .map(([categoryId, amount]) => {
        const category = defaultCategories.find((c) => c.id === categoryId);
        return {
          name: category?.name || categoryId,
          value: Number(amount.toFixed(2)),
          color: category?.color || "#94a3b8",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const totalExpenses = monthlyExpenses.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );

    const pieDataWithPercent = pieData.map((item) => ({
      ...item,
      percent: totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0,
    }));

    return {
      pieData: pieDataWithPercent,
      totalExpenses,
    };
  }, [transactions, periodDays]);

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="border-[#DDE4E5] shadow-xl md:col-span-3 rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-[#32484F]">
                Transaction Overview
              </CardTitle>
              <p className="text-xs text-[#6E858B] mt-1">
                Showing total transactions for last {periodDays} days
              </p>
            </div>

            <Select
              value={String(periodDays)}
              onValueChange={handlePeriodChange}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs border-none bg-white/40 backdrop-blur-sm rounded-xl focus:ring-0">
                <Calendar className="h-3.5 w-3.5 mr-2 text-[#64748B]" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/20 bg-white/80 backdrop-blur-lg shadow-2xl">
                {Array.from(VALID_PERIODS).map((p) => (
                  <SelectItem
                    key={p}
                    value={p}
                    className="text-xs text-[#64748B] focus:bg-[#EEF6F8] focus:text-[#32484F] cursor-pointer py-2"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{periodLabels[p]}</span>
                      {String(periodDays) === p && (
                        <Check className="h-3 w-3 ml-2 text-[#64748B]" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6 pt-3">
            <div>
              <p className="text-[11px] text-[#6E858B]">No of Income</p>
              <p className="text-4xl font-bold text-green-600">
                <AnimatedValue value={chartData.incomeCount} />
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#6E858B]">No of Expenses</p>
              <p className="text-4xl font-bold text-red-600">
                <AnimatedValue value={chartData.expenseCount} />
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {chartData.bars.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No transactions found for this range.
            </p>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.bars} barGap={2}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#EEF3F5"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      `₹${new Intl.NumberFormat("en-IN").format(v)}`
                    }
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => `₹${Number(value).toFixed(2)}`}
                  />
                  <Bar
                    dataKey="expense"
                    name="Expenses"
                    fill="#E87171"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#70D49E"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#DDE4E5] shadow-xl md:col-span-2 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#32484F]">
            Expenses Breakdown
          </CardTitle>
          <p className="text-xs text-[#6E858B] mt-1">
            Total expenses for selected period
          </p>
        </CardHeader>
        <CardContent>
          {expenseData.pieData.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No expenses this month
            </p>
          ) : (
            <div className="space-y-4">
              <div className="relative h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData.pieData}
                      cx="50%"
                      cy="50%"
                      // Use percentage radii so the donut scales with container
                      // Make the donut ring thinner by increasing inner radius
                      innerRadius="58%"
                      outerRadius="78%"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={3}
                    >
                      {expenseData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₹${Number(value).toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {/* Scale center amount font size based on length so it doesn't overlap the donut */}
                  {(() => {
                    const amount = expenseData.totalExpenses || 0;
                    const formatted = Number(amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });
                    const len = formatted.length;
                    // Compute font size (px) with a simple linear scale, clamp between 14 and 36
                    const fontSize = Math.max(
                      14,
                      Math.min(36, Math.round(36 - len * 1.3)),
                    );

                    return (
                      <>
                        <p
                          className="font-bold text-[#32484F]"
                          style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
                        >
                          <AnimatedValue
                            value={amount}
                            minimumFractionDigits={2}
                            maximumFractionDigits={2}
                            prefix="₹"
                          />
                        </p>
                        <p className="text-xs text-[#6E858B]">Total Spent</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-2">
                {expenseData.pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#32484F]">{item.name}</span>
                    </div>
                    <span className="text-[#6E858B]">
                      <AnimatedValue
                        value={item.value}
                        minimumFractionDigits={2}
                        maximumFractionDigits={2}
                        prefix="₹"
                      />{" "}
                      ({item.percent.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
