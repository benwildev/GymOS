"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMembershipPlans() {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return { plans };
  } catch (error) {
    console.error("Failed to fetch membership plans:", error);
    return { error: "An unexpected error occurred while fetching plans." };
  }
}

export async function getActiveMembershipPlans() {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
    return { plans };
  } catch (error) {
    console.error("Failed to fetch active membership plans:", error);
    return { error: "An unexpected error occurred while fetching active plans." };
  }
}

export async function createMembershipPlan(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const duration = parseInt(formData.get("duration") as string, 10);
  const isActive = formData.get("isActive") === "true";

  if (!name || isNaN(price) || isNaN(duration)) {
    return { error: "Name, price, and duration are required and must be valid." };
  }

  try {
    await prisma.membershipPlan.create({
      data: {
        name,
        description: description || null,
        price,
        duration,
        isActive,
      }
    });

    revalidatePath("/dashboard/memberships");
    return { success: true };
  } catch (error) {
    console.error("Failed to create membership plan:", error);
    return { error: "An unexpected error occurred while creating the plan." };
  }
}

export async function updateMembershipPlan(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const duration = parseInt(formData.get("duration") as string, 10);
  const isActive = formData.get("isActive") === "true";

  if (!name || isNaN(price) || isNaN(duration)) {
    return { error: "Name, price, and duration are required and must be valid." };
  }

  try {
    await prisma.membershipPlan.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price,
        duration,
        isActive,
      }
    });

    revalidatePath("/dashboard/memberships");
    return { success: true };
  } catch (error) {
    console.error("Failed to update membership plan:", error);
    return { error: "An unexpected error occurred while updating the plan." };
  }
}
