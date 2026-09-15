import { getMembershipReport, getAttendanceReport, getFinancialReport } from "@/services/report.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ExportButton } from "./export-button";

export const metadata = {
  title: "Reports | GymOS",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string };
}) {
  const now = new Date();
  
  // Default to last 3 months if no params provided
  const defaultStart = startOfMonth(subMonths(now, 2));
  const defaultEnd = endOfMonth(now);

  const startDate = searchParams.start ? new Date(searchParams.start) : defaultStart;
  const endDate = searchParams.end ? new Date(searchParams.end) : defaultEnd;

  const [membershipData, attendanceData, financialData] = await Promise.all([
    getMembershipReport(),
    getAttendanceReport(startDate, endDate),
    getFinancialReport(startDate, endDate)
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your gym from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton 
            membershipData={membershipData}
            attendanceData={attendanceData}
            financialData={financialData}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Membership Report */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Membership Distribution</CardTitle>
            <CardDescription className="text-xs">Active vs Inactive members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Members</span>
              <span className="font-bold">{membershipData.totalMembers}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Active Members</span>
              <span className="font-bold text-emerald-600">{membershipData.activeMembers}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Inactive Members</span>
              <span className="font-bold text-rose-600">{membershipData.inactiveMembers}</span>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">By Plan</h4>
              <div className="space-y-2">
                {membershipData.planDistribution.map(plan => (
                  <div key={plan.name} className="flex justify-between text-sm">
                    <span>{plan.name}</span>
                    <span className="font-medium">{plan.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Report Summary */}
        <Card className="shadow-xs lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Financial Overview</CardTitle>
            <CardDescription className="text-xs">Revenue vs Expenses for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border bg-gray-50/50">
                <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-emerald-700">{financialData.totalRevenueFormatted}</div>
              </div>
              <div className="p-4 rounded-xl border bg-gray-50/50">
                <div className="text-xs text-muted-foreground mb-1">Total Expenses</div>
                <div className="text-2xl font-bold text-rose-700">{financialData.totalExpensesFormatted}</div>
              </div>
              <div className="p-4 rounded-xl border bg-gray-50/50">
                <div className="text-xs text-muted-foreground mb-1">Net Profit</div>
                <div className={`text-2xl font-bold ${financialData.netProfit >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                  {financialData.netProfitFormatted}
                </div>
              </div>
            </div>

            {/* Simple CSS Chart for Financial Timeline */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Daily Timeline</h4>
              {financialData.timelineData.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No financial data for this period.</div>
              ) : (
                financialData.timelineData.map(day => (
                  <div key={day.date} className="flex items-center gap-4 text-xs">
                    <div className="w-24 text-muted-foreground font-mono">{day.date}</div>
                    <div className="flex-1 flex gap-1 h-4">
                      {/* Revenue Bar */}
                      <div 
                        className="bg-emerald-500 h-full rounded-sm" 
                        style={{ width: `${Math.max(1, (day.revenue / Math.max(financialData.totalRevenue, 1)) * 100)}%` }}
                        title={`Revenue: ${day.revenue}`}
                      />
                      {/* Expense Bar */}
                      <div 
                        className="bg-rose-500 h-full rounded-sm" 
                        style={{ width: `${Math.max(1, (day.expense / Math.max(financialData.totalExpenses, 1)) * 100)}%` }}
                        title={`Expense: ${day.expense}`}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Report */}
        <Card className="shadow-xs lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Attendance Frequency</CardTitle>
            <CardDescription className="text-xs">Daily check-in volume ({attendanceData.totalCheckIns} total)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40 mt-4">
              {attendanceData.dailyChartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                  No attendance data for this period.
                </div>
              ) : (
                attendanceData.dailyChartData.map((day) => {
                  const maxCount = Math.max(...attendanceData.dailyChartData.map(d => d.count), 1);
                  const heightPercent = (day.count / maxCount) * 100;
                  return (
                    <div 
                      key={day.date} 
                      className="flex-1 bg-blue-500/80 hover:bg-blue-600 transition-colors rounded-t-sm relative group"
                      style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                        {day.date}: {day.count} check-ins
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
