"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGoalAction } from "@/actions/progress.actions";
import { Target, CheckCircle2, AlertCircle, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface AddGoalDialogProps {
  userId: string;
  memberName?: string;
  trigger?: React.ReactNode;
  buttonVariant?: "default" | "outline" | "ghost" | "header";
  buttonText?: string;
  onSuccess?: () => void;
}

const GOAL_OPTIONS = [
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "STRENGTH", label: "Strength Training" },
  { value: "GENERAL_FITNESS", label: "General Fitness" },
  { value: "ENDURANCE", label: "Endurance & Stamina" },
  { value: "FLEXIBILITY", label: "Flexibility & Mobility" },
  { value: "BODY_RECOMPOSITION", label: "Body Recomposition" },
  { value: "OTHER", label: "Other / Custom Goal" },
];

export function AddGoalDialog({
  userId,
  memberName,
  trigger,
  buttonVariant,
  buttonText,
  onSuccess,
}: AddGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [goalType, setGoalType] = useState("WEIGHT_LOSS");
  const [title, setTitle] = useState("Target Weight Loss");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState("kg");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [targetDate, setTargetDate] = useState("");

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGoalTypeChange = (type: string | null) => {
    if (!type) return;
    setGoalType(type);
    const match = GOAL_OPTIONS.find((g) => g.value === type);
    if (match) {
      setTitle(match.label);
      if (type === "WEIGHT_LOSS" || type === "MUSCLE_GAIN" || type === "BODY_RECOMPOSITION") {
        setTargetUnit("kg");
      } else if (type === "STRENGTH") {
        setTargetUnit("kg lift");
      } else {
        setTargetUnit("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("goalType", goalType);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("targetValue", targetValue);
    formData.append("targetUnit", targetUnit);
    formData.append("startDate", startDate);
    formData.append("targetDate", targetDate);

    const res = await createGoalAction(formData);

    setIsPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 1000);
    }
  };

  const renderTrigger = () => {
    if (trigger) return trigger;

    if (buttonVariant === "header") {
      return (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 cursor-pointer shadow-xs text-slate-700"
        >
          <Target className="h-4 w-4 text-emerald-600" />
          {buttonText || "Set Goal"}
        </button>
      );
    }

    if (buttonVariant === "ghost") {
      return (
        <button
          type="button"
          className="inline-flex items-center gap-1 h-7 text-xs font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer"
        >
          {buttonText || "Set Goal"} <ArrowRight className="w-3 h-3" />
        </button>
      );
    }

    return (
      <Button size="sm" variant="outline" className="gap-1.5 border-slate-200">
        <Plus className="h-4 w-4" />
        {buttonText || "Set Fitness Goal"}
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Target className="h-5 w-5 text-emerald-600" />
            Set Primary Fitness Goal
          </DialogTitle>
          <DialogDescription>
            Assign or update the active fitness milestone for {memberName || "this member"}.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-in zoom-in">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Goal Successfully Set!</h3>
            <p className="text-xs text-muted-foreground">The member portal and progress dashboard reflect this active target.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="goalType" className="text-xs font-semibold">Goal Category</Label>
              <Select value={goalType} onValueChange={handleGoalTypeChange}>
                <SelectTrigger id="goalType" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">
                Goal Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lose 5 kg by summer"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="targetValue" className="text-xs font-semibold">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. 70"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetUnit" className="text-xs font-semibold">Unit</Label>
                <Input
                  id="targetUnit"
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  placeholder="kg, cm, %"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetDate" className="text-xs font-semibold">Target Date (Optional)</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">Description / Notes</Label>
              <Textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specific guidance or notes for this goal..."
                className="text-xs resize-none"
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
                {isPending ? "Saving..." : "Save Goal"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
