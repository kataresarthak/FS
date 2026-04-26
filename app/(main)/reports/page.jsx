import { Suspense } from "react";
import { getEmailReportHistory } from "@/actions/report";
import ReportsView from "@/components/reports-view";
import { Loader2 } from "lucide-react";

import { getMonthlyReportData } from "@/actions/report";

async function ReportsDataWrapper() {
  const [history, reportData] = await Promise.all([
    getEmailReportHistory(),
    getMonthlyReportData(),
  ]);
  return <ReportsView history={history} reportData={reportData} />;
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: "#CAA166" }} />
          <p className="text-lg font-medium" style={{ color: "#6E858B" }}>Loading report history...</p>
        </div>
      }
    >
      <ReportsDataWrapper />
    </Suspense>
  );
}
