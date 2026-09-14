import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, ShieldCheck, CreditCard, AlertCircle, ArrowRight, CheckCircle2, CalendarDays, Dumbbell, Utensils } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembershipStatus, BookingStatus, ScheduleStatus, PlanStatus } from "@/types/enums";
import { getMemberFinancialSummary } from "@/services/financial.service";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { startOfDay, endOfDay } from "date-fns";

export default async function MemberDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const currentDayName = daysOfWeek[new Date().getDay()];

  const [member, financialSummary, gym, todayBookedClass, todayWorkoutPlan, activeDietPlan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          include: { plan: true },
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    }),
    getMemberFinancialSummary(session.user.id),
    prisma.gym.findFirst(),
    prisma.classBooking.findFirst({
      where: {
        userId: session.user.id,
        status: BookingStatus.BOOKED,
        classSchedule: {
          date: { gte: todayStart, lte: todayEnd },
          status: ScheduleStatus.ACTIVE,
        },
      },
      include: {
        classSchedule: {
          include: { class: true },
        },
      },
    }),
    prisma.workoutPlan.findFirst({
      where: {
        userId: session.user.id,
        status: PlanStatus.ACTIVE,
      },
      include: {
        exercises: {
          where: { day: currentDayName },
          orderBy: { order: "asc" },
        },
      },
    }),
    prisma.dietPlan.findFirst({
      where: {
        userId: session.user.id,
        status: PlanStatus.ACTIVE,
      },
      include: {
        meals: {
          orderBy: { order: "asc" },
        },
      },
    }),
  ]);

  const currency = gym?.currency || "USD";
  const activeMembership = member?.memberships[0];

  const daysUntilExpiry = activeMembership 
    ? Math.ceil((new Date(activeMembership.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {session?.user?.name?.split(' ')[0] || 'Member'}!</h1>
        <p className="text-gray-500 text-sm">Here is your gym activity & membership overview.</p>
      </div>

      {/* Outstanding Due Alert Banner if totalDue > 0 */}
      {financialSummary && financialSummary.totalDue > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-amber-900 text-sm">
                Outstanding Balance Due: {formatCurrency(financialSummary.totalDue, currency)}
              </div>
              <p className="text-xs text-amber-700">
                Please contact or visit the gym reception to settle your pending membership payment.
              </p>
            </div>
          </div>
          <Link href="/member/payments">
            <Button size="sm" variant="outline" className="border-amber-400 text-amber-900 hover:bg-amber-100 shrink-0 gap-1 text-xs font-semibold">
              View Invoices
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Today's Fitness Experience */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Today's Fitness Schedule &middot; {currentDayName}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Item 1: Class */}
          <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-emerald-600" />
                Class Session
              </div>
              {todayBookedClass ? (
                <div>
                  <div className="font-bold text-sm text-gray-900">
                    {todayBookedClass.classSchedule.class.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {todayBookedClass.classSchedule.startTime} ({todayBookedClass.classSchedule.class.duration}m)
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground pt-0.5">No class booked for today</div>
              )}
            </div>
            <Link href="/member/classes">
              <span className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                {todayBookedClass ? "View booking" : "Browse classes"} <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {/* Item 2: Workout */}
          <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-emerald-600" />
                Today's Workout
              </div>
              {todayWorkoutPlan && todayWorkoutPlan.exercises.length > 0 ? (
                <div>
                  <div className="font-bold text-sm text-gray-900 truncate">
                    {todayWorkoutPlan.exercises.length} Exercises Planned
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {todayWorkoutPlan.exercises[0]?.exerciseName} + more
                  </div>
                </div>
              ) : todayWorkoutPlan ? (
                <div className="text-xs text-muted-foreground pt-0.5">Rest Day for today</div>
              ) : (
                <div className="text-xs text-muted-foreground pt-0.5">No workout program assigned</div>
              )}
            </div>
            <Link href="/member/workout">
              <span className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                Open workout routine <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {/* Item 3: Diet */}
          <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Utensils className="w-3 h-3 text-emerald-600" />
                Nutrition Schedule
              </div>
              {activeDietPlan && activeDietPlan.meals.length > 0 ? (
                <div>
                  <div className="font-bold text-sm text-gray-900 truncate">
                    {activeDietPlan.meals.length} Daily Meals
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    Next: {activeDietPlan.meals[0]?.mealName} ({activeDietPlan.meals[0]?.mealTime})
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground pt-0.5">No diet plan assigned</div>
              )}
            </div>
            <Link href="/member/diet">
              <span className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                View meal routine <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Membership Status */}
        <Card className={isExpiringSoon ? "border-amber-500 ring-1 ring-amber-500/50 bg-amber-50/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membership Status</CardTitle>
            <ShieldCheck className={`h-4 w-4 ${activeMembership ? "text-emerald-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            {activeMembership ? (
              <>
                <div className="text-2xl font-bold text-emerald-600">Active</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeMembership.plan.name}
                </p>
                <p className="text-xs font-medium mt-1">
                  Renews on {new Date(activeMembership.endDate).toLocaleDateString()}
                </p>
                {isExpiringSoon && (
                  <div className="mt-3 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded inline-block">
                    Expiring in {daysUntilExpiry} days!
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-muted-foreground">Inactive</div>
                <p className="text-xs text-muted-foreground mt-1">You don't have an active membership.</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment / Balance Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {financialSummary ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${financialSummary.totalDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {financialSummary.totalDue > 0 ? formatCurrency(financialSummary.totalDue, currency) : "Paid in Full"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total settled to date: {formatCurrency(financialSummary.totalPaid, currency)}
                </p>
                <div className="mt-3">
                  <Link href="/member/payments" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                    View payment history <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No financial data</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Attendance / Visits */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-in Quick Pass</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Member ID:</div>
              <div className="text-lg font-mono font-bold bg-muted/40 p-2 rounded border text-center">
                {financialSummary?.memberId || "N/A"}
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Present at reception terminal for quick check-in.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
