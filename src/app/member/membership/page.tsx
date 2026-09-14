import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembershipStatus } from "@/types/enums";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Calendar, Clock, CreditCard } from "lucide-react";

export const metadata = {
  title: "My Membership | Gym Management",
};

export default async function MemberMembershipPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  const member = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      memberships: {
        include: { 
          plan: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!member) {
    return <div>Member not found</div>;
  }

  const activeMembership = member.memberships.find(m => m.status === MembershipStatus.ACTIVE) || member.memberships[0];

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Membership</h1>
        <p className="text-muted-foreground mt-1">
          View your membership details and billing history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your active subscription details</CardDescription>
                </div>
                {activeMembership?.status === MembershipStatus.ACTIVE ? (
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeMembership ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full text-primary">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{activeMembership.plan.name}</h3>
                      <p className="text-muted-foreground">{activeMembership.plan.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="text-sm flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" /> Start Date
                      </div>
                      <div className="font-medium">
                        {new Date(activeMembership.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm flex items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" /> End Date
                      </div>
                      <div className="font-medium">
                        {new Date(activeMembership.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  You do not currently have a membership.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {member.memberships.flatMap(m => m.payments).length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No payment history found.
                </div>
              ) : (
                <div className="space-y-4">
                  {member.memberships.flatMap(m => m.payments)
                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .map(payment => (
                    <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-secondary rounded-full">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">${payment.amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(payment.paymentDate).toLocaleDateString()} &middot; {payment.paymentMethod}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{payment.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground">Member ID</div>
                <div className="font-medium">{member.profile?.memberId || "N/A"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Name</div>
                <div className="font-medium">{member.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div className="font-medium">{member.email}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
