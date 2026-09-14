import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMemberFinancialSummary } from "@/services/financial.service";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentStatus } from "@/types/enums";
import { Receipt, CreditCard, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Payments & Receipts | GymOS",
};

export default async function MemberPaymentsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const [financialSummary, gym] = await Promise.all([
    getMemberFinancialSummary(session.user.id),
    prisma.gym.findFirst(),
  ]);

  const currency = gym?.currency || "USD";
  const payments = financialSummary?.payments || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments & Receipts</h1>
          <p className="text-muted-foreground text-sm">
            View your membership billing history, balance, and official payment receipts.
          </p>
        </div>
        <Link href="/member">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Button>
        </Link>
      </div>

      {/* Financial Summary Bento */}
      {financialSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Billed</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {formatCurrency(financialSummary.totalCharges, currency)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Cumulative membership subscription charges</p>
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Paid</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600">
                {formatCurrency(financialSummary.totalPaid, currency)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Total verified payments settled to gym</p>
            </CardContent>
          </Card>

          <Card className={`border ${financialSummary.totalDue > 0 ? "border-amber-300 bg-amber-50/20" : "border-border/60"}`}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">Balance Due</CardDescription>
                <CardTitle className={`text-2xl font-bold ${financialSummary.totalDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {formatCurrency(financialSummary.totalDue, currency)}
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${
                  financialSummary.totalDue > 0
                    ? "border-amber-400 text-amber-700 bg-amber-100/50"
                    : "border-emerald-400 text-emerald-700 bg-emerald-50"
                }`}
              >
                {financialSummary.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {financialSummary.totalDue > 0
                  ? "Pending balance. Please pay at gym reception."
                  : "All accounts are settled and paid in full."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Callout */}
      <div className="p-4 rounded-xl border bg-muted/30 flex items-start gap-3 text-xs text-muted-foreground">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">Need to make a payment?</span>
          <p className="mt-0.5">
            Payments are collected in person or via front-desk approved channels (Cash, bKash, Nagad, POS Card, Bank). 
            Once received by the gym staff, an official receipt will be issued and reflected here immediately.
          </p>
        </div>
      </div>

      {/* Payment History List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History & Invoices</CardTitle>
          <CardDescription>Official transaction records and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              No payment transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/20">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold">
                        {p.receiptNumber || "REC-N/A"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="font-medium text-[11px]">
                          {p.paymentMethod}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            p.status === PaymentStatus.COMPLETED
                              ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                              : p.status === PaymentStatus.CANCELLED
                              ? "border-red-200 text-red-700 bg-red-50 line-through"
                              : ""
                          }`}
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {formatCurrency(p.amount, currency)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.receiptNumber && (
                          <Link href={`/member/payments/${p.id}/receipt`} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                              <Receipt className="w-3.5 h-3.5" />
                              Receipt
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
