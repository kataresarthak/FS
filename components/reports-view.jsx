"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import ReportSettingsDrawer from "@/components/report-settings-drawer";
import useFetch from "@/hooks/use-fetch";
import { resendReport, triggerEmailReport } from "@/actions/report";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { 
  Mail, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Trash,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet
} from "lucide-react";
import { deleteReport } from "@/actions/delete-report";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportsView({ history = [], reportData }) {
  const { month, stats } = reportData || {};
  const router = useRouter();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(history.length / rowsPerPage));

  const pagedHistory = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return history.slice(start, start + rowsPerPage);
  }, [history, page, rowsPerPage]);

  const startIdx = history.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIdx = Math.min(page * rowsPerPage, history.length);

  const handleRowsPerPageChange = (event) => {
    const next = Number(event.target.value);
    setRowsPerPage(next);
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Section */}
      <section
        className="rounded-3xl px-6 py-8 md:px-8 md:py-10"
        style={{
          background: "linear-gradient(to right, #1A2436, #142033, #1A2436)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Financial Reports
            </h1>
            <p className="text-sm font-medium" style={{ color: "#A7B8BD" }}>
              Comprehensive history of your automated email summaries
            </p>
          </div>

          <ReportSettingsDrawer>
            <Button
              className="h-10 px-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl border-none font-semibold"
              style={{
                background:
                  "linear-gradient(to right, #32484F, #233A41, #CAA166)",
              }}
            >
              Report Settings
            </Button>
          </ReportSettingsDrawer>
        </div>
      </section>

      {/* Monthly Summary Section */}
      {reportData && (
        <div className="px-2 pb-2">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-3xl border shadow-[0_0_40px_rgba(0,0,0,0.08)] p-6 md:p-8" style={{ borderColor: "#DDE4E5" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#32484F]">Monthly Summary - {month}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#6E858B] opacity-70">
                  Real-time financial performance overview
                </p>
              </div>
              <div className="flex items-center gap-3">
                <SendEmailButton type="last-month" label="Last Month Report" />
                <SendEmailButton type="current" label="Current Progress" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col gap-1 hover:bg-emerald-50 transition-colors">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <ArrowUpCircle className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Income</span>
                </div>
                <p className="text-2xl font-bold text-[#32484F] tabular-nums tracking-tighter">
                  ₹{stats?.totalIncome?.toLocaleString()}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col gap-1 hover:bg-rose-50 transition-colors">
                <div className="flex items-center gap-2 text-rose-600 mb-1">
                  <ArrowDownCircle className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Expenses</span>
                </div>
                <p className="text-2xl font-bold text-[#32484F] tabular-nums tracking-tighter">
                  ₹{stats?.totalExpenses?.toLocaleString()}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col gap-1 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Net Balance</span>
                </div>
                <p className="text-2xl font-bold text-[#32484F] tabular-nums tracking-tighter">
                  ₹{(stats?.totalIncome - stats?.totalExpenses).toLocaleString()}
                </p>
              </div>
            </div>

            </div>
          </div>
        </div>
      )}

      <div className="px-2 pb-8">
        <Card className="border-none shadow-[0_0_40px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {history.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#64748B]">
                No report emails have been sent yet.
              </div>
            ) : (
              <div className="rounded-xl border border-[#E8EEEF] bg-white overflow-hidden">
                <div className="overflow-x-auto overflow-y-hidden">
                  <table className="min-w-full">
                    <thead className="bg-[#F8FBFC]">
                      <tr className="hover:bg-[#F8FBFC] border-b">
                        <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground whitespace-nowrap">
                          Report Period
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground whitespace-nowrap">
                          Sent Date
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground whitespace-nowrap">
                          Recipient
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground whitespace-nowrap">
                          Message ID
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground whitespace-nowrap">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground whitespace-nowrap text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {pagedHistory.map((log) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                          <td className="py-4 px-6 text-sm font-medium text-slate-700">
                            {log.subject}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {format(new Date(log.sentAt), "PPp")}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {log.email}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500 max-w-[150px] truncate" title={log.providerMessageId || ""}>
                            {log.providerMessageId || "-"}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge
                              variant="outline"
                              className={
                                log.status === "SENT"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                              }
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <ResendButton
                                log={log}
                                onDone={() => router.refresh()}
                              />
                              <DeleteButton
                                log={log}
                                onDone={() => router.refresh()}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 bg-white border-t border-[#EEF1F2] rounded-b-lg">
                  <p className="text-xs text-muted-foreground">
                    Showing {startIdx}-{endIdx} of {history.length}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Rows per page
                      </span>
                      <Select
                        value={String(rowsPerPage)}
                        onValueChange={(value) => handleRowsPerPageChange({ target: { value } })}
                      >
                        <SelectTrigger className="h-8 w-[78px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SendEmailButton({ type = "last-month", label = "Send to Email" }) {
  const router = useRouter();
  const { fn, loading } = useFetch(triggerEmailReport);

  const handle = async () => {
    try {
      const res = await fn(type);
      if (res?.success) {
        toast.success(`${label} sent successfully!`);
        router.refresh();
      } else {
        toast.error(res?.error?.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(`Failed to send ${label.toLowerCase()}`);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handle}
      disabled={loading}
      className={
        type === "current"
          ? "h-8 gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-100"
          : "h-8 gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-100"
      }
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}

function ResendButton({ log, onDone }) {
  const { fn, loading } = useFetch(resendReport);

  const handle = async () => {
    try {
      const res = await fn(log.id);
      if (res?.success) {
        toast.success("Report resent");
        onDone?.();
      } else {
        toast.error(res?.error?.message || "Failed to resend");
      }
    } catch (error) {
      toast.error("Failed to resend");
    }
  };

  return (
    <Button variant="outline" onClick={handle} disabled={loading}>
      Resend
    </Button>
  );
}

function DeleteButton({ log, onDone }) {
  const { fn, loading } = useFetch(deleteReport);

  const handle = async () => {
    try {
      const res = await fn(log.id);
      if (res?.success) {
        toast.success("Report deleted");
        onDone?.();
      } else {
        toast.error(res?.error?.message || "Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handle}
      disabled={loading}
      className="h-9 w-9 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-100"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash className="h-4 w-4" />
      )}
    </Button>
  );
}
