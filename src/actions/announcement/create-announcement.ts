"use server";

import { createAnnouncement } from "@/services/notification.service";
import { AnnouncementAudience } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createAnnouncementAction(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const audience = formData.get("audience") as AnnouncementAudience;
  const expiresInDays = formData.get("expiresInDays") ? parseInt(formData.get("expiresInDays") as string) : undefined;

  if (!title || !content || !audience) {
    throw new Error("Missing required fields");
  }

  await createAnnouncement(title, content, audience, expiresInDays);
  
  revalidatePath("/dashboard/announcements");
  revalidatePath("/member");
}
