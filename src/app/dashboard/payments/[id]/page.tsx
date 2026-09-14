import { getPaymentById } from "@/actions/payment.actions";
import { formatCurrency } from "@/services/financial.service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, Calendar, CreditCard, User, ShieldCheck, Clock, FileText, Ban } from "lucide-react";
import { CancelPaymentDialog } from "../components/CancelPaymentDialog";
import { PaymentStatus } from "@/types/enums";

export const metadata = {
  title: "Payment Details | GymOS",
};

export default async function PaymentDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const data = await getPaymentById(params.id);

  if (data.error || !data.payment) {
    notFound();
  }

  const { payment, gym, financials } = data;
  const currency = gym?.currency || "USD";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard/payments"
            className="text-xs text-muted-foreground hover:text-gray-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Payments
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
            <Badge
              variant={payment.status === PaymentStatus.COMPLETED ? "default" : "secondary"}
              className={payment.status === PaymentStatus.COMPLETED ? "bg-emerald-100 text-emerald-800" : ""}
            >
              {payment.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Receipt #{payment.receiptNumber || "N/A"} &middot; Recorded on {new Date(payment.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/payments/${payment.id}/receipt`}>
            <Button variant="outline" className="gap-2">
              <Receipt className="w-4 h-4" />
              View Receipt
            </Button>
          </Link>
          {payment.status === PaymentStatus.COMPLETED && (
            <CancelPaymentDialog paymentId={payment.id} />
          )}
        </div>
      </div>

      {payment.status === PaymentStatus.CANCELLED && payment.cancelReason && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-start gap-3">
          <Ban className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Payment Cancelled: </span>
            <span>{payment.cancelReason}</span>
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Payment Summary */}
        <Card className="md:col-span-2 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Transaction Breakdown</CardTitle>
            <CardDescription className="text-xs">Financial details of this collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-xs text-muted-foreground">Amount Paid</span>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(payment.amount, currency)}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Payment Method</span>
                <div className="text-base font-semibold text-gray-900 mt-1">
                  {payment.paymentMethod}
                </div>
              </div>
            </div>

            <div className="divide-y text-sm pt-2">
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">Payment Date</span>
                <span className="font-medium text-gray-900">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">Transaction Reference</span>
                <span className="font-mono text-xs font-medium text-gray-900">
                  {payment.reference || "None provided"}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">Receipt Number</span>
                <span className="font-mono text-xs font-semibold text-gray-900">
                  {payment.receiptNumber || "N/A"}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">Previous Outstanding Due</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(financials.previousDue, currency)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">Remaining Balance After Payment</span>
                <span className={`font-semibold ${financials.remainingDue > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                  {formatCurrency(financials.remainingDue, currency)}
                </span>
              </div>
              {payment.note && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="text-gray-900">{payment.note}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Member & Membership Info */}
        <div className="space-y-6">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Member Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Link
                  href={`/dashboard/members/${payment.userId}`}
                  className="font-bold text-gray-900 hover:underline block"
                >
                  {payment.user?.name || "Member"}
                </Link>
                <div className="text-xs text-muted-foreground">
                  ID: {payment.user?.profile?.memberId || "N/A"}
                </div>
              </div>
              <div className="pt-2 border-t text-xs space-y-1">
                <div className="text-muted-foreground">Email: <span className="text-gray-900">{payment.user?.email}</span></div>
                <div className="text-muted-foreground">Phone: <span className="text-gray-900">{payment.user?.profile?.phone || "-"}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Membership Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="font-semibold text-gray-900">
                {payment.membership?.plan?.name || "General Payment"}
              </div>
              {payment.membership?.plan && (
                <div className="text-xs text-muted-foreground">
                  Plan price: {formatCurrency(payment.membership.plan.price, currency)} for {payment.membership.plan.duration} days
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
