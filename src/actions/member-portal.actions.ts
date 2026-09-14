"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateMemberProfile(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  // Get user role, only Members can use this for themselves, OR Owners maybe. 
  // Let's just restrict it to the logged in user.
  const userId = session.user.id;

  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const gender = formData.get("gender") as string;
  const dob = formData.get("dob") as string;
  
  const emergencyContactName = formData.get("emergencyContactName") as string;
  const emergencyContactPhone = formData.get("emergencyContactPhone") as string;
  const emergencyContactRel = formData.get("emergencyContactRel") as string;

  try {
    await prisma.memberProfile.update({
      where: {
        userId,
      },
      data: {
        phone: phone || null,
        address: address || null,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        emergencyContactRel: emergencyContactRel || null,
      }
    });

    revalidatePath("/member/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}
