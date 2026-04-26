"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, RefreshCw } from "lucide-react";

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function RecentTransactionsTable({ transactions }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "#E8EEEF" }}
    >
      <Table>
        <TableHeader className="bg-[#F8FBFC]">
          <TableRow className="hover:bg-[#F8FBFC]">
            <TableHead>Date Created</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right pr-4">Amount</TableHead>
            <TableHead className="text-center">Payment Type</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedId(
                      expandedId === transaction.id ? null : transaction.id,
                    )
                  }
                >
                  <TableCell>
                    {format(new Date(transaction.date), "PP")}
                  </TableCell>
                  <TableCell className="capitalize">
                    {transaction.category}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        transaction.type === "EXPENSE"
                          ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold pr-4 ${
                      transaction.type === "EXPENSE"
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}₹
                    {Number(transaction.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {transaction.paymentMethod
                      ? transaction.paymentMethod
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase(),
                          )
                          .join(" ")
                      : "-"}
                  </TableCell>
                </TableRow>
                {expandedId === transaction.id && (
                  <TableRow>
                    <TableCell colSpan={5} className="bg-muted/50 p-4">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm">
                        <div>
                          <span className="font-semibold text-muted-foreground mr-2">
                            Description:
                          </span>
                          {transaction.description || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground mr-2">
                            Account:
                          </span>
                          {transaction.account?.name || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground mr-2">
                            Frequency:
                          </span>
                          {transaction.isRecurring ? (
                            <span className="inline-flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              {
                                RECURRING_INTERVALS[
                                  transaction.recurringInterval
                                ]
                              }
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              One-time
                            </span>
                          )}
                        </div>
                        {transaction.isRecurring &&
                          transaction.nextRecurringDate && (
                            <div>
                              <span className="font-semibold text-muted-foreground mr-2">
                                Next Recurring:
                              </span>
                              {format(
                                new Date(transaction.nextRecurringDate),
                                "PPP",
                              )}
                            </div>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
