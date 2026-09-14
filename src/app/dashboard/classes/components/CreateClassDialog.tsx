"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { createClass } from "@/actions/class.actions";
import { ClassStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

interface CreateClassDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateClassDialog({ trigger, onSuccess }: CreateClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [capacity, setCapacity] = useState("20");
  const [status, setStatus] = useState<ClassStatus>(ClassStatus.ACTIVE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const resetForm = () => {
    setName("");
    setDescription("");
    setDuration("60");
    setCapacity("20");
    setStatus(ClassStatus.ACTIVE);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Class name is required.");
      return;
    }

    const numDuration = parseInt(duration, 10);
    if (isNaN(numDuration) || numDuration <= 0) {
      setError("Duration must be a positive number of minutes.");
      return;
    }

    const numCapacity = parseInt(capacity, 10);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      setError("Capacity must be at least 1 member.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createClass({
        name: name.trim(),
        description: description.trim() || undefined,
        duration: numDuration,
        capacity: numCapacity,
        status,
      });

      if (res.error) {
        setError(res.error);
      } else {
        resetForm();
        setOpen(false);
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-black hover:bg-gray-800 text-white gap-2">
            <Plus className="w-4 h-4" />
            Create Class
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Create New Class</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">
              Class Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Morning Yoga, HIIT Blast, Zumba"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              Description / Overview
            </Label>
            <textarea
              id="description"
              className="w-full min-h-[72px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Brief description of this workout session..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-xs font-semibold">
                Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration"
                type="number"
                min={5}
                max={300}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity" className="text-xs font-semibold">
                Standard Capacity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={500}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-semibold">
              Initial Status
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ClassStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ClassStatus.ACTIVE}>Active (Ready to schedule)</SelectItem>
                <SelectItem value={ClassStatus.INACTIVE}>Inactive (Draft / Hidden)</SelectItem>
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={isSubmitting} className="bg-black hover:bg-gray-800 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Save Class"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
