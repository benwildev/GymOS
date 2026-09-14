"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { updateClass } from "@/actions/class.actions";
import { ClassStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

interface EditClassDialogProps {
  gymClass: {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    capacity: number;
    status: ClassStatus;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditClassDialog({ gymClass, open, onOpenChange, onSuccess }: EditClassDialogProps) {
  const [name, setName] = useState(gymClass?.name || "");
  const [description, setDescription] = useState(gymClass?.description || "");
  const [duration, setDuration] = useState(String(gymClass?.duration || 60));
  const [capacity, setCapacity] = useState(String(gymClass?.capacity || 20));
  const [status, setStatus] = useState<ClassStatus>(gymClass?.status || ClassStatus.ACTIVE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleOpenChange = (v: boolean) => {
    if (v && gymClass) {
      setName(gymClass.name);
      setDescription(gymClass.description || "");
      setDuration(String(gymClass.duration));
      setCapacity(String(gymClass.capacity));
      setStatus(gymClass.status);
      setError(null);
    }
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymClass) return;
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
      const res = await updateClass(gymClass.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        duration: numDuration,
        capacity: numCapacity,
        status,
      });

      if (res.error) {
        setError(res.error);
      } else {
        onOpenChange(false);
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!gymClass) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Edit Class: {gymClass.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs font-semibold">
              Class Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description" className="text-xs font-semibold">
              Description
            </Label>
            <textarea
              id="edit-description"
              className="w-full min-h-[72px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-duration" className="text-xs font-semibold">
                Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-duration"
                type="number"
                min={5}
                max={300}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-capacity" className="text-xs font-semibold">
                Standard Capacity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-capacity"
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
            <Label htmlFor="edit-status" className="text-xs font-semibold">
              Status
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ClassStatus)}>
              <SelectTrigger id="edit-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ClassStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={ClassStatus.INACTIVE}>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-black hover:bg-gray-800 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
