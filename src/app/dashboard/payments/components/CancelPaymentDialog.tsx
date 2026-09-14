"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Ban, Loader2 } from "lucide-react";
import { cancelPayment } from "@/actions/payment.actions";
import { useRouter } from "next/navigation";

export function CancelPaymentDialog({ paymentId }: { paymentId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError("Please provide a reason for cancelling this payment (at least 3 characters).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await cancelPayment(paymentId, reason);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to cancel payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200">
          <Ban className="w-4 h-4 mr-2" />
          Cancel Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            Cancel Payment Record
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCancel} className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Cancelling this payment will adjust the member's outstanding due balance accordingly.
            The historical record will be preserved with status <span className="font-semibold text-gray-900">CANCELLED</span> for audit integrity.
          </p>

          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cancelReason">Reason for Cancellation</Label>
            <Input
              id="cancelReason"
              placeholder="e.g. Bank chargeback, accidental duplicate entry"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading || !reason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
