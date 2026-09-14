"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGymSettings } from "@/actions/gym.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SettingsFormProps {
  gym: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    currency: string;
  } | null;
}

export function SettingsForm({ gym }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await updateGymSettings(formData);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccess(true);
          router.refresh();
          // Hide success message after 4 seconds
          setTimeout(() => setSuccess(false), 4000);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to update settings.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Gym settings updated successfully! Header and branding have been refreshed.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Gym Name</Label>
        <Input id="name" name="name" defaultValue={gym?.name || ""} placeholder="e.g. Iron Pulse Gym" required />
        <p className="text-[11px] text-muted-foreground">
          This name will appear on the top navigation, member portal, login page, and receipts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Contact Email</Label>
          <Input id="email" name="email" type="email" defaultValue={gym?.email || ""} placeholder="contact@gym.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={gym?.phone || ""} placeholder="+1 (555) 000-0000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={gym?.address || ""} placeholder="Street address" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={gym?.city || ""} placeholder="City" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={gym?.country || ""} placeholder="Country" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency Code</Label>
        <Input id="currency" name="currency" defaultValue={gym?.currency || "USD"} placeholder="USD, BDT, EUR, GBP..." />
        <p className="text-[11px] text-muted-foreground">Used for all payment amounts, receipts, and revenue summaries.</p>
      </div>

      <div className="pt-4 flex items-center gap-3">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Saving Changes..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
