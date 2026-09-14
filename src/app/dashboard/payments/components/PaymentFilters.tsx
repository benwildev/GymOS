"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { PaymentMethod, PaymentStatus } from "@/types/enums";

export function PaymentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [method, setMethod] = useState(searchParams.get("method") || "ALL");
  const [status, setStatus] = useState(searchParams.get("status") || "ALL");
  const [datePreset, setDatePreset] = useState(searchParams.get("datePreset") || "ALL");

  const applyFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Merge existing and new
    const current = {
      search,
      method,
      status,
      datePreset,
      ...newParams,
    };

    Object.entries(current).forEach(([k, v]) => {
      if (v && v !== "ALL" && v.trim() !== "") {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });

    params.delete("page"); // reset to page 1 on filter change

    startTransition(() => {
      router.push(`/dashboard/payments?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleClear = () => {
    setSearch("");
    setMethod("ALL");
    setStatus("ALL");
    setDatePreset("ALL");
    startTransition(() => {
      router.push("/dashboard/payments");
    });
  };

  const hasActiveFilters = search || method !== "ALL" || status !== "ALL" || datePreset !== "ALL";

  return (
    <div className="bg-white p-4 rounded-lg border space-y-3 shadow-xs">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search member, ID, receipt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </form>

        {/* Date Preset */}
        <Select
          value={datePreset}
          onValueChange={(val) => {
            const nextVal = val || "ALL";
            setDatePreset(nextVal);
            applyFilters({ datePreset: nextVal });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Date: All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Time</SelectItem>
            <SelectItem value="TODAY">Today</SelectItem>
            <SelectItem value="YESTERDAY">Yesterday</SelectItem>
            <SelectItem value="THIS_WEEK">This Week</SelectItem>
            <SelectItem value="THIS_MONTH">This Month</SelectItem>
            <SelectItem value="LAST_MONTH">Last Month</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Method */}
        <Select
          value={method}
          onValueChange={(val) => {
            const nextVal = val || "ALL";
            setMethod(nextVal);
            applyFilters({ method: nextVal });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Method: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Methods</SelectItem>
            <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
            <SelectItem value={PaymentMethod.BKASH}>bKash</SelectItem>
            <SelectItem value={PaymentMethod.NAGAD}>Nagad</SelectItem>
            <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
            <SelectItem value={PaymentMethod.BANK}>Bank Transfer</SelectItem>
            <SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={status}
          onValueChange={(val) => {
            const nextVal = val || "ALL";
            setStatus(nextVal);
            applyFilters({ status: nextVal });
          }}
        >

          <SelectTrigger>
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value={PaymentStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={PaymentStatus.CANCELLED}>Cancelled</SelectItem>
            <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t">
          <span>Active filters applied</span>
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs gap-1">
            <X className="w-3.5 h-3.5" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
