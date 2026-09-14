"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { ExpenseCategory } from "@/types/enums";

export function ExpenseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "ALL");
  const [datePreset, setDatePreset] = useState(searchParams.get("datePreset") || "ALL");

  const applyFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = {
      search,
      category,
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

    params.delete("page");

    startTransition(() => {
      router.push(`/dashboard/expenses?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleClear = () => {
    setSearch("");
    setCategory("ALL");
    setDatePreset("ALL");
    startTransition(() => {
      router.push("/dashboard/expenses");
    });
  };

  const hasActiveFilters = search || category !== "ALL" || datePreset !== "ALL";

  return (
    <div className="bg-white p-4 rounded-lg border space-y-3 shadow-xs">
      <div className="grid gap-3 sm:grid-cols-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search description, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </form>

        <Select
          value={category}
          onValueChange={(val) => {
            const nextVal = val || "ALL";
            setCategory(nextVal);
            applyFilters({ category: nextVal });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value={ExpenseCategory.RENT}>Rent</SelectItem>
            <SelectItem value={ExpenseCategory.ELECTRICITY}>Electricity</SelectItem>
            <SelectItem value={ExpenseCategory.WATER}>Water</SelectItem>
            <SelectItem value={ExpenseCategory.EQUIPMENT}>Equipment</SelectItem>
            <SelectItem value={ExpenseCategory.MAINTENANCE}>Maintenance</SelectItem>
            <SelectItem value={ExpenseCategory.CLEANING}>Cleaning</SelectItem>
            <SelectItem value={ExpenseCategory.MARKETING}>Marketing</SelectItem>
            <SelectItem value={ExpenseCategory.SALARY}>Salary</SelectItem>
            <SelectItem value={ExpenseCategory.INTERNET}>Internet</SelectItem>
            <SelectItem value={ExpenseCategory.OTHER}>Other</SelectItem>
          </SelectContent>
        </Select>

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
