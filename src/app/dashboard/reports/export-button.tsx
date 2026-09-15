"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function ExportButton({ 
  membershipData, 
  attendanceData, 
  financialData 
}: { 
  membershipData: any, 
  attendanceData: any, 
  financialData: any 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleExport = () => {
    // Basic CSV generation
    const rows = [
      ["Report Type", "Metric", "Value"],
      ["Membership", "Total Members", membershipData.totalMembers],
      ["Membership", "Active Members", membershipData.activeMembers],
      ["Membership", "Inactive Members", membershipData.inactiveMembers],
      ["Attendance", "Total Check-ins", attendanceData.totalCheckIns],
      ["Financial", "Total Revenue", financialData.totalRevenue],
      ["Financial", "Total Expenses", financialData.totalExpenses],
      ["Financial", "Net Profit", financialData.netProfit],
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gymos_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const now = new Date();
    const params = new URLSearchParams(searchParams.toString());
    
    if (val === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      params.set("start", start.toISOString());
      params.delete("end");
    } else if (val === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      params.set("start", start.toISOString());
      params.set("end", end.toISOString());
    } else if (val === "last_3_months") {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      params.set("start", start.toISOString());
      params.delete("end");
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <select 
        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onChange={handleDateChange}
        defaultValue="last_3_months"
      >
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="last_3_months">Last 3 Months</option>
      </select>

      <Button onClick={handleExport} variant="outline" className="h-9">
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}
