import { getPayments } from "@/actions/payment.actions";
import { getFinancialMetrics, formatCurrency } from "@/services/financial.service";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  FileText, 
  Receipt, 
  ChevronLeft, 
  ChevronRight,
  Eye
} from "lucide-react";
import Link from "next/link";
import { RecordPaymentDialog } from "./components/RecordPaymentDialog";
import { PaymentFilters } from "./components/PaymentFilters";
import { PaymentStatus } from "@/types/enums";

export const metadata = {
  title: "Payments | GymOS",
  description: "Manage membership payments and outstanding balances.",
};

export default async function PaymentsPage(props: {
  searchParams: Promise<{
    search?: string;
    method?: string;
    status?: string;
    datePreset?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1", 10);

  const [metrics, paymentsData, gym] = await Promise.all([
    getFinancialMetrics(),
    getPayments({
      search: searchParams.search,
      method: searchParams.method as any,
      status: searchParams.status as any,
      datePreset: searchParams.datePreset as any,
      page,
      limit: 15,
    }),
    prisma.gym.findFirst(),
  ]);

  const currency = gym?.currency || "USD";
  const payments = paymentsData.payments || [];
  const total = paymentsData.total || 0;
  const totalPages = paymentsData.totalPages || 1;


  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
      case PaymentStatus.CANCELLED:
        return <Badge variant="secondary" className="text-gray-500 line-through">Cancelled</Badge>;
      case PaymentStatus.REFUNDED:
        return <Badge variant="outline" className="text-purple-700 border-purple-200">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage membership payments and outstanding balances.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/payments/due">
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              View Due Balances
            </Button>
          </Link>
          <RecordPaymentDialog currency={currency} />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-[11px] text-muted-foreground mt-1">Paid today</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              This Month
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(metrics.monthRevenue, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Current calendar month</p>
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
            <p className="text-[11px] text-muted-foreground mt-1">Total pending balances</p>
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
            <p className="text-[11px] text-muted-foreground mt-1">Past scheduled due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b text-sm font-medium">
        <Link
          href="/dashboard/payments"
          className="pb-3 px-4 border-b-2 border-black text-gray-900 font-semibold flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          All Transactions ({total})
        </Link>
        <Link
          href="/dashboard/payments/due"
          className="pb-3 px-4 text-muted-foreground hover:text-gray-900 flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Due & Overdue Balances
        </Link>
      </div>

      {/* Filters */}
      <PaymentFilters />

      {/* Payments Table */}
      <div className="bg-white rounded-lg border shadow-xs overflow-hidden">
        {payments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No payments found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No payment records match your selected search criteria or date filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b text-xs uppercase font-medium text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Membership</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <Link href={`/dashboard/members/${p.userId}`} className="font-semibold text-gray-900 hover:underline">
                          {p.user?.name || "Member"}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {p.user?.profile?.memberId ? `${p.user.profile.memberId} • ` : ""}{p.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-gray-700">
                        {p.membership?.plan?.name || "General Payment"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${p.status === PaymentStatus.CANCELLED ? "text-gray-400 line-through" : "text-emerald-700"}`}>
                        {formatCurrency(p.amount, currency)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-xs font-normal">
                        {p.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                      {p.reference || p.receiptNumber || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Link href={`/dashboard/payments/${p.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Details
                        </Button>
                      </Link>
                      <Link href={`/dashboard/payments/${p.id}/receipt`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Receipt className="w-3.5 h-3.5 mr-1" />
                          Receipt
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground bg-gray-50/50">
            <span>
              Page {page} of {totalPages} ({total} total transactions)
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/dashboard/payments?page=${page - 1}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                  </Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/dashboard/payments?page=${page + 1}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
