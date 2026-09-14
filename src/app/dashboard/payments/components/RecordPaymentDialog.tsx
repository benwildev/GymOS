"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, CheckCircle2, AlertCircle, CreditCard, Receipt, ArrowRight } from "lucide-react";
import { recordPayment, getMemberBalanceAction } from "@/actions/payment.actions";
import { searchMembersForCheckIn } from "@/actions/attendance.actions";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { PaymentMethod } from "@/types/enums";

interface RecordPaymentDialogProps {
  currency?: string;
  defaultMemberId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function RecordPaymentDialog({
  currency = "USD",
  defaultMemberId,
  trigger,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [memberBalance, setMemberBalance] = useState<any | null>(null);

  // Form states
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    receiptNumber: string;
    paymentId: string;
    amount: number;
    method: string;
    remainingDue: number;
    memberName: string;
  } | null>(null);

  // Search members effect
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchMembersForCheckIn(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // If defaultMemberId is provided, pre-select member
  useEffect(() => {
    if (defaultMemberId && open) {
      handleSelectMember({ id: defaultMemberId });
    }
  }, [defaultMemberId, open]);

  const handleSelectMember = async (member: any) => {
    setSelectedMember(member);
    setLoadingBalance(true);
    setError(null);
    try {
      const res = await getMemberBalanceAction(member.id);
      if (res.error) {
        setError(res.error);
      } else if (res.summary) {
        setMemberBalance(res.summary);
        setAmount(res.summary.totalDue > 0 ? res.summary.totalDue.toString() : "0");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch member balance.");
    } finally {
      setLoadingBalance(false);
    }
  };


  const resetForm = () => {
    setSelectedMember(null);
    setMemberBalance(null);
    setSearchQuery("");
    setSearchResults([]);
    setAmount("");
    setPaymentMethod(PaymentMethod.CASH);
    setReference("");
    setNote("");
    setError(null);
    setSuccessData(null);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const currentDue = memberBalance?.totalDue || 0;
  const isOverpayment = parsedAmount > currentDue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setError("Please select a member.");
      return;
    }

    if (parsedAmount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (isOverpayment) {
      setError(`Payment exceeds the outstanding balance (${formatCurrency(currentDue, currency)}).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const activeMembership = memberBalance?.memberships?.[0];
      const res = await recordPayment({
        userId: selectedMember.id,
        membershipId: activeMembership?.id,
        amount: parsedAmount,
        paymentMethod,
        paymentDate,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });

      if (res.error) {
        setError(res.error);
      } else if (res.success && res.payment) {
        const remaining = Math.max(0, currentDue - parsedAmount);
        setSuccessData({
          receiptNumber: res.receiptNumber || res.payment.receiptNumber || "REC",
          paymentId: res.payment.id,
          amount: parsedAmount,
          method: paymentMethod,
          remainingDue: remaining,
          memberName: memberBalance?.name || selectedMember.name || "Member",
        });
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
            <CreditCard className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Record Member Payment
          </DialogTitle>
        </DialogHeader>

        {successData ? (
          <div className="py-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Payment Recorded Successfully</h3>
              <p className="text-sm text-muted-foreground">
                Receipt #{successData.receiptNumber} generated for {successData.memberName}.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border divide-y text-sm">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-emerald-700">{formatCurrency(successData.amount, currency)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium text-gray-900">{successData.method}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Remaining Due</span>
                <span className={`font-semibold ${successData.remainingDue > 0 ? "text-amber-700" : "text-gray-900"}`}>
                  {formatCurrency(successData.remainingDue, currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href={`/dashboard/payments/${successData.paymentId}/receipt`} onClick={() => setOpen(false)}>
                <Button variant="outline" className="gap-2">
                  <Receipt className="w-4 h-4" />
                  View Receipt
                </Button>
              </Link>
              <Button onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 text-sm bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Member Selection */}
            {!selectedMember ? (
              <div className="space-y-2">
                <Label>Search Member</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-md border bg-white divide-y shadow-xs">
                    {searchResults.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMember(m)}
                        className="w-full text-left p-2.5 hover:bg-gray-50 flex items-center justify-between text-sm transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-gray-900">{m.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.memberId ? `${m.memberId} • ` : ""}{m.email}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Select
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                  <p className="text-xs text-muted-foreground">No matching members found.</p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900">{memberBalance?.name || selectedMember.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({memberBalance?.memberId || "No ID"})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => {
                      setSelectedMember(null);
                      setMemberBalance(null);
                    }}
                  >
                    Change
                  </Button>
                </div>

                {loadingBalance ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Calculating current balance...
                  </div>
                ) : memberBalance ? (
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t text-xs">
                    <div>
                      <span className="text-muted-foreground">Total Fee:</span>
                      <p className="font-medium text-gray-900">{formatCurrency(memberBalance.totalCharges, currency)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Paid So Far:</span>
                      <p className="font-medium text-emerald-700">{formatCurrency(memberBalance.totalPaid, currency)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Due:</span>
                      <p className="font-bold text-amber-700">{formatCurrency(memberBalance.totalDue, currency)}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Step 2: Payment Details */}
            {selectedMember && memberBalance && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Payment Amount ({currency})</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      min="0.01"
                      max={currentDue}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                    {isOverpayment && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        Exceeds current due ({formatCurrency(currentDue, currency)})
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                      <SelectTrigger id="method">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                        <SelectItem value={PaymentMethod.BKASH}>bKash</SelectItem>
                        <SelectItem value={PaymentMethod.NAGAD}>Nagad</SelectItem>
                        <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
                        <SelectItem value={PaymentMethod.BANK}>Bank Transfer</SelectItem>
                        <SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reference">Reference / Trx ID (Optional)</Label>
                    <Input
                      id="reference"
                      placeholder="e.g. TXN-94812"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note">Notes (Optional)</Label>
                  <Input
                    id="note"
                    placeholder="e.g. First installment"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || parsedAmount <= 0 || isOverpayment}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirm & Record
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
