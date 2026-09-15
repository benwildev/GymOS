import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMemberFinancialSummary } from "@/services/financial.service";
import { getMemberProgress } from "@/services/member-progress.service";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  CreditCard,
  ClipboardCheck,
  CalendarDays,
  Dumbbell,
  Utensils,
  Target,
  StickyNote,
  Layers,
  ArrowLeft,
  Receipt,
  ArrowRight,
  Minus,
  Calendar,
  Phone,
  Mail,
  Shield,
  Clock,
} from "lucide-react";
import { RecordPaymentDialog } from "@/app/dashboard/payments/components/RecordPaymentDialog";
import { RenewMembershipDialog } from "@/app/dashboard/members/components/RenewMembershipDialog";
import { AddGoalDialog } from "@/app/dashboard/members/components/AddGoalDialog";
import { MemberGoalsCard } from "@/app/dashboard/members/components/MemberGoalsCard";
import { MemberNotesCard } from "@/app/dashboard/members/components/MemberNotesCard";
import { MembershipStatus, PaymentStatus } from "@/types/enums";

export const metadata = {
  title: "Member Profile & Hub | GymOS",
};

export default async function MemberProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();

  if (!session || session.user?.role !== "OWNER") {
    notFound();
  }

  const [member, financialSummary, progress, gym, availablePlans] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id, role: "MEMBER" },
      include: {
        profile: true,
        memberships: {
          include: { plan: true, payments: true },
          orderBy: { startDate: "desc" },
        },
        attendances: {
          orderBy: { checkInAt: "desc" },
          take: 20,
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 30,
        },
        classBookings: {
          include: {
            classSchedule: {
              include: { class: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 15,
        },
        workoutPlans: {
          include: { exercises: true },
          orderBy: { createdAt: "desc" },
        },
        dietPlans: {
          include: { meals: true },
          orderBy: { createdAt: "desc" },
        },
        goals: {
          orderBy: { createdAt: "desc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getMemberFinancialSummary(params.id),
    getMemberProgress(params.id),
    prisma.gym.findFirst(),
    prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
  ]);

  if (!member) {
    notFound();
  }

  const currency = gym?.currency || "USD";
  const activeMembership = member.memberships.find((m) => m.status === "ACTIVE") || member.memberships[0];
  const allPayments = financialSummary?.payments || member.payments || [];
  const activeWorkout = member.workoutPlans.find((w) => w.status === "ACTIVE") || member.workoutPlans[0];
  const activeDiet = member.dietPlans.find((d) => d.status === "ACTIVE") || member.dietPlans[0];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-2xs">
            {member.name?.charAt(0) || "M"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                {member.name}
              </h1>
              {activeMembership?.status === "ACTIVE" ? (
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs">
                  Active Member
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>ID: <strong className="font-mono text-slate-700">{member.profile?.memberId || "N/A"}</strong></span>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</span>
              {member.profile?.phone && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {member.profile.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <RenewMembershipDialog
            userId={member.id}
            memberName={member.name || "Member"}
            activeMembership={activeMembership}
            availablePlans={availablePlans}
            currency={currency}
          />
          <RecordPaymentDialog
            currency={currency}
            defaultMemberId={member.id}
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 cursor-pointer shadow-xs text-slate-700"
              >
                <CreditCard className="h-4 w-4 text-slate-600" />
                Collect Payment
              </button>
            }
          />
          <AddGoalDialog
            userId={member.id}
            memberName={member.name || "Member"}
            buttonVariant="header"
            buttonText="Set Goal"
          />
          <Link href="/dashboard/members">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-500">
              <ArrowLeft className="w-3.5 h-3.5" />
              Members
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Central Tabbed Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex flex-wrap gap-1 border border-slate-200/80">
          <TabsTrigger value="overview" className="gap-1.5 text-xs py-1.5 px-3">
            <User className="w-3.5 h-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="membership" className="gap-1.5 text-xs py-1.5 px-3">
            <Layers className="w-3.5 h-3.5" />
            Membership
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5 text-xs py-1.5 px-3">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-xs py-1.5 px-3">
            <CreditCard className="w-3.5 h-3.5" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-1.5 text-xs py-1.5 px-3">
            <CalendarDays className="w-3.5 h-3.5" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="workout" className="gap-1.5 text-xs py-1.5 px-3">
            <Dumbbell className="w-3.5 h-3.5" />
            Workout
          </TabsTrigger>
          <TabsTrigger value="diet" className="gap-1.5 text-xs py-1.5 px-3">
            <Utensils className="w-3.5 h-3.5" />
            Diet
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-1.5 text-xs py-1.5 px-3">
            <Target className="w-3.5 h-3.5" />
            Goals ({member.goals.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5 text-xs py-1.5 px-3">
            <StickyNote className="w-3.5 h-3.5" />
            Notes ({member.notes.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          {/* Financial summary bento */}
          {financialSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-slate-200/80 shadow-xs">
                <CardHeader className="pb-1">
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Total Charges
                  </CardDescription>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {formatCurrency(financialSummary.totalCharges, currency)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Cumulative membership billing</p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 shadow-xs">
                <CardHeader className="pb-1">
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Total Paid
                  </CardDescription>
                  <CardTitle className="text-xl font-bold text-emerald-600">
                    {formatCurrency(financialSummary.totalPaid, currency)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Settled collections</p>
                </CardContent>
              </Card>

              <Card className={`border shadow-xs ${financialSummary.totalDue > 0 ? "border-amber-300 bg-amber-50/20" : "border-slate-200/80"}`}>
                <CardHeader className="pb-1 flex flex-row items-start justify-between">
                  <div>
                    <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Outstanding Balance
                    </CardDescription>
                    <CardTitle className={`text-xl font-bold ${financialSummary.totalDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {formatCurrency(financialSummary.totalDue, currency)}
                    </CardTitle>
                  </div>
                  {financialSummary.totalDue > 0 ? (
                    <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-100/50 text-[10px]">
                      {financialSummary.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 text-[10px]">
                      PAID
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">
                    {financialSummary.totalDue > 0 ? "Pending collection" : "Account settled"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Info & Emergency Contact */}
            <div className="space-y-6">
              <Card className="border border-slate-200/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-900">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px]">Email Address</div>
                    <div className="font-medium text-slate-800">{member.email}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Phone</div>
                    <div className="font-medium text-slate-800">{member.profile?.phone || "—"}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Date of Birth</div>
                    <div className="font-medium text-slate-800">
                      {member.profile?.dob ? format(new Date(member.profile.dob), "MMM d, yyyy") : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Gender</div>
                    <div className="font-medium text-slate-800">{member.profile?.gender || "—"}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Address</div>
                    <div className="font-medium text-slate-800">{member.profile?.address || "—"}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-900">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px]">Contact Name</div>
                    <div className="font-medium text-slate-800">{member.profile?.emergencyContactName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Phone</div>
                    <div className="font-medium text-slate-800">{member.profile?.emergencyContactPhone || "—"}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Relationship</div>
                    <div className="font-medium text-slate-800">{member.profile?.emergencyContactRel || "—"}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Progress & Subscription Snapshot */}
            <div className="md:col-span-2 space-y-6">
              {/* Active Plan Card */}
              <Card className="border border-slate-200/80 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">Active Membership</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Current subscription details</CardDescription>
                  </div>
                  <RenewMembershipDialog
                    userId={member.id}
                    memberName={member.name || "Member"}
                    activeMembership={activeMembership}
                    availablePlans={availablePlans}
                    currency={currency}
                  />
                </CardHeader>
                <CardContent>
                  {activeMembership ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-slate-400 text-[11px]">Plan</div>
                        <div className="font-bold text-slate-800">{activeMembership.plan.name}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Start Date</div>
                        <div className="font-medium text-slate-800">{format(new Date(activeMembership.startDate), "MMM d, yyyy")}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">End Date</div>
                        <div className="font-medium text-slate-800">{format(new Date(activeMembership.endDate), "MMM d, yyyy")}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Plan Price</div>
                        <div className="font-medium text-slate-800">{formatCurrency(activeMembership.plan.price, currency)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">No active membership.</div>
                  )}
                </CardContent>
              </Card>

              {/* Active Fitness Goal Snapshot */}
              <Card className="border border-slate-200/80 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">Active Fitness Goal</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Target milestone & timeline</CardDescription>
                  </div>
                  <AddGoalDialog
                    userId={member.id}
                    memberName={member.name || "Member"}
                    buttonVariant="ghost"
                    buttonText={progress.activeGoal ? "Update Goal" : "Set Goal"}
                  />
                </CardHeader>
                <CardContent>
                  {progress.activeGoal ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="text-[11px] text-slate-400">Goal Title</div>
                        <div className="text-sm font-bold text-slate-900 truncate mt-0.5" title={progress.activeGoal.title}>
                          {progress.activeGoal.title}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="text-[11px] text-slate-400">Target Milestone</div>
                        <div className="text-base font-bold text-emerald-600 mt-0.5">
                          {progress.activeGoal.targetValue ? `${progress.activeGoal.targetValue} ${progress.activeGoal.targetUnit || ""}` : "General"}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="text-[11px] text-slate-400">Target Date</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {progress.activeGoal.targetDate ? format(new Date(progress.activeGoal.targetDate), "MMM d, yyyy") : "Open-ended"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      No active fitness goal set. Click &ldquo;Set Goal&rdquo; above to assign a milestone.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: MEMBERSHIP */}
        <TabsContent value="membership" className="space-y-6">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Membership History</CardTitle>
                <CardDescription className="text-xs text-slate-500">All past and current membership contracts</CardDescription>
              </div>
              <RenewMembershipDialog
                userId={member.id}
                memberName={member.name || "Member"}
                activeMembership={activeMembership}
                availablePlans={availablePlans}
                currency={currency}
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Plan</TableHead>
                    <TableHead className="text-xs">Start Date</TableHead>
                    <TableHead className="text-xs">End Date</TableHead>
                    <TableHead className="text-xs">Duration</TableHead>
                    <TableHead className="text-xs">Price</TableHead>
                    <TableHead className="text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.memberships.map((m) => (
                    <TableRow key={m.id} className="text-xs">
                      <TableCell className="font-semibold text-slate-900">{m.plan.name}</TableCell>
                      <TableCell>{format(new Date(m.startDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(m.endDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{m.plan.duration} days</TableCell>
                      <TableCell>{formatCurrency(m.plan.price, currency)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            m.status === "ACTIVE"
                              ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                              : "border-slate-200 text-slate-500"
                          }`}
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ATTENDANCE */}
        <TabsContent value="attendance" className="space-y-6">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Attendance Log</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Total Recorded Check-ins: <strong className="text-slate-800">{member.attendances.length}</strong>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {member.attendances.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No attendance records found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Check In</TableHead>
                      <TableHead className="text-xs">Check Out</TableHead>
                      <TableHead className="text-xs">Method</TableHead>
                      <TableHead className="text-xs">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.attendances.map((a) => (
                      <TableRow key={a.id} className="text-xs">
                        <TableCell className="font-medium">{format(new Date(a.checkInAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(new Date(a.checkInAt), "h:mm a")}</TableCell>
                        <TableCell>{a.checkOutAt ? format(new Date(a.checkOutAt), "h:mm a") : "—"}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{a.method}</Badge></TableCell>
                        <TableCell className="text-slate-500">{a.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PAYMENTS */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Payments & Receipts</CardTitle>
                <CardDescription className="text-xs text-slate-500">All payment transactions recorded</CardDescription>
              </div>
              <RecordPaymentDialog
                currency={currency}
                defaultMemberId={member.id}
                trigger={
                  <Button size="sm" className="gap-1.5 bg-[#1a9d5e] hover:bg-[#15804d] text-white">
                    <CreditCard className="h-4 w-4" />
                    Collect Payment
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              {allPayments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No payment history found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Receipt #</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Method</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Ref / Note</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayments.map((p) => (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="font-mono font-semibold text-slate-800">{p.receiptNumber || "—"}</TableCell>
                        <TableCell>{format(new Date(p.paymentDate), "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-bold text-slate-900">{formatCurrency(p.amount, currency)}</TableCell>
                        <TableCell>{p.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              p.status === PaymentStatus.COMPLETED
                                ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                : "border-slate-200 text-slate-500"
                            }`}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">{p.reference || p.note || "—"}</TableCell>
                        <TableCell className="text-right">
                          {p.receiptNumber && (
                            <Link href={`/dashboard/payments/${p.id}/receipt`} target="_blank">
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                <Receipt className="w-3 h-3" />
                                Receipt
                              </Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: CLASSES */}
        <TabsContent value="classes" className="space-y-6">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Class Bookings</CardTitle>
              <CardDescription className="text-xs text-slate-500">Group fitness sessions booked</CardDescription>
            </CardHeader>
            <CardContent>
              {member.classBookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No class bookings recorded.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Class Name</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Time</TableHead>
                      <TableHead className="text-xs">Duration</TableHead>
                      <TableHead className="text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.classBookings.map((b) => (
                      <TableRow key={b.id} className="text-xs">
                        <TableCell className="font-semibold text-slate-900">
                          {b.classSchedule.class.name}
                        </TableCell>
                        <TableCell>{format(new Date(b.classSchedule.date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{b.classSchedule.startTime} – {b.classSchedule.endTime}</TableCell>
                        <TableCell>{b.classSchedule.class.duration} mins</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-[10px]">
                            {b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: WORKOUT */}
        <TabsContent value="workout" className="space-y-6">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Workout Plan</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {activeWorkout ? `Active Program: ${activeWorkout.name}` : "No active workout assigned"}
                </CardDescription>
              </div>
              <Link href={`/dashboard/workouts?memberId=${member.id}`}>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  Manage Routines
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeWorkout && activeWorkout.exercises.length > 0 ? (
                <div className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Day</TableHead>
                        <TableHead className="text-xs">Exercise</TableHead>
                        <TableHead className="text-xs">Sets</TableHead>
                        <TableHead className="text-xs">Reps</TableHead>
                        <TableHead className="text-xs">Target Weight</TableHead>
                        <TableHead className="text-xs">Rest</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeWorkout.exercises.map((ex) => (
                        <TableRow key={ex.id} className="text-xs">
                          <TableCell className="font-semibold text-slate-800">{ex.day}</TableCell>
                          <TableCell className="font-medium text-slate-900">{ex.exerciseName}</TableCell>
                          <TableCell>{ex.sets}</TableCell>
                          <TableCell>{ex.reps}</TableCell>
                          <TableCell>{ex.weight > 0 ? `${ex.weight} kg` : "Bodyweight"}</TableCell>
                          <TableCell>{ex.restSeconds}s</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">No exercises assigned.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 7: DIET */}
        <TabsContent value="diet" className="space-y-6">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Nutrition Plan</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {activeDiet ? `Active Plan: ${activeDiet.name}` : "No diet plan assigned"}
                </CardDescription>
              </div>
              <Link href={`/dashboard/diets?memberId=${member.id}`}>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  Manage Diets
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeDiet && activeDiet.meals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Time</TableHead>
                      <TableHead className="text-xs">Meal Name</TableHead>
                      <TableHead className="text-xs">Food Items</TableHead>
                      <TableHead className="text-xs">Instructions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDiet.meals.map((meal) => (
                      <TableRow key={meal.id} className="text-xs">
                        <TableCell className="font-mono font-medium">{meal.mealTime}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{meal.mealName}</TableCell>
                        <TableCell className="text-slate-800 font-medium">{meal.food}</TableCell>
                        <TableCell className="text-slate-500">{meal.instructions || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">No meals scheduled.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 8: GOALS */}
        <TabsContent value="goals" className="space-y-6">
          <MemberGoalsCard
            userId={member.id}
            memberName={member.name || "Member"}
            initialGoals={member.goals as any}
          />
        </TabsContent>

        {/* TAB 9: NOTES */}
        <TabsContent value="notes" className="space-y-6">
          <MemberNotesCard
            userId={member.id}
            memberName={member.name || "Member"}
            initialNotes={member.notes as any}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
