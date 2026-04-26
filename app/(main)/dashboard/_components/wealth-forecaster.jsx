"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  Line,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, Landmark, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from "date-fns";
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

// --- Sub-components moved outside to prevent re-creation ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.isFuture ? data.projected : data.actual;
    return (
      <div className="bg-white p-3 shadow-xl rounded-xl border border-[#DDE4E5]">
        <p className="font-bold text-[#32484F] mb-1">{data.month}</p>
        <p className="text-sm font-semibold text-[#32484F]">
          {formatINR(value)}
        </p>
        <p className="text-[10px] text-[#6E858B] mt-0.5">
          {data.isFuture ? "AI Projection" : "Actual Balance"}
        </p>
      </div>
    );
  }
  return null;
};

export function WealthForecaster({ transactions = [], accounts = [] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [shoppingReduction, setShoppingReduction] = useState([0]);
  const [savingsIncrease, setSavingsIncrease] = useState([0]);

  const { chartData, currentMonthlyShopping, baseMonthlyGrowth, totalBalance } = useMemo(() => {
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    const now = new Date();
    const pastMonthsData = [];
    let rollingBalance = totalBalance;

    for (let i = 0; i < 3; i++) {
      const targetDate = subMonths(now, i);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = i === 0 ? now : endOfMonth(targetDate);
      const monthLabel = format(targetDate, "MMM");

      const monthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd;
      });

      const netChange = monthTransactions.reduce((sum, t) => {
        return t.type === "INCOME" ? sum + Number(t.amount) : sum - Number(t.amount);
      }, 0);

      const shoppingAmount = monthTransactions
        .filter(t => t.type === "EXPENSE" && t.category === "shopping")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      pastMonthsData.unshift({
        month: monthLabel,
        fullMonth: format(targetDate, "MMM yyyy"), // Unique identifier
        balance: rollingBalance,
        netChange,
        shoppingAmount,
        isFuture: false,
      });

      rollingBalance -= netChange;
    }

    const avgNetChange = pastMonthsData.reduce((sum, m) => sum + m.netChange, 0) / Math.max(1, pastMonthsData.length);
    const avgShopping = pastMonthsData.reduce((sum, m) => sum + m.shoppingAmount, 0) / Math.max(1, pastMonthsData.length);

    const futureData = [];
    let projectedRollingBalance = totalBalance;
    const monthlyExtraSavings = (avgShopping * (shoppingReduction[0] / 100)) + savingsIncrease[0];

    for (let i = 1; i <= 6; i++) {
      const futureDate = addMonths(now, i);
      projectedRollingBalance += (avgNetChange + monthlyExtraSavings);
      futureData.push({
        month: format(futureDate, "MMM"),
        fullMonth: format(futureDate, "MMM yyyy"), // Unique identifier
        balance: projectedRollingBalance,
        isFuture: true,
      });
    }

    const combined = [...pastMonthsData, ...futureData];
    const finalData = combined.map((d, idx) => {
      const isTransition = !d.isFuture && (idx + 1 < combined.length && combined[idx + 1].isFuture);

      return {
        ...d,
        actual: d.isFuture ? null : d.balance,
        projected: (d.isFuture || isTransition) ? d.balance : null
      };
    });

    return {
      chartData: finalData,
      currentMonthlyShopping: avgShopping,
      baseMonthlyGrowth: avgNetChange,
      totalBalance
    };
  }, [transactions, accounts, shoppingReduction, savingsIncrease]);

  if (!mounted) return null;

  if (!accounts.length && !transactions.length) {
    return (
      <Card className="w-full border-[#DDE4E5] shadow-sm rounded-2xl bg-white p-6 text-center text-[#6E858B]">
        Insufficient data for AI wealth forecasting.
      </Card>
    );
  }

  const currentMonthLabel = format(new Date(), "MMM");

  return (
    <div className="w-full bg-white border border-[#DDE4E5] rounded-3xl overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-none">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight text-[#32484F] flex items-center gap-2">
            AI Wealth Forecaster
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-[#6E858B] cursor-help hover:text-[#32484F] transition-colors opacity-40 hover:opacity-100" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-4 bg-white/90 backdrop-blur-md border-white/20 shadow-2xl rounded-2xl" side="right">
                <div className="space-y-2 text-left">
                  <p className="font-bold text-[#32484F]">Fortune Simulator</p>
                  <p className="text-xs text-[#6E858B] leading-relaxed font-medium">
                    Predicts your future net worth by analyzing your historical income and spending habits.
                  </p>
                  <ul className="text-[10px] text-[#6E858B] list-disc pl-4 space-y-1 font-bold">
                    <li><span className="text-[#32484F]">Simulation</span>: Move the sliders to see how small lifestyle changes impact your long-term wealth.</li>
                    <li><span className="text-[#32484F]">AI Projection</span>: Uses linear regression on your past 3 months to map the next 6 months.</li>
                  </ul>
                </div>
              </TooltipContent>
            </ShadcnTooltip>
          </CardTitle>
          <CardDescription className="text-sm text-[#6E858B]">
            Projected account balance based on your habits
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="colorPast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
              <XAxis
                dataKey="fullMonth"
                tickFormatter={(val) => val.split(' ')[0]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 11, className: "tabular-nums font-bold" }}
                tickFormatter={(value) => {
                  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
                  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                  return `₹${value}`;
                }}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="none"
                fill="url(#colorPast)"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#6366F1"
                strokeWidth={4}
                dot={{ r: 0 }}
                activeDot={{ r: 6, fill: "#6366F1", strokeWidth: 3, stroke: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#6366F1"
                strokeWidth={2}
                strokeDasharray="8 8"
                dot={false}
                connectNulls={true}
              />
              <ReferenceLine
                x={currentMonthLabel}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: 'NOW',
                  position: 'top',
                  fill: '#F59E0B',
                  fontSize: 11,
                  fontWeight: 'bold',
                  className: "tracking-widest"
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm text-[#6E858B] flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5 text-[#F43F5E]" />
                Shopping Reduction
              </label>
              <span className="text-sm font-bold text-emerald-600 tabular-nums">
                + {formatINR(currentMonthlyShopping * (shoppingReduction[0] / 100))}
              </span>
            </div>
            <Slider
              value={shoppingReduction}
              max={50}
              step={1}
              onValueChange={setShoppingReduction}
              className="py-4"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm text-[#6E858B] flex items-center gap-2">
                <Landmark className="h-3.5 w-3.5 text-indigo-500" />
                Extra Savings
              </label>
              <span className="text-sm font-bold text-emerald-600 tabular-nums">
                + {formatINR(savingsIncrease[0])}
              </span>
            </div>
            <Slider
              value={savingsIncrease}
              max={5000}
              step={100}
              onValueChange={setSavingsIncrease}
              className="py-4"
            />
          </div>
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-white/20 border border-white/30 text-sm">
          <p className="text-[#32484F] leading-relaxed">
            By making these adjustments, your projected net worth in <span className="font-bold">{chartData[chartData.length - 1].month}</span> could reach
            <span className="font-bold mx-2 tabular-nums text-lg text-emerald-600">
              {formatINR(chartData[chartData.length - 1].balance)}
            </span>.
            <br />
            <span className="text-xs text-[#6E858B] font-bold opacity-70">
              That&apos;s an extra {formatINR((chartData[chartData.length - 1].balance - (totalBalance + baseMonthlyGrowth * 6)))} compared to your current trajectory.
            </span>
          </p>
        </div>
      </CardContent>
    </div>
  );
}

