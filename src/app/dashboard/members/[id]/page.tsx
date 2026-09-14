import { getMemberById } from "@/actions/member.actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MembershipStatus, PaymentStatus } from "@/types/enums";
import { getMemberFinancialSummary } from "@/services/financial.service";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { RecordPaymentDialog } from "@/app/dashboard/payments/components/RecordPaymentDialog";
import { Receipt, CreditCard, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Member Profile | Gym Management",
};

export default async function MemberProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [{ member, error }, financialSummary, gym] = await Promise.all([
    getMemberById(params.id),
    getMemberFinancialSummary(params.id),
    prisma.gym.findFirst(),
  ]);

  if (error || !member) {
    notFound();
  }

  const currency = gym?.currency || "USD";
  const activeMembership = member.memberships.find(m => m.status === MembershipStatus.ACTIVE) 
    || member.memberships[0];

  const allPayments = financialSummary?.payments || member.payments || [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
            {member.name?.charAt(0) || "M"}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {member.name}
              {activeMembership?.status === MembershipStatus.ACTIVE ? (
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Member ID: <span className="font-mono font-medium text-foreground">{member.profile?.memberId || "N/A"}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RecordPaymentDialog
            currency={currency}
            defaultMemberId={member.id}
            trigger={
              <Button className="gap-2">
                <CreditCard className="h-4 w-4" />
                Collect Payment
              </Button>
            }
          />
          <Link href="/dashboard/members">
            <Button variant="outline">Back to Members</Button>
          </Link>
        </div>
      </div>

      {/* Financial Overview Bento Cards */}
      {financialSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Billed</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatCurrency(financialSummary.totalCharges, currency)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Cumulative membership charges</p>
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Paid</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600">{formatCurrency(financialSummary.totalPaid, currency)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Verified settled payments</p>
            </CardContent>
          </Card>

          <Card className={`border ${financialSummary.totalDue > 0 ? "border-amber-300 bg-amber-50/20" : "border-border/60"}`}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">Outstanding Balance</CardDescription>
                <CardTitle className={`text-2xl font-bold ${financialSummary.totalDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {formatCurrency(financialSummary.totalDue, currency)}
                </CardTitle>
              </div>
              {financialSummary.totalDue > 0 ? (
                <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-100/50">
                  {financialSummary.status}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-400 text-emerald-700 bg-emerald-50">
                  PAID
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {financialSummary.totalDue > 0 ? "Pending collection from member" : "Account fully settled"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Personal Info & Emergency Contact */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Email</div>
                <div className="font-medium">{member.email}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Phone</div>
                <div className="font-medium">{member.profile?.phone || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Date of Birth</div>
                <div className="font-medium">
                  {member.profile?.dob ? new Date(member.profile.dob).toLocaleDateString() : "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Gender</div>
                <div className="font-medium">{member.profile?.gender || "-"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Name</div>
                <div className="font-medium">{member.profile?.emergencyContactName || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Phone</div>
                <div className="font-medium">{member.profile?.emergencyContactPhone || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Relationship</div>
                <div className="font-medium">{member.profile?.emergencyContactRel || "-"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Memberships & Payment History */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Current Membership</CardTitle>
                <CardDescription>Active plan & subscription period</CardDescription>
              </div>
              {activeMembership?.status === MembershipStatus.ACTIVE && (
                <Button variant="outline" size="sm">Freeze</Button>
              )}
            </CardHeader>
            <CardContent>
              {activeMembership ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Plan</div>
                      <div className="font-semibold">{activeMembership.plan.name}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Start Date</div>
                      <div className="font-medium">{new Date(activeMembership.startDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">End Date</div>
                      <div className="font-medium">{new Date(activeMembership.endDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Plan Price</div>
                      <div className="font-medium">{formatCurrency(activeMembership.plan.price, currency)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No active membership.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Payment History</CardTitle>
                <CardDescription>All transactions recorded for this member</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {allPayments.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No payment history found for this member.
                </div>
              ) : (
                <div className="divide-y">
                  {allPayments.map((payment) => (
                    <div key={payment.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {formatCurrency(payment.amount, currency)}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              payment.status === PaymentStatus.COMPLETED
                                ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                                : payment.status === PaymentStatus.CANCELLED
                                ? "border-red-200 text-red-700 bg-red-50 line-through"
                                : ""
                            }`}
                          >
                            {payment.status}
                          </Badge>
                          {payment.receiptNumber && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {payment.receiptNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                          <span>&bull;</span>
                          <span className="font-medium">{payment.paymentMethod}</span>
                          {payment.reference && (
                            <>
                              <span>&bull;</span>
                              <span>Ref: {payment.reference}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {payment.receiptNumber && (
                          <Link href={`/dashboard/payments/${payment.id}/receipt`} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                              <Receipt className="h-3 w-3" />
                              Receipt
                            </Button>
                          </Link>
                        )}
                        <Link href={`/dashboard/payments/${payment.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
