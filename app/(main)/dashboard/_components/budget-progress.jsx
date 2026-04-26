"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X, Info } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "react-toastify";

import {
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/budget";

export function BudgetProgress({
  initialBudget,
  currentExpenses,
  accounts = [],
  accountBreakdown = {},
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || "",
  );

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const activeExpenses =
    selectedAccountId === "all"
      ? currentExpenses
      : accountBreakdown[selectedAccountId] || 0;

  const percentUsed = initialBudget
    ? (activeExpenses / initialBudget.amount) * 100
    : 0;

  const budgetAlert = initialBudget
    ? percentUsed >= 100
      ? {
          level: "critical",
          message: `You are over budget by ₹${(
            activeExpenses - initialBudget.amount
          ).toFixed(2)} this month.`,
        }
      : percentUsed >= 80
        ? {
            level: "warning",
            message: `You have used ${percentUsed.toFixed(1)}% of your monthly budget.`,
          }
        : null
    : null;

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await updateBudgetFn(amount);
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  return (
    <div className="bg-white border border-[#DDE4E5] rounded-3xl overflow-hidden p-6 shadow-sm">
      <CardHeader className="p-0 pb-3 border-none">
        <div className="flex-1 w-full space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[#32484F] flex items-center gap-2">
              Monthly Budget
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 text-[#94A3B8] hover:text-[#1E293B]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Account Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedAccountId("all")}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                  selectedAccountId === "all"
                    ? "bg-[#32484F] text-white border-transparent"
                    : "bg-white/50 text-[#94A3B8] border-white/20 hover:bg-white"
                }`}
              >
                All Sources
              </button>
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border whitespace-nowrap ${
                    selectedAccountId === account.id
                      ? "bg-[#32484F] text-white border-transparent"
                      : "bg-white/50 text-[#94A3B8] border-white/20 hover:bg-white"
                  }`}
                >
                  {account.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              {isEditing ? (
                <div className="flex items-center gap-2 w-full">
                  <Input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-32 h-9 text-sm rounded-xl border-white/20 bg-white/50"
                    placeholder="₹"
                    autoFocus
                    disabled={isLoading}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleUpdateBudget}
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-bold text-[#32484F] tabular-nums">
                  {initialBudget
                    ? `₹${activeExpenses.toLocaleString("en-IN")} / ₹${initialBudget.amount.toLocaleString("en-IN")}`
                    : "No budget set"}
                </p>
              )}
              {!isEditing && initialBudget && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${percentUsed >= 90 ? "text-rose-500" : "text-emerald-500"}`}
                >
                  {percentUsed.toFixed(0)}% Used
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {initialBudget && (
          <div className="space-y-4">
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  percentUsed >= 90 ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" : 
                  percentUsed >= 75 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>

            {budgetAlert && (
              <div className={`mt-4 p-4 rounded-2xl text-[11px] font-bold uppercase tracking-tight ${
                 budgetAlert.level === "critical" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"
              }`}>
                {budgetAlert.message}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </div>
  );
}
