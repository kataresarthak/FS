"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";
import { CreateAccountDrawer } from "@/components/create-account-drawer";

// Payment method removed — keep transaction schema minimal

export function AddTransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
  onSuccess,
  redirectOnSuccess = true,
  accountsLoading = false,
  onOpenCreateAccount,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") || initialData?.id;
  const [notes, setNotes] = useState(initialData?.description || "");
  const [isAccountSelectOpen, setIsAccountSelectOpen] = useState(false);

  const defaultAccountId = useMemo(
    () => accounts.find((ac) => ac.isDefault)?.id || accounts[0]?.id || "",
    [accounts],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData
      ? {
          type: initialData.type || "EXPENSE",
          amount: initialData.amount?.toString() || "",
          description: initialData.description || "",
          accountId: initialData.accountId || defaultAccountId,
          category: initialData.category || "other-expense",
          paymentMethod: initialData.paymentMethod || "CASH",
          date: new Date(initialData.date || new Date()),
          isRecurring: initialData.isRecurring || false,
          ...(initialData.recurringInterval && {
            recurringInterval: initialData.recurringInterval,
          }),
        }
      : {
          type: "EXPENSE",
          amount: "",
          description: "",
          accountId: defaultAccountId,
          paymentMethod: "CASH",
          date: new Date(),
          isRecurring: false,
        },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  useEffect(() => {
    if (!getValues("accountId") && defaultAccountId) {
      setValue("accountId", defaultAccountId);
    }
  }, [defaultAccountId, getValues, setValue]);

  useEffect(() => {
    if (!initialData) return;

    reset({
      type: initialData.type || "EXPENSE",
      amount: initialData.amount?.toString() || "",
      description: initialData.description || "",
      accountId: initialData.accountId || defaultAccountId,
      category: initialData.category || "other-expense",
      paymentMethod: initialData.paymentMethod || "CASH",
      date: new Date(initialData.date || new Date()),
      isRecurring: initialData.isRecurring || false,
      ...(initialData.recurringInterval && {
        recurringInterval: initialData.recurringInterval,
      }),
    });
    setNotes(initialData.description || "");
  }, [initialData, defaultAccountId, reset]);

  const onSubmit = (data) => {
    const formData = {
      ...data,
      date: data.date || new Date(),
      amount: parseFloat(data.amount),
      description: notes.trim() || undefined,
    };

    if (editMode) {
      transactionFn(editId, formData);
    } else {
      transactionFn(formData);
    }
  };

  const handleScanComplete = useCallback(
    (scannedData) => {
      if (scannedData?.success && scannedData?.data) {
        const data = scannedData.data;
        setValue("amount", data.amount.toString());
        // Always use the current scan date for new entries.
        setValue("date", new Date());
        setValue("type", "EXPENSE"); // Receipts are always expenses
        if (data.description) {
          setNotes(data.description);
        }
        if (data.category) {
          setValue("category", data.category);
        }
      }
    },
    [setValue],
  );

  const successHandledRef = useRef(false);

  useEffect(() => {
    if (transactionLoading) {
      successHandledRef.current = false;
    }
  }, [transactionLoading]);

  useEffect(() => {
    if (
      transactionResult?.success &&
      !transactionLoading &&
      !successHandledRef.current
    ) {
      successHandledRef.current = true;
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully",
      );

      if (transactionResult?.budgetNotification) {
        const alert = transactionResult.budgetNotification;
        if (alert.level === "critical") {
          toast.error(alert.message);
        } else {
          toast.warn(alert.message);
        }
      }

      reset();
      onSuccess?.(transactionResult.data);
      if (redirectOnSuccess) {
        router.push(`/transactions`);
      } else {
        // Try a same-path replace to keep history consistent, then ensure
        // server components are re-fetched with router.refresh(). A short
        // delay gives the server a moment to complete revalidation.
        try {
          router.replace(window.location.pathname);
        } catch (e) {
          // ignore replace errors in non-window contexts
        }

        // Ensure a fresh server render — run after a small delay to let
        // revalidatePath finish on the server.
        setTimeout(() => {
          try {
            router.refresh();
          } catch (e) {
            /* noop */
          }
        }, 300);
      }
    }
  }, [
    transactionResult,
    transactionLoading,
    editMode,
    onSuccess,
    redirectOnSuccess,
    reset,
    router,
  ]);

  const type = watch("type");
  const isRecurring = watch("isRecurring");

  const filteredCategories = categories.filter(
    (category) => category.type === type,
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* AI Receipt Scanner */}
      <ReceiptScanner onScanComplete={handleScanComplete} />

      <hr className="border-[#E8EEEF]" />

      {/* Transaction Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" style={{ color: "#32484F" }}>
          Transaction Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setValue("type", "INCOME", { shouldValidate: true })}
            className={cn(
              "h-9 rounded-lg text-xs font-medium",
              type === "INCOME"
                ? "border-[#32484F] text-[#233A41] bg-[#EEF6F8]"
                : "border-[#DDE4E5] text-[#32484F] bg-white hover:bg-[#F8FBFC]",
            )}
          >
            <span
              className={cn(
                "mr-2 h-3.5 w-3.5 rounded-full border",
                type === "INCOME" ? "border-[#233A41]" : "border-[#9CA3AF]",
              )}
            >
              <span
                className={cn(
                  "mx-auto mt-[2px] block h-2 w-2 rounded-full",
                  type === "INCOME" ? "bg-[#233A41]" : "bg-transparent",
                )}
              />
            </span>
            Income
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setValue("type", "EXPENSE", { shouldValidate: true })
            }
            className={cn(
              "h-9 rounded-lg text-xs font-medium",
              type === "EXPENSE"
                ? "border-[#32484F] text-[#233A41] bg-[#EEF6F8]"
                : "border-[#DDE4E5] text-[#32484F] bg-white hover:bg-[#F8FBFC]",
            )}
          >
            <span
              className={cn(
                "mr-2 h-3.5 w-3.5 rounded-full border",
                type === "EXPENSE" ? "border-[#233A41]" : "border-[#9CA3AF]",
              )}
            >
              <span
                className={cn(
                  "mx-auto mt-[2px] block h-2 w-2 rounded-full",
                  type === "EXPENSE" ? "bg-[#233A41]" : "bg-transparent",
                )}
              />
            </span>
            Expense
          </Button>
        </div>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      <div className="space-y-2.5">
        {/* Category */}
        <div className="space-y-1">
          <label htmlFor="category-select" className="text-sm font-medium" style={{ color: "#32484F" }}>
            Category
          </label>
          <Select
            value={watch("category")}
            onValueChange={(value) => setValue("category", value)}
            onOpenChange={(open) => {
              if (!open) {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }
            }}
          >
            <SelectTrigger id="category-select" aria-label="Select category" className="h-9 cursor-pointer border-[#DDE4E5] bg-white text-sm">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent usePortal={false}>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Amount */}
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: "#32484F" }}>
              Amount
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="₹0.00"
              {...register("amount")}
              className="h-9 border-[#DDE4E5] bg-white text-sm"
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Account */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium"
                style={{ color: "#32484F" }}
              >
                Account
              </label>
            </div>
            {accounts.length === 0 && !accountsLoading ? (
              onOpenCreateAccount ? (
                <Button
                  type="button"
                  id="account-select"
                  variant="outline"
                  onClick={() => {
                    document.activeElement?.blur();
                    onOpenCreateAccount();
                  }}
                  className="h-9 w-full border-dashed border-[#DDE4E5] text-muted-foreground bg-[#F8FBFC] hover:bg-[#EEF6F8] justify-start"
                >
                  + Create
                </Button>
              ) : (
                <CreateAccountDrawer onSuccess={() => window.location.reload()}>
                  <Button
                    type="button"
                    id="account-select"
                    variant="outline"
                    className="h-9 w-full border-dashed border-[#DDE4E5] text-muted-foreground bg-[#F8FBFC] hover:bg-[#EEF6F8] justify-start"
                  >
                    + Create
                  </Button>
                </CreateAccountDrawer>
              )
            ) : (
              <Select
                open={isAccountSelectOpen}
                onOpenChange={(open) => {
                  setIsAccountSelectOpen(open);
                  if (!open) {
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }
                }}
                value={watch("accountId")}
                onValueChange={(value) =>
                  setValue("accountId", value, { shouldValidate: true })
                }
                disabled={accountsLoading}
              >
                <SelectTrigger id="account-select" aria-label="Select account" className="h-9 cursor-pointer border-[#DDE4E5] bg-white text-sm">
                  <SelectValue
                    placeholder={
                      accountsLoading ? "Loading accounts..." : "Select account"
                    }
                  />
                </SelectTrigger>
                <SelectContent usePortal={false}>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                  {onOpenCreateAccount ? (
                    <div
                      onClick={() => {
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                        setIsAccountSelectOpen(false);
                        onOpenCreateAccount();
                      }}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                    >
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center font-bold">
                        +
                      </span>
                      Create
                    </div>
                  ) : (
                    <CreateAccountDrawer
                      onSuccess={() => window.location.reload()}
                    >
                      <div 
                        onClick={() => {
                          if (document.activeElement instanceof HTMLElement) {
                            document.activeElement.blur();
                          }
                          setIsAccountSelectOpen(false);
                        }}
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center font-bold">
                          +
                        </span>
                        Create
                      </div>
                    </CreateAccountDrawer>
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.accountId && (
              <p className="text-sm text-red-500">{errors.accountId.message}</p>
            )}
          </div>
        </div>
        {/* Payment Method */}
        <div className="space-y-1">
          <label htmlFor="payment-method-select" className="text-sm font-medium" style={{ color: "#32484F" }}>
            Payment Method
          </label>
          <Select
            value={watch("paymentMethod")}
            onValueChange={(value) => setValue("paymentMethod", value)}
            onOpenChange={(open) => {
              if (!open) {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }
            }}
          >
            <SelectTrigger id="payment-method-select" aria-label="Select payment method" className="h-9 cursor-pointer border-[#DDE4E5] bg-white text-sm">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent usePortal={false}>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.paymentMethod && (
            <p className="text-sm text-red-500">
              {errors.paymentMethod.message}
            </p>
          )}
        </div>
      </div>

      {/* Recurring Toggle */}
      <div
        className="flex flex-row items-center justify-between rounded-lg border bg-white p-2.5"
        style={{ borderColor: "#DDE4E5" }}
      >
        <div className="space-y-0.5">
          <label className="text-sm font-medium" style={{ color: "#32484F" }}>
            Recurring Transaction
          </label>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>

      {/* Recurring Interval */}
      {isRecurring && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#32484F" }}>
            Recurring Interval
          </label>
          <Select
            onValueChange={(value) => setValue("recurringInterval", value)}
            defaultValue={getValues("recurringInterval")}
            onOpenChange={(open) => {
              if (!open) {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }
            }}
          >
            <SelectTrigger className="h-9 cursor-pointer border-[#DDE4E5] bg-white text-sm">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent usePortal={false}>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      {/* Description */}
      <div className="space-y-1">
        <label className="text-sm font-medium" style={{ color: "#32484F" }}>
          Description (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={1}
          placeholder="Add notes about this transaction"
          className="w-full rounded-md border border-[#DDE4E5] bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#32484F]"
        />
      </div>

      {/* Actions */}
      <div className="pt-0.5">
        <Button
          type="submit"
          className="h-9 w-full rounded-md text-sm font-semibold text-white transition-colors duration-150 bg-[#233A41] hover:bg-[#32484F] focus:ring-2 focus:ring-[#CAA166]"
          disabled={transactionLoading}
        >
          {transactionLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? "Updating..." : "Saving..."}
            </>
          ) : editMode ? (
            "Update"
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}
