"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function ExportCsvButton({ transactions }) {
  const handleExport = () => {
    const headers = [
      "Date",
      "Category",
      "Type",
      "Amount",
      "Payment Method",
      "Recurring",
      "Description",
    ];

    const csvContent = [
      headers.join(","),
      ...transactions.map((t) => {
        const date = format(new Date(t.date), "yyyy-MM-dd");
        const description = t.description
          ? `"${t.description.replace(/"/g, '""')}"`
          : "";

        return [
          date,
          t.category,
          t.type,
          t.amount.toString(),
          t.paymentMethod || "-",
          t.isRecurring ? "Yes" : "No",
          description,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `all_transactions_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={handleExport}
      className="flex items-center gap-2 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover-gradient-button"
      style={{
        background: "linear-gradient(to right, #32484F, #233A41, #CAA166)",
      }}
    >
      <Download size={18} />
      <span className="hidden sm:inline font-medium">Export CSV</span>
    </Button>
  );
}
