"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateGymSettings(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const country = formData.get("country") as string;
  const currency = formData.get("currency") as string;

  if (!name) {
    return { error: "Gym name is required" };
  }

  try {
    const gym = await prisma.gym.findFirst();
    if (!gym) {
      return { error: "Gym not found" };
    }

    await prisma.gym.update({
      where: { id: gym.id },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        country: country || null,
        currency: currency || "USD",
      }
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/member", "layout");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update gym:", error);
    return { error: "An unexpected error occurred while updating the gym settings." };
  }
}
