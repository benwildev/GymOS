import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getRetentionAttentionSummary,
  getInactiveMembers,
  getExpiringMembers,
  getOverdueMembers,
} from "@/services/member-retention.service";
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
  AlertTriangle,
  Clock,
  Calendar,
  CreditCard,
  ArrowRight,
  User,
  CheckCircle2,
  RefreshCw,
  StickyNote,
} from "lucide-react";
import { RenewMembershipDialog } from "../components/RenewMembershipDialog";
import { RecordPaymentDialog } from "@/app/dashboard/payments/components/RecordPaymentDialog";

export const metadata = {
  title: "Member Retention Hub | GymOS",
  description: "Track inactive members, upcoming expirations, and overdue payments.",
};

export default async function MemberAttentionPage() {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    notFound();
  }

  const [
    summary,
    inactiveMembers,
    expiringMembers,
    overdueMembers,
    availablePlans,
    gym,
  ] = await Promise.all([
    getRetentionAttentionSummary(),
    getInactiveMembers(14),
    getExpiringMembers(7),
    getOverdueMembers(),
    prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
    prisma.gym.findFirst(),
  ]);

  const currency = gym?.currency || "USD";

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/members"
              className="text-xs text-muted-foreground hover:text-slate-900 transition-colors"
            >
              &larr; Back to Members
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Member Retention Hub
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${
                summary.totalAlertsCount > 0
                  ? "border-amber-300 text-amber-800 bg-amber-50"
                  : "border-emerald-300 text-emerald-800 bg-emerald-50"
              }`}
            >
              {summary.totalAlertsCount} Action Items
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Identify members who haven&apos;t attended, memberships expiring soon, or overdue dues.
          </p>
        </div>

        <Link href="/dashboard/announcements">
          <Button size="sm" variant="outline" className="text-xs">
            Send Gym Announcement
          </Button>
        </Link>
      </div>

      {/* 1. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Inactive (14+ days) */}
        <Card className="border border-slate-200/80 shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Inactive (14+ Days)
              </CardDescription>
              <div className="h-6 w-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 mt-1">
              {summary.inactiveMembersCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <p className="text-[11px] text-muted-foreground">Haven&apos;t attended in 14+ days</p>
          </CardContent>
        </Card>

        {/* Card 2: Expiring Soon (7 days) */}
        <Card className="border border-slate-200/80 shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Expiring in 7 Days
              </CardDescription>
              <div className="h-6 w-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 mt-1">
              {summary.expiringMembersCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <p className="text-[11px] text-muted-foreground">Needs renewal follow-up</p>
          </CardContent>
        </Card>

        {/* Card 3: Overdue Payments */}
        <Card className="border border-slate-200/80 shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Overdue Payments
              </CardDescription>
              <div className="h-6 w-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 mt-1">
              {summary.overduePaymentsCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <p className="text-[11px] text-muted-foreground">Members with pending balance</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Retention Tabs & Tables */}
      <Tabs defaultValue="inactive" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex flex-wrap gap-1 border border-slate-200/80">
          <TabsTrigger value="inactive" className="gap-1.5 text-xs py-1.5 px-3">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Inactive Members ({inactiveMembers.length})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="gap-1.5 text-xs py-1.5 px-3">
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
            Expiring Memberships ({expiringMembers.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-1.5 text-xs py-1.5 px-3">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            Overdue Balances ({overdueMembers.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: INACTIVE MEMBERS */}
        <TabsContent value="inactive">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Inactive Members (14+ Days Absence)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Active gym members who haven&apos;t recorded a gym check-in in 2 weeks or more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inactiveMembers.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="font-semibold text-slate-800 text-sm">High Member Engagement!</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No active members have been absent for more than 14 days.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Member</TableHead>
                      <TableHead className="text-xs">Plan</TableHead>
                      <TableHead className="text-xs">Last Visited</TableHead>
                      <TableHead className="text-xs">Inactivity</TableHead>
                      <TableHead className="text-xs">Phone</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveMembers.map((m) => (
                      <TableRow key={m.id} className="text-xs">
                        <TableCell>
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground">{m.email}</div>
                        </TableCell>
                        <TableCell>{m.activePlan}</TableCell>
                        <TableCell>
                          {m.lastAttendanceDate
                            ? format(new Date(m.lastAttendanceDate), "MMM d, yyyy")
                            : "Never Checked In"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 text-[10px]">
                            {m.daysInactive} days away
                          </Badge>
                        </TableCell>
                        <TableCell>{m.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/members/${m.id}?tab=notes`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                <StickyNote className="w-3 h-3" />
                                Add Note
                              </Button>
                            </Link>
                            <Link href={`/dashboard/members/${m.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                Profile &rarr;
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: EXPIRING MEMBERS */}
        <TabsContent value="expiring">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Expiring Within 7 Days
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Members whose memberships will lapse in the next 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringMembers.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="font-semibold text-slate-800 text-sm">No Immediate Expirations</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All active memberships are secure for more than a week.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Member</TableHead>
                      <TableHead className="text-xs">Current Plan</TableHead>
                      <TableHead className="text-xs">Expiry Date</TableHead>
                      <TableHead className="text-xs">Remaining</TableHead>
                      <TableHead className="text-xs">Phone</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringMembers.map((m) => (
                      <TableRow key={m.membershipId} className="text-xs">
                        <TableCell>
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground">{m.email}</div>
                        </TableCell>
                        <TableCell>{m.planName}</TableCell>
                        <TableCell>{format(new Date(m.endDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              m.daysRemaining <= 2
                                ? "border-rose-300 text-rose-700 bg-rose-50 font-bold"
                                : "border-amber-300 text-amber-700 bg-amber-50"
                            }`}
                          >
                            {m.daysRemaining === 0 ? "Expires Today" : `${m.daysRemaining} days left`}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <RenewMembershipDialog
                              userId={m.userId}
                              memberName={m.name}
                              activeMembership={{
                                id: m.membershipId,
                                plan: { name: m.planName, price: m.planPrice },
                                endDate: m.endDate,
                                status: "ACTIVE",
                              }}
                              availablePlans={availablePlans}
                              currency={currency}
                              trigger={
                                <Button size="sm" className="h-7 text-xs gap-1 bg-[#1a9d5e] hover:bg-[#15804d] text-white">
                                  <RefreshCw className="w-3 h-3" />
                                  Renew
                                </Button>
                              }
                            />
                            <Link href={`/dashboard/members/${m.userId}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                Profile &rarr;
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: OVERDUE PAYMENTS */}
        <TabsContent value="overdue">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Members With Overdue Balances
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Accounts with outstanding subscription dues pending collection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overdueMembers.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="font-semibold text-slate-800 text-sm">All Accounts Settled!</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    There are no pending or overdue membership balances.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Member</TableHead>
                      <TableHead className="text-xs">Billed</TableHead>
                      <TableHead className="text-xs">Paid</TableHead>
                      <TableHead className="text-xs">Overdue Due</TableHead>
                      <TableHead className="text-xs">Phone</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueMembers.map((m) => (
                      <TableRow key={m.userId} className="text-xs">
                        <TableCell>
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground">{m.email}</div>
                        </TableCell>
                        <TableCell>{formatCurrency(m.totalBilled, currency)}</TableCell>
                        <TableCell>{formatCurrency(m.totalPaid, currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 font-bold text-[10px]">
                            {formatCurrency(m.totalDue, currency)}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <RecordPaymentDialog
                              currency={currency}
                              defaultMemberId={m.userId}
                              trigger={
                                <Button size="sm" className="h-7 text-xs gap-1 bg-[#1a9d5e] hover:bg-[#15804d] text-white">
                                  <CreditCard className="w-3 h-3" />
                                  Collect
                                </Button>
                              }
                            />
                            <Link href={`/dashboard/members/${m.userId}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                Profile &rarr;
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
