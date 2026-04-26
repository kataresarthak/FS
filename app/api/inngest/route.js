import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processRecurringTransaction,
  triggerRecurringTransactions,
  generateMonthlyReports,
  generateWeeklyReports,
  checkBudgetAlerts,
} from "@/lib/inngest/function";

// Re-export Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processRecurringTransaction,
    triggerRecurringTransactions,
    generateMonthlyReports,
    generateWeeklyReports,
    checkBudgetAlerts,
  ],
});
