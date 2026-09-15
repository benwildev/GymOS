"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Create an internal note for a member (strictly OWNER-only)
 */
export async function createMemberNoteAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized. Internal notes are restricted to gym owners." };
  }

  const userId = formData.get("userId") as string;
  const note = formData.get("note") as string;

  if (!userId || !note?.trim()) {
    return { error: "Member ID and note content are required." };
  }

  try {
    const created = await prisma.memberNote.create({
      data: {
        userId,
        note: note.trim(),
        createdBy: session.user.name || "Owner",
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "MEMBER_NOTE_CREATED",
          entity: "MEMBER_NOTE",
          entityId: created.id,
        },
      });
    } catch (logErr) {
      console.warn("Could not write activity log:", logErr);
    }

    revalidatePath(`/dashboard/members/${userId}`);
    revalidatePath("/dashboard/members/attention");
    return { success: true, note: created };
  } catch (error) {
    console.error("Failed to create member note:", error);
    return { error: "An unexpected error occurred while saving the note." };
  }
}

/**
 * Update an existing internal note (strictly OWNER-only)
 */
export async function updateMemberNoteAction(noteId: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized." };
  }

  const note = formData.get("note") as string;
  if (!note?.trim()) {
    return { error: "Note content cannot be empty." };
  }

  const existing = await prisma.memberNote.findUnique({ where: { id: noteId } });
  if (!existing) {
    return { error: "Note not found." };
  }

  try {
    const record = await prisma.memberNote.update({
      where: { id: noteId },
      data: {
        note: note.trim(),
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "MEMBER_NOTE_UPDATED",
          entity: "MEMBER_NOTE",
          entityId: noteId,
        },
      });
    } catch (logErr) {
      console.warn("Could not write activity log:", logErr);
    }

    revalidatePath(`/dashboard/members/${existing.userId}`);
    return { success: true, note: record };
  } catch (error) {
    console.error("Failed to update note:", error);
    return { error: "Failed to update note." };
  }
}

/**
 * Delete an internal note (strictly OWNER-only)
 */
export async function deleteMemberNoteAction(noteId: string) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized." };
  }

  const existing = await prisma.memberNote.findUnique({ where: { id: noteId } });
  if (!existing) {
    return { error: "Note not found." };
  }

  try {
    await prisma.memberNote.delete({ where: { id: noteId } });

    try {
      await prisma.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "MEMBER_NOTE_DELETED",
          entity: "MEMBER_NOTE",
          entityId: noteId,
        },
      });
    } catch (logErr) {
      console.warn("Could not write activity log:", logErr);
    }

    revalidatePath(`/dashboard/members/${existing.userId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete note:", error);
    return { error: "Failed to delete note." };
  }
}
