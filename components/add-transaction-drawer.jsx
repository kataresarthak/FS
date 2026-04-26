"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "@/app/(main)/transaction/_components/transaction-form";
import { Drawer as DrawerPrimitive } from "vaul";
import { CreateAccountDrawer } from "@/components/create-account-drawer";

export default function AddTransactionDrawer({
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  editMode = false,
  initialData = null,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen =
    setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
  
  const closeButtonRef = useRef(null);

  const {
    loading: accountsLoading,
    fn: loadAccounts,
    data: accounts,
  } = useFetch(getUserAccounts);

  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setTodayLabel(
      new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
    );
  }, []);

  useEffect(() => {
    if (open && !accounts && !accountsLoading) {
      loadAccounts();
    }
  }, [open, accounts, accountsLoading, loadAccounts]);

  useEffect(() => {
    if (!open) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }

    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("add-transaction-drawer-toggle", {
        detail: { open },
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("add-transaction-drawer-toggle", {
          detail: { open: false },
        }),
      );
    };
  }, [open]);

  return (
    <>
      <DrawerPrimitive.Root open={open} onOpenChange={setOpen} direction="right">
        {children && <DrawerPrimitive.Trigger asChild>{children}</DrawerPrimitive.Trigger>}

        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <DrawerPrimitive.Content 
            onOpenAutoFocus={() => {
              closeButtonRef.current?.focus();
            }}
            className="fixed inset-auto right-2 top-2 bottom-2 z-50 w-[calc(100vw-16px)] max-w-[360px] flex flex-col bg-[#F5F5F6] border shadow-2xl overflow-y-auto overflow-x-hidden scrollbar-hide rounded-[32px] outline-none p-6 md:right-0 md:top-0 md:border-y-0 md:border-r-0 md:bottom-0 md:h-screen md:w-full md:max-h-screen md:rounded-none md:border-l"
          >
            <div className="relative mb-6 px-1">
              <div className="pr-8">
                <DrawerPrimitive.Title asChild>
                  <h2
                    className="text-xl leading-6 font-bold text-size-3xl"
                    style={{ color: "#111827" }}
                  >
                    {editMode ? "Edit Transaction" : "Add Transaction"}
                  </h2>
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description asChild>
                  <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>
                    Today: {todayLabel}
                  </p>
                </DrawerPrimitive.Description>
              </div>

              <DrawerPrimitive.Close asChild>
                <Button
                  ref={closeButtonRef}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-8 w-8 text-[#111827] rounded-full hover:bg-black/5"
                  aria-label="Close panel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerPrimitive.Close>
            </div>

            <div>
              <AddTransactionForm
                accounts={accounts || []}
                categories={defaultCategories}
                editMode={editMode}
                initialData={initialData}
                onSuccess={() => setOpen(false)}
                redirectOnSuccess={false}
                accountsLoading={accountsLoading}
                onOpenCreateAccount={() => {
                  setOpen(false);
                  setTimeout(() => {
                    setIsAccountDrawerOpen(true);
                  }, 100);
                }}
              />
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>

      <CreateAccountDrawer
        open={isAccountDrawerOpen}
        onOpenChange={setIsAccountDrawerOpen}
        onSuccess={() => {
          loadAccounts();
        }}
      />
    </>
  );
}
