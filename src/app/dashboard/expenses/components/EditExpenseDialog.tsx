"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Loader2, AlertCircle, Ban } from "lucide-react";
import { updateExpense, cancelExpense } from "@/actions/expense.actions";
import { ExpenseCategory } from "@/types/enums";

interface EditExpenseDialogProps {
  expense: {
    id: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date | string;
    description: string;
    reference: string | null;
  };
  currency?: string;
}

export function EditExpenseDialog({ expense, currency = "USD" }: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [expenseDate, setExpenseDate] = useState(
    new Date(expense.expenseDate).toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(expense.description);
  const [reference, setReference] = useState(expense.reference || "");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a description.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await updateExpense(expense.id, {
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
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update expense.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExpense = async () => {
    if (!confirm("Are you sure you want to cancel this expense? Historical financial tracking will be preserved.")) {
      return;
    }

    setCancelling(true);
    setError(null);

    try {
      const res = await cancelExpense(expense.id);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to cancel expense.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs">
          <Edit2 className="w-3.5 h-3.5 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Edit Expense</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={category} onValueChange={(val: any) => setCategory(val)}>
              <SelectTrigger id="edit-category">
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
              <Label htmlFor="edit-amount">Amount ({currency})</Label>
              <Input
                id="edit-amount"
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Description</Label>
            <Input
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-ref">Reference</Label>
            <Input
              id="edit-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelExpense}
              disabled={cancelling}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs"
            >
              {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5 mr-1" />}
              Cancel Record
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={loading} className="bg-black hover:bg-gray-800 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
