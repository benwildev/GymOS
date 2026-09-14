"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, AlertCircle, ReceiptText } from "lucide-react";
import { createExpense } from "@/actions/expense.actions";
import { ExpenseCategory } from "@/types/enums";

export function AddExpenseDialog({ currency = "USD" }: { currency?: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.OTHER);
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCategory(ExpenseCategory.OTHER);
    setAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setReference("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a description for the expense.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createExpense({
        category,
        amount: num,
        expenseDate,
        description: description.trim(),
        reference: reference.trim() || undefined,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        resetForm();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to record expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 text-white gap-2 shadow-xs">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-gray-900" />
            Record Gym Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="exp-category">Expense Category</Label>
            <Select value={category} onValueChange={(val: any) => setCategory(val)}>
              <SelectTrigger id="exp-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount ({currency})</Label>
              <Input
                id="exp-amount"
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Expense Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-desc">Description</Label>
            <Input
              id="exp-desc"
              placeholder="e.g. Monthly rent for gym space, new barbell set"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-ref">Reference / Invoice # (Optional)</Label>
            <Input
              id="exp-ref"
              placeholder="e.g. INV-2026-081"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-black hover:bg-gray-800 text-white">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Expense"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
