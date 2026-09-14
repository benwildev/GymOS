import { getPaymentById } from "@/actions/payment.actions";
import { formatCurrency } from "@/services/financial.service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { PrintButton } from "./components/PrintButton";

export const metadata = {
  title: "Payment Receipt | GymOS",
};

export default async function PaymentReceiptPage(props: {
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Nav (hidden when printing) */}
      <div className="print:hidden flex items-center justify-between">
        <Link
          href={`/dashboard/payments/${payment.id}`}
          className="text-xs text-muted-foreground hover:text-gray-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Payment Details
        </Link>
        <PrintButton />
      </div>

      {/* Printable Receipt Card */}
      <div 
        id="receipt-print-area"
        className="bg-white p-8 md:p-12 rounded-xl border shadow-sm print:border-0 print:shadow-none print:p-0 print:m-0 space-y-8 text-gray-900"
      >
        {/* Header / Gym Branding */}
        <div className="flex justify-between items-start border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-md bg-black text-white flex items-center justify-center text-xs font-bold">
                G
              </span>
              <h2 className="text-2xl font-bold tracking-tight">{gym?.name || "GymOS"}</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {gym?.address ? `${gym.address}, ` : ""}
              {gym?.city ? `${gym.city}, ` : ""}
              {gym?.country || ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Phone: {gym?.phone || "N/A"} &middot; Email: {gym?.email || "N/A"}
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Payment Receipt
            </span>
            <div className="text-lg font-mono font-bold text-gray-900">
              #{payment.receiptNumber || "REC-000000"}
            </div>
            <div className="text-xs text-muted-foreground">
              Date: {new Date(payment.paymentDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Member & Membership Info */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Billed To
            </span>
            <div className="font-bold text-base mt-1">{payment.user?.name || "Member"}</div>
            <div className="text-xs text-muted-foreground">Member ID: {payment.user?.profile?.memberId || "N/A"}</div>
            <div className="text-xs text-muted-foreground">Phone: {payment.user?.profile?.phone || "N/A"}</div>
            <div className="text-xs text-muted-foreground">Email: {payment.user?.email || "N/A"}</div>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Payment Details
            </span>
            <div className="font-semibold text-sm mt-1">Method: {payment.paymentMethod}</div>
            <div className="text-xs text-muted-foreground">Plan: {payment.membership?.plan?.name || "General Fee"}</div>
            <div className="text-xs text-muted-foreground">Ref: {payment.reference || "None"}</div>
            <div className="text-xs text-muted-foreground">Status: {payment.status}</div>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3.5 px-4 font-medium">
                  Membership Fee ({payment.membership?.plan?.name || "Subscription"})
                </td>
                <td className="py-3.5 px-4 text-right">
                  {formatCurrency(financials.totalCharge, currency)}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 text-muted-foreground">
                  Previous Outstanding Due
                </td>
                <td className="py-3.5 px-4 text-right text-muted-foreground">
                  {formatCurrency(financials.previousDue, currency)}
                </td>
              </tr>
              <tr className="bg-emerald-50/40">
                <td className="py-3.5 px-4 font-bold text-emerald-800">
                  Amount Received (This Transaction)
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-800 text-base">
                  {formatCurrency(financials.paidAmount, currency)}
                </td>
              </tr>
              <tr className="border-t-2">
                <td className="py-3.5 px-4 font-bold text-gray-900">
                  Remaining Due Balance
                </td>
                <td className={`py-3.5 px-4 text-right font-bold text-base ${financials.remainingDue > 0 ? "text-amber-700" : "text-gray-900"}`}>
                  {formatCurrency(financials.remainingDue, currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="pt-6 border-t text-center space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-gray-700">Thank you for your business!</p>
          <p>This is a computer-generated receipt issued by {gym?.name || "GymOS"}.</p>
          <p className="text-[10px] text-gray-400">Printed: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
