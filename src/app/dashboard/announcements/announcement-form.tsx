"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAnnouncementAction } from "@/actions/announcement/create-announcement";
import { Loader2 } from "lucide-react";

export function AnnouncementForm() {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<string>("ALL");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please provide both a title and message content.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("audience", audience);
        if (expiresInDays) {
          formData.append("expiresInDays", expiresInDays);
        }

        await createAnnouncementAction(formData);
        setTitle("");
        setContent("");
        setAudience("ALL");
        setExpiresInDays("7");
      } catch (err: any) {
        setError(err.message || "Failed to create announcement.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="announcement-title" className="text-xs font-semibold">
          Title
        </Label>
        <Input
          id="announcement-title"
          placeholder="E.g., Holiday Hours, Weekend Workshop"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="announcement-content" className="text-xs font-semibold">
          Message Content
        </Label>
        <Textarea
          id="announcement-content"
          placeholder="Type your announcement details here..."
          className="min-h-[100px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Target Audience</Label>
          <Select value={audience} onValueChange={(val) => val && setAudience(val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Everyone</SelectItem>
              <SelectItem value="ACTIVE_MEMBERS">Active Members Only</SelectItem>
              <SelectItem value="INACTIVE_MEMBERS">Inactive Members Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="announcement-expiry" className="text-xs font-semibold">
            Expires In (Days)
          </Label>
          <Input
            id="announcement-expiry"
            type="number"
            min="1"
            max="365"
            placeholder="Optional (e.g. 7)"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">Leave blank for no automatic expiration</p>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#1a9d5e] hover:bg-[#15824e] text-white"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publishing Announcement...
          </>
        ) : (
          "Publish Announcement"
        )}
      </Button>
    </form>
  );
}
