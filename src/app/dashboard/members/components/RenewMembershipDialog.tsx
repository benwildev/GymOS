"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { renewMembershipAction } from "@/actions/membership-renewal.actions";
import { formatCurrency } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { RefreshCw, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RenewMembershipDialogProps {
  userId: string;
  memberName: string;
  activeMembership?: {
    id?: string;
    plan?: { name: string; price: number; duration?: number };
    endDate: Date | string;
    status: string;
  } | null;
  availablePlans: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
  currency?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function RenewMembershipDialog({
  userId,
  memberName,
  activeMembership,
  availablePlans,
  currency = "USD",
  trigger,
  onSuccess,
}: RenewMembershipDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    availablePlans[0]?.id || ""
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentAmount, setPaymentAmount] = useState<string>(
    availablePlans[0]?.price?.toString() || ""
  );
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0];

  const now = new Date();
  const hasActivePeriod =
    activeMembership && new Date(activeMembership.endDate) > now;
  const computedStartDate = hasActivePeriod
    ? new Date(activeMembership.endDate)
    : now;
  const computedEndDate = selectedPlan
    ? addDays(computedStartDate, selectedPlan.duration)
    : addDays(computedStartDate, 30);

  const handlePlanChange = (planId: string | null) => {
    if (!planId) return;
    setSelectedPlanId(planId);
    const plan = availablePlans.find((p) => p.id === planId);
    if (plan) {
      setPaymentAmount(plan.price.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("planId", selectedPlan.id);
    formData.append("paymentMethod", paymentMethod);
    formData.append("paymentAmount", paymentAmount);
    formData.append("reference", reference);
    formData.append("note", note);

    const res = await renewMembershipAction(formData);

    setIsPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2 bg-[#1a9d5e] hover:bg-[#15804d] text-white">
            <RefreshCw className="h-4 w-4" />
            Renew Membership
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <RefreshCw className="h-5 w-5 text-emerald-600" />
            Renew Membership
          </DialogTitle>
          <DialogDescription>
            Extend or start a new membership for <span className="font-semibold text-slate-900">{memberName}</span>. Previous records and payments remain preserved.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-in zoom-in">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Membership Renewed Successfully!</h3>
            <p className="text-xs text-muted-foreground">Receipt generated and subscription period updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Current status preview */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
              <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Current Subscription Status
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">
                  {activeMembership?.plan?.name || "No Active Plan"}
                </span>
                {activeMembership?.status === "ACTIVE" ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    Expired / None
                  </Badge>
                )}
              </div>
              {activeMembership?.endDate && (
                <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                  <Calendar className="h-3 w-3" />
                  Expires on: <span className="font-medium text-slate-700">{format(new Date(activeMembership.endDate), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            {/* Plan selection */}
            <div className="space-y-1.5">
              <Label htmlFor="plan" className="text-xs font-semibold">New Membership Plan</Label>
              <Select value={selectedPlanId} onValueChange={handlePlanChange}>
                <SelectTrigger id="plan" className="h-9">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} &middot; {formatCurrency(plan.price, currency)} ({plan.duration} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subscription Dates Calculation */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs">
              <div>
                <span className="text-emerald-700 text-[11px] font-medium block">Effective Start Date</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {format(computedStartDate, "MMM d, yyyy")}
                </span>
                {hasActivePeriod && (
                  <span className="text-[10px] text-emerald-600 block mt-0.5">(Starts after current expiry)</span>
                )}
              </div>
              <div>
                <span className="text-emerald-700 text-[11px] font-medium block">New Expiration Date</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {format(computedEndDate, "MMM d, yyyy")}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">({selectedPlan?.duration || 30} days validity)</span>
              </div>
            </div>

            {/* Payment fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="paymentAmount" className="text-xs font-semibold">
                  Amount Received ({currency})
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paymentMethod" className="text-xs font-semibold">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(val) => { if (val) setPaymentMethod(val); }}>
                  <SelectTrigger id="paymentMethod" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BKASH">bKash</SelectItem>
                    <SelectItem value="NAGAD">Nagad</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reference" className="text-xs font-semibold">Transaction Reference (Optional)</Label>
              <Input
                id="reference"
                placeholder="e.g. TRX-98234 or Check #"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="h-9"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-[#1a9d5e] hover:bg-[#15804d] text-white"
              >
                {isPending ? "Processing..." : "Confirm Renewal"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
