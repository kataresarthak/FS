"use client";

import React, { useMemo, useState } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { defaultCategories } from "@/data/categories";
import { subDays, isAfter } from "date-fns";
import { Info, Calendar, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BUCKET_MAPPING = {
  fixed: ["housing", "transportation", "utilities", "healthcare", "education", "insurance", "bills"],
  discretionary: ["groceries", "entertainment", "food", "shopping", "personal", "travel", "gifts", "other-expense"],
};

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value || 0));

// --- Sub-components moved outside to prevent re-creation/GC pressure ---
const NodeTooltip = ({ node }) => (
  <div className="bg-white p-3 shadow-xl rounded-xl border border-[#DDE4E5] text-xs font-medium">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }} />
      <span className="text-[#32484F] font-bold">{node.id}</span>
    </div>
    <div className="text-[#6E858B]">
      Total: <span className="text-[#32484F]">{formatINR(node.value)}</span>
    </div>
  </div>
);

const LinkTooltip = ({ link }) => (
  <div className="bg-white p-3 shadow-xl rounded-xl border border-[#DDE4E5] text-xs font-medium">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[#32484F] font-bold">{link.source.id}</span>
      <span className="text-[#6E858B]">→</span>
      <span className="text-[#32484F] font-bold">{link.target.id}</span>
    </div>
    <div className="space-y-1">
      <div className="text-[#6E858B]">
        Amount: <span className="text-[#32484F] font-bold">{formatINR(link.value)}</span>
      </div>
      <div className="text-[#6E858B]">
        Percentage: <span className="text-blue-600 font-bold">
          {((link.value / link.source.value) * 100).toFixed(1)}%
        </span> <span className="text-[10px]">of {link.source.id}</span>
      </div>
    </div>
  </div>
);

export function CashFlowSankey({ transactions = [], days: initialDays }) {
  const [days, setDays] = useState(initialDays || "30");
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Keep internal state in sync if prop changes
  React.useEffect(() => {
    if (initialDays) setDays(initialDays);
  }, [initialDays]);

  const { data, periodLabel } = useMemo(() => {
    if (!transactions.length) return { data: { nodes: [], links: [] }, periodLabel: "" };

    const now = new Date();
    const startDate = subDays(now, parseInt(days));
    const periodTransactions = transactions.filter(t => isAfter(new Date(t.date), startDate));

    const incomeTransactions = periodTransactions.filter(t => t.type === "INCOME");
    const expenseTransactions = periodTransactions.filter(t => t.type === "EXPENSE");

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalSavings = Math.max(0, totalIncome - totalExpenses);

    const categoryTotals = expenseTransactions.reduce((acc, t) => {
      const catId = t.category || "other-expense";
      acc[catId] = (acc[catId] || 0) + Number(t.amount || 0);
      return acc;
    }, {});

    const fixedTotals = {};
    const discretionaryTotals = {};
    let totalFixed = 0;
    let totalDiscretionary = 0;

    Object.entries(categoryTotals).forEach(([catId, amount]) => {
      if (BUCKET_MAPPING.fixed.includes(catId)) {
        fixedTotals[catId] = amount;
        totalFixed += amount;
      } else {
        discretionaryTotals[catId] = amount;
        totalDiscretionary += amount;
      }
    });

    const nodes = [
      { id: "Total Income", color: "#22c55e" },
      { id: "Fixed Bills", color: "#3b82f6" },
      { id: "Discretionary", color: "#f59e0b" },
      { id: "Savings/Investments", color: "#10b981" },
    ];

    const links = [
      { source: "Total Income", target: "Fixed Bills", value: totalFixed },
      { source: "Total Income", target: "Discretionary", value: totalDiscretionary },
      { source: "Total Income", target: "Savings/Investments", value: totalSavings },
    ];

    Object.entries(fixedTotals).forEach(([catId, amount]) => {
      if (amount <= 0) return;
      const category = defaultCategories.find(c => c.id === catId);
      const name = category?.name || catId;
      nodes.push({ id: name, color: "#32484F" });
      links.push({ source: "Fixed Bills", target: name, value: amount });
    });

    Object.entries(discretionaryTotals).forEach(([catId, amount]) => {
      if (amount <= 0) return;
      const category = defaultCategories.find(c => c.id === catId);
      const name = category?.name || catId;
      nodes.push({ id: name, color: "#ef4444" });
      links.push({ source: "Discretionary", target: name, value: amount });
    });

    const activeNodeIds = new Set();
    links.forEach(l => {
      activeNodeIds.add(l.source);
      activeNodeIds.add(l.target);
    });

    return {
      data: {
        nodes: nodes.filter(n => activeNodeIds.has(n.id)),
        links: links.filter(l => l.value > 0),
      },
      periodLabel: days === "7" ? "7 Days" : days === "30" ? "30 Days" : days === "90" ? "3 Months" : days === "180" ? "6 Months" : "1 Year"
    };
  }, [transactions, days]);

  if (!mounted) return null;

  return (
    <div className="w-full bg-white border border-[#DDE4E5] rounded-3xl overflow-hidden shadow-sm">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-none gap-4">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-[#32484F] flex items-center gap-2">
            Cash Flow Breakdown
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center cursor-help">
                    <Info className="h-4 w-4 text-[#94A3B8] hover:text-[#1E293B] transition-colors" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-4 bg-white border-white/20 shadow-2xl rounded-2xl" side="right">
                  <div className="space-y-3">
                    <p className="font-bold text-[#1E293B]">Deciphering Your Cash Flow</p>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      This diagram maps the path of your money from earning to spending.
                    </p>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[#1E293B] uppercase tracking-wider">The Hierarchy:</p>
                      <ul className="text-[10px] text-[#64748B] list-decimal pl-4 space-y-1">
                        <li><span className="font-semibold text-[#1E293B]">Total Income</span>: The source of all funds.</li>
                        <li><span className="font-semibold text-[#1E293B]">Buckets</span>: Money is split into <span className="text-blue-600">Fixed Bills</span> (needs) and <span className="text-amber-600">Discretionary</span> (wants).</li>
                        <li><span className="font-semibold text-[#1E293B]">Categories</span>: Final destinations like Rent, Food, or Travel.</li>
                      </ul>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] italic">
                      Tip: Wider &quot;pipes&quot; indicate larger financial drains. Thick lines to &quot;Savings&quot; represent a healthy savings rate.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
          </CardTitle>
          <CardDescription className="text-[#64748B] text-sm font-medium">
            Visualizing the journey of your money for the {periodLabel}
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[140px] h-9 text-xs border-none bg-white/40 backdrop-blur-sm rounded-xl focus:ring-0">
              <Calendar className="h-3.5 w-3.5 mr-2 text-[#64748B]" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/20 bg-white/80 backdrop-blur-lg shadow-2xl">
              {[
                { value: "7", label: "7 Days" },
                { value: "30", label: "30 Days" },
                { value: "90", label: "3 Months" },
                { value: "180", label: "6 Months" },
                { value: "365", label: "1 Year" },
              ].map((p) => (
                <SelectItem
                  key={p.value}
                  value={p.value}
                  className="text-xs text-[#64748B] focus:bg-[#EEF6F8] focus:text-[#32484F] cursor-pointer py-2"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{p.label}</span>
                    {days === p.value && (
                      <Check className="h-3 w-3 ml-2 text-[#64748B]" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {!data.nodes.length ? (
            <div className="h-[400px] w-full flex items-center justify-center text-[#64748B] text-sm font-medium italic">
                No transaction data available for this range.
            </div>
        ) : (
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                <div className="h-[480px] min-w-[700px] lg:min-w-full">
                    <ResponsiveSankey
                        data={data}
                        margin={{ top: 20, right: 240, bottom: 20, left: 240 }}
                        align="center"
                        colors={(node) => node.color}
                        nodeOpacity={0.9}
                        nodeHoverOpacity={1}
                        nodeThickness={20}
                        nodeInnerPadding={4}
                        nodeSpacing={32}
                        nodeBorderWidth={0}
                        linkOpacity={0.2}
                        linkHoverOpacity={0.4}
                        linkContract={4}
                        enableLinkGradient={true}
                        labelPosition="outside"
                        labelOrientation="horizontal"
                        labelPadding={16}
                        labelTextColor={{
                            from: "color",
                            modifiers: [["darker", 1.2]],
                        }}
                        label={(node) => `${node.id}: ${formatINR(node.value)}`}
                        nodeTooltip={NodeTooltip}
                        linkTooltip={LinkTooltip}
                        theme={{
                            labels: {
                            text: {
                                fontSize: 12,
                                fontWeight: 800,
                                fill: "#1E293B",
                                className: "tabular-nums"
                            },
                            },
                        }}
                    />
                </div>
            </div>
        )}
      </CardContent>
    </div>
  );
}
