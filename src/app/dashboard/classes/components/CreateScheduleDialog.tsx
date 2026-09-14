"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPlus, Loader2, AlertCircle } from "lucide-react";
import { createClassSchedule } from "@/actions/class.actions";
import { useRouter } from "next/navigation";

interface CreateScheduleDialogProps {
  classes: Array<{
    id: string;
    name: string;
    duration: number;
    capacity: number;
  }>;
  trigger?: React.ReactNode;
  defaultClassId?: string;
  onSuccess?: () => void;
}

export function CreateScheduleDialog({
  classes,
  trigger,
  defaultClassId,
  onSuccess,
}: CreateScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState(defaultClassId || (classes[0]?.id || ""));
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("07:00 AM");
  const [endTime, setEndTime] = useState("08:00 AM");
  const [capacity, setCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleClassChange = (selectedId: string | null) => {
    if (!selectedId) return;
    setClassId(selectedId);
    const selected = classes.find((c) => c.id === selectedId);
    if (selected) {
      setCapacity(String(selected.capacity));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!classId) {
      setError("Please select a gym class.");
      return;
    }

    if (!date) {
      setError("Session date is required.");
      return;
    }

    if (!startTime.trim() || !endTime.trim()) {
      setError("Start and end times are required.");
      return;
    }

    const numCapacity = capacity ? parseInt(capacity, 10) : undefined;
    if (numCapacity !== undefined && (isNaN(numCapacity) || numCapacity <= 0)) {
      setError("Capacity must be at least 1 member.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createClassSchedule({
        classId,
        date,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        capacity: numCapacity,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to schedule class session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <CalendarPlus className="w-4 h-4 text-emerald-600" />
            Schedule Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Schedule Class Session</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="schedule-class" className="text-xs font-semibold">
              Gym Class <span className="text-red-500">*</span>
            </Label>
            <Select value={classId} onValueChange={handleClassChange}>
              <SelectTrigger id="schedule-class">
                <SelectValue placeholder="Choose a class..." />
              </SelectTrigger>
              <SelectContent>
                {classes.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No classes available. Create one first!
                  </SelectItem>
                ) : (
                  classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.duration} mins &middot; {c.capacity} spots)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="schedule-date" className="text-xs font-semibold">
              Session Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="schedule-date"
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="schedule-start" className="text-xs font-semibold">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="schedule-start"
                placeholder="e.g. 07:00 AM"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule-end" className="text-xs font-semibold">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="schedule-end"
                placeholder="e.g. 08:00 AM"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="schedule-cap" className="text-xs font-semibold">
              Session Capacity Limit (optional override)
            </Label>
            <Input
              id="schedule-cap"
              type="number"
              min={1}
              placeholder="Leave empty to use class default"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || classes.length === 0}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Publish Session"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
