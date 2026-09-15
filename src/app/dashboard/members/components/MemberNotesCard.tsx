"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createMemberNoteAction, updateMemberNoteAction, deleteMemberNoteAction } from "@/actions/member-notes.actions";
import { format } from "date-fns";
import { StickyNote, Plus, Trash2, Edit3, CheckCircle2, AlertCircle, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NoteItem {
  id: string;
  note: string;
  createdBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface MemberNotesCardProps {
  userId: string;
  memberName: string;
  initialNotes: NoteItem[];
}

export function MemberNotesCard({ userId, memberName, initialNotes }: MemberNotesCardProps) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("note", newNoteText);

    const res = await createMemberNoteAction(formData);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.note) {
      setNotes([res.note as any, ...notes]);
      setNewNoteText("");
      setIsAddOpen(false);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editNoteText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("note", editNoteText);

    const res = await updateMemberNoteAction(editingNote.id, formData);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.note) {
      setNotes(notes.map((n) => (n.id === editingNote.id ? (res.note as any) : n)));
      setEditingNote(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this internal note?")) return;

    const res = await deleteMemberNoteAction(noteId);
    if (!res.error) {
      setNotes(notes.filter((n) => n.id !== noteId));
    }
  };

  return (
    <Card className="border border-slate-200/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900">Internal Owner Notes</CardTitle>
            <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 gap-1 font-normal">
              <Lock className="w-2.5 h-2.5 text-slate-500" />
              Owner Only &middot; Never visible to member
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Private staff memos, follow-up reminders, workout preferences, and renewal notes.
          </CardDescription>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-[#1a9d5e] hover:bg-[#15804d] text-white">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <StickyNote className="h-5 w-5 text-emerald-600" />
                Add Internal Note
              </DialogTitle>
              <DialogDescription>
                Record a private internal note regarding {memberName}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateNote} className="space-y-4 pt-1">
              {error && (
                <div className="p-2.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Textarea
                required
                rows={4}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="e.g. Discussed renewal; requested focus on chest/triceps workout plan. Prefers 8:00 AM slots."
                className="text-xs resize-none"
              />

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#1a9d5e] hover:bg-[#15804d] text-white"
                >
                  {isSubmitting ? "Saving..." : "Save Internal Note"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {notes.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <StickyNote className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-800">No notes yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Add an internal note about this member to keep track of follow-ups, renewals, or preferences.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddOpen(true)}
              className="mt-2 text-xs"
            >
              Add First Note
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-normal flex-1">
                    {item.note}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNote(item);
                        setEditNoteText(item.note);
                      }}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(item.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 border-t border-slate-200/60 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(item.createdAt), "MMM d, yyyy, h:mm a")}
                  </span>
                  <span>&bull;</span>
                  <span>By: <span className="font-medium text-slate-600">{item.createdBy || "Owner"}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Note Modal */}
        <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Edit3 className="h-5 w-5 text-emerald-600" />
                Edit Internal Note
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateNote} className="space-y-4 pt-1">
              <Textarea
                required
                rows={4}
                value={editNoteText}
                onChange={(e) => setEditNoteText(e.target.value)}
                className="text-xs resize-none"
              />

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingNote(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#1a9d5e] hover:bg-[#15804d] text-white"
                >
                  {isSubmitting ? "Updating..." : "Update Note"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
