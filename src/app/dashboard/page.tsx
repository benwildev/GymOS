import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  ReceiptText, 
  DollarSign,
  CalendarDays,
  Dumbbell,
  Utensils
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getFinancialMetrics, formatCurrency } from "@/services/financial.service";
import { PaymentStatus, Status, BookingStatus, ScheduleStatus, PlanStatus } from "@/types/enums";
import { startOfDay, endOfDay } from "date-fns";

export const metadata = {
  title: "Overview | GymOS",
};

export default async function DashboardOverviewPage() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    metrics, 
    gym, 
    recentPayments, 
    recentExpenses, 
    dueMembers, 
    totalMembersCount,
    todaysClasses,
    activeWorkoutsCount,
    activeDietsCount
  ] = await Promise.all([
    getFinancialMetrics(),
    prisma.gym.findFirst(),
    prisma.payment.findMany({
      orderBy: { paymentDate: "desc" },
      take: 5,
      include: {
        user: { include: { profile: true } },
        membership: { include: { plan: true } },
      },
    }),
    prisma.expense.findMany({
      where: { status: Status.ACTIVE },
      orderBy: { expenseDate: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      where: { role: "MEMBER" },
      include: {
        profile: true,
        memberships: { include: { plan: true } },
        payments: { where: { status: PaymentStatus.COMPLETED } },
      },
      take: 10,
    }),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.classSchedule.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { startTime: "asc" },
      include: {
        class: true,
        bookings: {
          where: { status: BookingStatus.BOOKED },
        },
      },
    }),
    prisma.workoutPlan.count({ where: { status: PlanStatus.ACTIVE } }),
    prisma.dietPlan.count({ where: { status: PlanStatus.ACTIVE } }),
  ]);

  const currency = gym?.currency || "USD";

  // Calculate quick top dues
  const topDues = dueMembers
    .map((m) => {
      const charge = m.memberships.reduce((sum, mem) => sum + (mem.plan?.price || 0), 0);
      const paid = m.payments.reduce((sum, p) => sum + p.amount, 0);
      const due = Math.max(0, charge - paid);
      return {
        id: m.id,
        name: m.name,
        memberId: m.profile?.memberId,
        phone: m.profile?.phone,
        due,
      };
    })
    .filter((m) => m.due > 0)
    .sort((a, b) => b.due - a.due)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Financial pulse and operational summary for {gym?.name || "your gym"}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/payments">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </Link>
          <Link href="/dashboard/expenses">
            <Button variant="outline">
              <ReceiptText className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Financial Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border-emerald-100 bg-emerald-50/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today's Collection
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(metrics.todayCollection, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Collected today</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(metrics.monthRevenue, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">This month so far</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Outstanding Due
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(metrics.outstandingDue, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Across all members</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-rose-50/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Overdue Amount
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">
              {formatCurrency(metrics.overdueAmount, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Past due date</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Monthly Expenses
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(metrics.monthExpenses, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total expenses</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/50 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Net Operational
            </CardTitle>
            <Badge variant="outline" className={metrics.netOperational >= 0 ? "text-emerald-700 border-emerald-300" : "text-rose-700 border-rose-300"}>
              {metrics.netOperational >= 0 ? "Surplus" : "Deficit"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.netOperational >= 0 ? "text-gray-900" : "text-rose-600"}`}>
              {formatCurrency(metrics.netOperational, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Revenue minus expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* 3 Overview Tables: Recent Payments, Recent Expenses, Outstanding Dues */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Payments */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
              <CardDescription className="text-xs">Latest member collections</CardDescription>
            </div>
            <Link href="/dashboard/payments">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No payments recorded yet.
              </div>
            ) : (
              <div className="divide-y text-sm">
                {recentPayments.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <div className="font-medium text-gray-900">{p.user?.name || "Member"}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.receiptNumber || "Receipt"} &middot; {p.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="font-semibold text-emerald-700">
                        +{formatCurrency(p.amount, currency)}
                      </div>
                      <Badge 
                        variant={p.status === PaymentStatus.COMPLETED ? "default" : "secondary"}
                        className={`text-[10px] px-1.5 py-0 ${p.status === PaymentStatus.COMPLETED ? "bg-emerald-100 text-emerald-800" : ""}`}
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Expenses</CardTitle>
              <CardDescription className="text-xs">Latest operational costs</CardDescription>
            </div>
            <Link href="/dashboard/expenses">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No expenses recorded yet.
              </div>
            ) : (
              <div className="divide-y text-sm">
                {recentExpenses.map((exp) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <div className="font-medium text-gray-900 truncate max-w-[150px]">{exp.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {exp.category} &middot; {new Date(exp.expenseDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-purple-700">
                        -{formatCurrency(exp.amount, currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Outstanding Dues */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Top Outstanding Dues</CardTitle>
              <CardDescription className="text-xs">Members with pending fees</CardDescription>
            </div>
            <Link href="/dashboard/payments/due">
              <Button variant="ghost" size="sm" className="text-xs">
                Manage Dues <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {topDues.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Great! No outstanding dues.
              </div>
            ) : (
              <div className="divide-y text-sm">
                {topDues.map((due) => (
                  <div key={due.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <Link href={`/dashboard/members/${due.id}`} className="font-medium text-gray-900 hover:underline">
                        {due.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {due.memberId || due.phone || "Member"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-amber-700">
                        {formatCurrency(due.due, currency)}
                      </div>
                      <span className="text-[10px] text-rose-600 font-medium">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phase 5: Today's Classes & Fitness Operations */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Classes (2 cols) */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                Today's Scheduled Classes
              </CardTitle>
              <CardDescription className="text-xs">
                Live sessions and member bookings for today
              </CardDescription>
            </div>
            <Link href="/dashboard/classes">
              <Button variant="ghost" size="sm" className="text-xs">
                Manage Classes <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todaysClasses.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No classes scheduled for today.{" "}
                <Link href="/dashboard/classes" className="text-emerald-700 font-medium hover:underline">
                  Schedule a class →
                </Link>
              </div>
            ) : (
              <div className="divide-y text-sm">
                {todaysClasses.map((schedule) => {
                  const booked = schedule.bookings.length;
                  const cap = schedule.capacity;
                  const isFull = booked >= cap;
                  const isCancelled = schedule.status === ScheduleStatus.CANCELLED;

                  return (
                    <div key={schedule.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{schedule.class.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {schedule.class.duration} mins &middot; {Math.max(0, cap - booked)} spots remaining
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold py-0 px-2 ${
                            isCancelled
                              ? "bg-red-50 text-red-700 border-red-200"
                              : isFull
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : booked >= cap * 0.8
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isCancelled ? "CANCELLED" : `${booked} / ${cap} BOOKED`}
                        </Badge>
                        <Link href="/dashboard/classes">
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                            Roster
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fitness Programs Summary (1 col) */}
        <Card className="shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-600" />
              Member Coaching
            </CardTitle>
            <CardDescription className="text-xs">
              Active workout & diet programs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-xl border bg-gray-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-black text-white flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="font-bold text-base text-gray-900 leading-tight">
                    {activeWorkoutsCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Workout Plans</div>
                </div>
              </div>
              <Link href="/dashboard/workouts">
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  View Plans
                </Button>
              </Link>
            </div>

            <div className="p-3.5 rounded-xl border bg-gray-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-base text-gray-900 leading-tight">
                    {activeDietsCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Diet Plans</div>
                </div>
              </div>
              <Link href="/dashboard/diets">
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  View Plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
