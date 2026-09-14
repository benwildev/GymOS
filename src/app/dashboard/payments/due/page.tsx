import { getDueAndOverdueMembers, formatCurrency } from "@/services/financial.service";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Bell, 
  Search, 
  CheckCircle2, 
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import { RecordPaymentDialog } from "../components/RecordPaymentDialog";

export const metadata = {
  title: "Due Payments | GymOS",
  description: "Track and collect outstanding member balances.",
};

export default async function DuePaymentsPage(props: {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || "";
  const status = searchParams.status || "ALL";

  const [dueMembers, gym] = await Promise.all([
    getDueAndOverdueMembers(search, status),
    prisma.gym.findFirst(),
  ]);

  const currency = gym?.currency || "USD";

  const totalOutstanding = dueMembers.reduce((sum, m) => sum + m.due, 0);
  const overdueCount = dueMembers.filter((m) => m.status === "OVERDUE").length;

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "OVERDUE":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Overdue</Badge>;
      case "PARTIALLY_PAID":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Partially Paid</Badge>;
      case "DUE":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Due</Badge>;
      default:
        return <Badge variant="secondary">{st}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/payments" className="text-muted-foreground hover:text-gray-900 text-xs flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Payments
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Due & Overdue Balances</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Members with pending membership fees requiring collection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RecordPaymentDialog currency={currency} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-amber-100 bg-amber-50/20 shadow-xs">
          <CardContent className="pt-6">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Outstanding Due
            </div>
            <div className="text-3xl font-bold text-amber-700 mt-2">
              {formatCurrency(totalOutstanding, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across {dueMembers.length} member(s)</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-rose-50/20 shadow-xs">
          <CardContent className="pt-6">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Overdue Accounts
            </div>
            <div className="text-3xl font-bold text-rose-700 mt-2">
              {overdueCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requiring immediate follow-up</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/20 shadow-xs">
          <CardContent className="pt-6">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Fee Volume
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(dueMembers.reduce((s, m) => s + m.totalCharge, 0), currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Assigned membership value</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b text-sm font-medium">
        <Link
          href="/dashboard/payments"
          className="pb-3 px-4 text-muted-foreground hover:text-gray-900 flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          All Transactions
        </Link>
        <Link
          href="/dashboard/payments/due"
          className="pb-3 px-4 border-b-2 border-black text-gray-900 font-semibold flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Due & Overdue Balances ({dueMembers.length})
        </Link>
      </div>

      {/* Due Members Table */}
      <div className="bg-white rounded-lg border shadow-xs overflow-hidden">
        {dueMembers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Great! No outstanding payments</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              All member accounts are completely settled with zero pending dues.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b text-xs uppercase font-medium text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Total Fee</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Due Amount</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dueMembers.map((m) => (
                  <tr key={m.userId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <Link href={`/dashboard/members/${m.userId}`} className="font-semibold text-gray-900 hover:underline">
                          {m.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {m.memberId ? `${m.memberId} • ` : ""}{m.phone || m.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-700">
                      {m.activePlan}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {formatCurrency(m.totalCharge, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">
                      {formatCurrency(m.totalPaid, currency)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-700">
                      {formatCurrency(m.due, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(m.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(m.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {/* Send Reminder button placeholder as requested in Section 31 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-gray-900"
                        title="Reminder system (ready for automated notifications)"
                      >
                        <Bell className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        Send Reminder
                      </Button>

                      {/* Collect Payment Action */}
                      <RecordPaymentDialog
                        currency={currency}
                        defaultMemberId={m.userId}
                        trigger={
                          <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            Collect Payment
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
