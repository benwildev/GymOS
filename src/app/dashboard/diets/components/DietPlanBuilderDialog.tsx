"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Utensils, 
  Loader2, 
  AlertCircle, 
  Clock 
} from "lucide-react";
import { createDietPlan, updateDietPlan, MealItemInput } from "@/actions/diet.actions";
import { PlanStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

interface MemberOption {
  id: string;
  name: string | null;
  email: string;
  profile?: {
    memberId?: string | null;
  } | null;
}

interface DietPlanBuilderDialogProps {
  members: MemberOption[];
  existingPlan?: any | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function DietPlanBuilderDialog({
  members,
  existingPlan,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: DietPlanBuilderDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setUncontrolledOpen;

  const isEditing = !!existingPlan;

  // Plan Details
  const [userId, setUserId] = useState(existingPlan?.userId || "");
  const [name, setName] = useState(existingPlan?.name || "");
  const [description, setDescription] = useState(existingPlan?.description || "");
  const [startDate, setStartDate] = useState(
    existingPlan?.startDate ? new Date(existingPlan.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    existingPlan?.endDate ? new Date(existingPlan.endDate).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState<PlanStatus>(existingPlan?.status || PlanStatus.ACTIVE);

  // Meals
  const [meals, setMeals] = useState<MealItemInput[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (existingPlan) {
      setUserId(existingPlan.userId);
      setName(existingPlan.name);
      setDescription(existingPlan.description || "");
      setStartDate(
        existingPlan.startDate ? new Date(existingPlan.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
      );
      setEndDate(
        existingPlan.endDate ? new Date(existingPlan.endDate).toISOString().split("T")[0] : ""
      );
      setStatus(existingPlan.status);
      setMeals(
        (existingPlan.meals || []).map((m: any, idx: number) => ({
          id: m.id,
          mealTime: m.mealTime,
          mealName: m.mealName,
          food: m.food,
          instructions: m.instructions || "",
          order: m.order !== undefined ? m.order : idx,
        }))
      );
    } else {
      setUserId("");
      setName("");
      setDescription("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setStatus(PlanStatus.ACTIVE);
      setMeals([
        {
          mealTime: "08:00 AM",
          mealName: "Breakfast",
          food: "Oats + 2 Eggs + 1 Banana",
          instructions: "Drink water 30 mins before",
          order: 0,
        },
        {
          mealTime: "01:00 PM",
          mealName: "Lunch",
          food: "Rice + Chicken / Fish + Fresh Salad",
          instructions: "Avoid sugary dressing",
          order: 1,
        },
        {
          mealTime: "08:00 PM",
          mealName: "Dinner",
          food: "Light proteins & steamed vegetables",
          instructions: "Eat at least 2 hours before bed",
          order: 2,
        },
      ]);
    }
  }, [existingPlan, open]);

  const handleMemberSelect = (selectedUserId: string) => {
    setUserId(selectedUserId);
    if (!name.trim()) {
      const selectedMember = members.find((m) => m.id === selectedUserId);
      if (selectedMember) {
        setName(`${selectedMember.name?.split(" ")[0] || "Member"}'s Nutrition Plan`);
      }
    }
  };

  const handleAddMeal = () => {
    const newMeal: MealItemInput = {
      mealTime: "04:00 PM",
      mealName: "Snack",
      food: "",
      instructions: "",
      order: meals.length,
    };
    setMeals([...meals, newMeal]);
  };

  const handleUpdateMeal = (index: number, field: keyof MealItemInput, value: any) => {
    const updated = [...meals];
    updated[index] = { ...updated[index], [field]: value };
    setMeals(updated);
  };

  const handleRemoveMeal = (index: number) => {
    const updated = meals.filter((_, i) => i !== index);
    setMeals(updated);
  };

  const handleMoveMeal = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const updated = [...meals];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      setMeals(updated);
    } else if (direction === "down" && index < meals.length - 1) {
      const updated = [...meals];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      setMeals(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("Please select a gym member for this diet plan.");
      return;
    }

    if (!name.trim()) {
      setError("Plan name is required.");
      return;
    }

    const validMeals = meals.filter(
      (m) => m.mealName.trim().length > 0 && m.food.trim().length > 0
    );

    if (validMeals.length === 0) {
      setError("Please add at least one valid meal with food items.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const res = await updateDietPlan(existingPlan.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          startDate,
          endDate: endDate || undefined,
          status,
          meals: validMeals,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setOpen(false);
          router.refresh();
          if (onSuccess) onSuccess();
        }
      } else {
        const res = await createDietPlan({
          userId,
          name: name.trim(),
          description: description.trim() || undefined,
          startDate,
          endDate: endDate || undefined,
          status,
          meals: validMeals,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setOpen(false);
          router.refresh();
          if (onSuccess) onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to save diet plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {isEditing ? `Edit Diet Plan: ${existingPlan.name}` : "Create Member Diet Plan"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure meal schedules, food portions, and nutritional instructions for a member.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pt-4 pr-1">
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Member & Plan Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="diet-member" className="text-xs font-semibold">
                Assign To Member <span className="text-red-500">*</span>
              </Label>
              <Select
                value={userId}
                onValueChange={handleMemberSelect}
                disabled={isEditing}
              >
                <SelectTrigger id="diet-member">
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name || "Member"} &middot; {m.profile?.memberId || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="diet-name" className="text-xs font-semibold">
                Plan Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="diet-name"
                placeholder="e.g. Weight Management, Lean Bulk, Calorie Deficit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="diet-desc" className="text-xs font-semibold">
              Diet Goals / Instructions
            </Label>
            <Input
              id="diet-desc"
              placeholder="e.g. Stay hydrated, drink 3L water daily, minimize processed sugars"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="diet-start" className="text-xs font-semibold">
                Start Date
              </Label>
              <Input
                id="diet-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="diet-end" className="text-xs font-semibold">
                End Date (optional)
              </Label>
              <Input
                id="diet-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="diet-status" className="text-xs font-semibold">
                Plan Status
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PlanStatus)}>
                <SelectTrigger id="diet-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PlanStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={PlanStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={PlanStatus.INACTIVE}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section 2: Meal Timeline Builder */}
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-600" />
                Daily Meal Routine ({meals.length} meals)
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMeal}
                className="h-7 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Meal
              </Button>
            </div>

            <div className="space-y-3 pt-1">
              {meals.map((meal, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl border bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs font-mono">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        Meal #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-black"
                        onClick={() => handleMoveMeal(index, "up")}
                        disabled={index === 0}
                        title="Move earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-black"
                        onClick={() => handleMoveMeal(index, "down")}
                        disabled={index === meals.length - 1}
                        title="Move later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveMeal(index)}
                        title="Remove meal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-gray-600">
                        Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. 08:00 AM"
                        value={meal.mealTime}
                        onChange={(e) => handleUpdateMeal(index, "mealTime", e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[11px] font-semibold text-gray-600">
                        Meal Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. Breakfast, Lunch, Post-Workout Shake, Dinner"
                        value={meal.mealName}
                        onChange={(e) => handleUpdateMeal(index, "mealName", e.target.value)}
                        required
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-gray-600">
                      Food Items & Portions <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. 100g Rolled Oats, 3 Boiled Eggs, 1 Apple, 250ml Milk"
                      value={meal.food}
                      onChange={(e) => handleUpdateMeal(index, "food", e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-gray-600">
                      Preparation / Notes (optional)
                    </Label>
                    <Input
                      placeholder="e.g. Cook in water, take multivitamins with this meal"
                      value={meal.instructions || ""}
                      onChange={(e) => handleUpdateMeal(index, "instructions", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-black hover:bg-gray-800 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Plan...
                </>
              ) : isEditing ? (
                "Update Diet Plan"
              ) : (
                "Save & Assign Plan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
