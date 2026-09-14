"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Dumbbell, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Info 
} from "lucide-react";
import { createWorkoutPlan, updateWorkoutPlan, ExerciseItemInput } from "@/actions/workout.actions";
import { PlanStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

interface MemberOption {
  id: string;
  name: string | null;
  email: string;
  profile?: {
    memberId?: string | null;
  } | null;
}

interface WorkoutPlanBuilderDialogProps {
  members: MemberOption[];
  existingPlan?: any | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function WorkoutPlanBuilderDialog({
  members,
  existingPlan,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: WorkoutPlanBuilderDialogProps) {
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

  // Exercises
  const [exercises, setExercises] = useState<ExerciseItemInput[]>([]);
  const [selectedDay, setSelectedDay] = useState("MONDAY");

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
      setExercises(
        (existingPlan.exercises || []).map((ex: any, idx: number) => ({
          id: ex.id,
          day: ex.day,
          exerciseName: ex.exerciseName,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          restSeconds: ex.restSeconds,
          instructions: ex.instructions || "",
          order: ex.order !== undefined ? ex.order : idx,
        }))
      );
    } else {
      setUserId("");
      setName("");
      setDescription("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setStatus(PlanStatus.ACTIVE);
      setExercises([]);
    }
  }, [existingPlan, open]);

  // Handle auto-naming plan based on member selection
  const handleMemberSelect = (selectedUserId: string) => {
    setUserId(selectedUserId);
    if (!name.trim()) {
      const selectedMember = members.find((m) => m.id === selectedUserId);
      if (selectedMember) {
        setName(`${selectedMember.name?.split(" ")[0] || "Member"}'s Workout Routine`);
      }
    }
  };

  // Add Exercise to current day
  const handleAddExercise = () => {
    const newEx: ExerciseItemInput = {
      day: selectedDay,
      exerciseName: "",
      sets: 3,
      reps: "10",
      weight: 0,
      restSeconds: 60,
      instructions: "",
      order: exercises.filter((e) => e.day === selectedDay).length,
    };
    setExercises([...exercises, newEx]);
  };

  const handleUpdateExercise = (index: number, field: keyof ExerciseItemInput, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    setExercises(updated);
  };

  const handleMoveExercise = (index: number, direction: "up" | "down") => {
    const targetDay = exercises[index].day;
    const dayIndices = exercises
      .map((ex, i) => (ex.day === targetDay ? i : -1))
      .filter((i) => i !== -1);

    const positionInDay = dayIndices.indexOf(index);
    if (direction === "up" && positionInDay > 0) {
      const swapIndex = dayIndices[positionInDay - 1];
      const updated = [...exercises];
      const temp = updated[index];
      updated[index] = updated[swapIndex];
      updated[swapIndex] = temp;
      setExercises(updated);
    } else if (direction === "down" && positionInDay < dayIndices.length - 1) {
      const swapIndex = dayIndices[positionInDay + 1];
      const updated = [...exercises];
      const temp = updated[index];
      updated[index] = updated[swapIndex];
      updated[swapIndex] = temp;
      setExercises(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("Please select a gym member for this plan.");
      return;
    }

    if (!name.trim()) {
      setError("Plan name is required.");
      return;
    }

    // Filter out completely blank exercises if any
    const validExercises = exercises.filter((ex) => ex.exerciseName.trim().length > 0);

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const res = await updateWorkoutPlan(existingPlan.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          startDate,
          endDate: endDate || undefined,
          status,
          exercises: validExercises,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setOpen(false);
          router.refresh();
          if (onSuccess) onSuccess();
        }
      } else {
        const res = await createWorkoutPlan({
          userId,
          name: name.trim(),
          description: description.trim() || undefined,
          startDate,
          endDate: endDate || undefined,
          status,
          exercises: validExercises,
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
      setError(err.message || "Failed to save workout plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {isEditing ? `Edit Plan: ${existingPlan.name}` : "Create Member Workout Plan"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Design a structured weekly routine with exercises, sets, reps, weight, and rest guidance.
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
              <Label htmlFor="plan-member" className="text-xs font-semibold">
                Assign To Member <span className="text-red-500">*</span>
              </Label>
              <Select
                value={userId}
                onValueChange={handleMemberSelect}
                disabled={isEditing}
              >
                <SelectTrigger id="plan-member">
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
              <Label htmlFor="plan-name" className="text-xs font-semibold">
                Plan Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="plan-name"
                placeholder="e.g. Beginner Strength, Push Pull Legs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-desc" className="text-xs font-semibold">
              Goal / Plan Instructions
            </Label>
            <Input
              id="plan-desc"
              placeholder="e.g. Focus on progressive overload. Warm up 5 mins before heavy sets."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="plan-start" className="text-xs font-semibold">
                Start Date
              </Label>
              <Input
                id="plan-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-end" className="text-xs font-semibold">
                End Date (optional)
              </Label>
              <Input
                id="plan-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-status" className="text-xs font-semibold">
                Plan Status
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PlanStatus)}>
                <SelectTrigger id="plan-status">
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

          {/* Section 2: Day Tabs & Exercise Builder */}
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-emerald-600" />
                Exercise Program Routine
              </div>
              <span className="text-[11px] text-muted-foreground">
                Total exercises: {exercises.length}
              </span>
            </div>

            {/* Day Selector Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-lg">
              {DAYS_OF_WEEK.map((day) => {
                const count = exercises.filter((e) => e.day === day).length;
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-black text-white shadow-xs"
                        : "text-gray-600 hover:text-black hover:bg-gray-200/60"
                    }`}
                  >
                    <span>{day.slice(0, 3)}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? "bg-emerald-500 text-black" : "bg-gray-300 text-gray-800"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Exercises for the currently selected Day */}
            <div className="space-y-3 pt-2">
              {exercises
                .map((ex, originalIndex) => ({ ex, originalIndex }))
                .filter(({ ex }) => ex.day === selectedDay)
                .map(({ ex, originalIndex }, dayIndex) => (
                  <div
                    key={originalIndex}
                    className="p-3.5 rounded-xl border bg-white shadow-2xs space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs font-mono">
                          {dayIndex + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-700 uppercase">
                          {selectedDay} Exercise
                        </span>
                      </div>

                      {/* Reordering & Delete */}
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-black"
                          onClick={() => handleMoveExercise(originalIndex, "up")}
                          disabled={dayIndex === 0}
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-black"
                          onClick={() => handleMoveExercise(originalIndex, "down")}
                          disabled={
                            dayIndex ===
                            exercises.filter((e) => e.day === selectedDay).length - 1
                          }
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveExercise(originalIndex)}
                          title="Remove exercise"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-600">
                          Exercise Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. Bench Press, Squats, Lat Pulldown"
                          value={ex.exerciseName}
                          onChange={(e) =>
                            handleUpdateExercise(originalIndex, "exerciseName", e.target.value)
                          }
                          required
                          className="h-8 text-xs font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-gray-600">Sets</Label>
                          <Input
                            type="number"
                            min={1}
                            value={ex.sets}
                            onChange={(e) =>
                              handleUpdateExercise(originalIndex, "sets", parseInt(e.target.value, 10) || 1)
                            }
                            className="h-8 text-xs font-medium text-center"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-gray-600">Reps</Label>
                          <Input
                            placeholder="10"
                            value={ex.reps}
                            onChange={(e) =>
                              handleUpdateExercise(originalIndex, "reps", e.target.value)
                            }
                            className="h-8 text-xs font-medium text-center"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-gray-600">Weight (kg)</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={ex.weight || ""}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateExercise(originalIndex, "weight", parseFloat(e.target.value) || 0)
                            }
                            className="h-8 text-xs font-medium text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-600">Rest Seconds</Label>
                        <Input
                          type="number"
                          step="15"
                          min={0}
                          value={ex.restSeconds || ""}
                          placeholder="60"
                          onChange={(e) =>
                            handleUpdateExercise(originalIndex, "restSeconds", parseInt(e.target.value, 10) || 0)
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-600">Form Notes / Cue</Label>
                        <Input
                          placeholder="e.g. Pause at bottom, explode up"
                          value={ex.instructions || ""}
                          onChange={(e) =>
                            handleUpdateExercise(originalIndex, "instructions", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddExercise}
                className="w-full border-dashed border-gray-300 hover:border-gray-900 text-xs text-gray-700 py-3 gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Exercise to {selectedDay}
              </Button>
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
                "Update Workout Plan"
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
