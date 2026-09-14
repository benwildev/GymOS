"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { PlanStatus } from "@/types/enums";

export interface MealItemInput {
  id?: string;
  mealTime: string; // e.g. "08:00 AM"
  mealName: string; // e.g. "Breakfast"
  food: string; // e.g. "Oats + 2 Boiled Eggs + 1 Banana"
  instructions?: string;
  order: number;
}

export interface CreateDietPlanInput {
  userId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: PlanStatus;
  meals?: MealItemInput[];
}

export interface UpdateDietPlanInput {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: PlanStatus;
  meals?: MealItemInput[];
}

// -------------------------------------------------------------
// 1. OWNER DIET PLAN MANAGEMENT
// -------------------------------------------------------------

export async function getDietPlans(search?: string, status?: string) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only gym owners can access all diet plans." };
  }

  try {
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        {
          user: {
            OR: [
              { name: { contains: search.trim(), mode: "insensitive" } },
              { email: { contains: search.trim(), mode: "insensitive" } },
              { profile: { memberId: { contains: search.trim(), mode: "insensitive" } } },
            ],
          },
        },
      ];
    }

    const plans = await prisma.dietPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: { meals: true },
        },
      },
    });

    return { success: true, plans };
  } catch (error: any) {
    console.error("Error fetching diet plans:", error);
    return { error: "Failed to load diet plans." };
  }
}

export async function createDietPlan(input: CreateDietPlanInput) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only gym owners can create diet plans." };
  }

  const { userId, name, description, startDate, endDate, status = PlanStatus.ACTIVE, meals = [] } = input;

  if (!userId) {
    return { error: "Please select a member." };
  }

  if (!name || !name.trim()) {
    return { error: "Plan name is required." };
  }

  // Validate meals
  for (const meal of meals) {
    if (!meal.mealName || !meal.mealName.trim()) {
      return { error: "All meals must have a valid meal name (e.g. Breakfast)." };
    }
    if (!meal.food || !meal.food.trim()) {
      return { error: `Food items for "${meal.mealName}" are required.` };
    }
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!targetUser || targetUser.role !== Role.MEMBER) {
      return { error: "Selected member not found." };
    }

    const planStartDate = startDate ? new Date(startDate) : new Date();
    const planEndDate = endDate ? new Date(endDate) : null;

    const newPlan = await prisma.$transaction(async (tx) => {
      // History preservation: complete existing ACTIVE plans for this member
      if (status === PlanStatus.ACTIVE) {
        await tx.dietPlan.updateMany({
          where: {
            userId,
            status: PlanStatus.ACTIVE,
          },
          data: {
            status: PlanStatus.COMPLETED,
          },
        });
      }

      const created = await tx.dietPlan.create({
        data: {
          userId,
          name: name.trim(),
          description: description?.trim() || null,
          startDate: planStartDate,
          endDate: planEndDate,
          status,
          meals: {
            create: meals.map((m, idx) => ({
              mealTime: (m.mealTime || "08:00 AM").trim(),
              mealName: m.mealName.trim(),
              food: m.food.trim(),
              instructions: m.instructions?.trim() || null,
              order: m.order !== undefined ? Number(m.order) : idx,
            })),
          },
        },
        include: {
          meals: { orderBy: { order: "asc" } },
          user: { include: { profile: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "DIET_PLAN_CREATED",
          entity: "DIET_PLAN",
          entityId: created.id,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "DIET_PLAN_ASSIGNED",
          entity: "USER",
          entityId: userId,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/diets");
    revalidatePath("/dashboard");
    revalidatePath("/member/diet");
    revalidatePath("/member");

    return { success: true, plan: newPlan };
  } catch (error: any) {
    console.error("Error creating diet plan:", error);
    return { error: "Failed to create diet plan." };
  }
}

export async function updateDietPlan(id: string, input: UpdateDietPlanInput) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized." };
  }

  const { name, description, startDate, endDate, status, meals = [] } = input;

  if (!name || !name.trim()) {
    return { error: "Plan name is required." };
  }

  // Validate meals
  for (const meal of meals) {
    if (!meal.mealName || !meal.mealName.trim()) {
      return { error: "All meals must have a valid meal name (e.g. Breakfast)." };
    }
    if (!meal.food || !meal.food.trim()) {
      return { error: `Food items for "${meal.mealName}" are required.` };
    }
  }

  try {
    const existing = await prisma.dietPlan.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Diet plan not found." };
    }

    const planStartDate = startDate ? new Date(startDate) : existing.startDate;
    const planEndDate = endDate ? new Date(endDate) : null;

    const updated = await prisma.$transaction(async (tx) => {
      // If switching to ACTIVE, complete other active plans for this member
      if (status === PlanStatus.ACTIVE && existing.status !== PlanStatus.ACTIVE) {
        await tx.dietPlan.updateMany({
          where: {
            userId: existing.userId,
            status: PlanStatus.ACTIVE,
            NOT: { id },
          },
          data: { status: PlanStatus.COMPLETED },
        });
      }

      // Delete existing meals and recreate atomically
      await tx.dietMeal.deleteMany({ where: { dietPlanId: id } });

      const planUpdated = await tx.dietPlan.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          startDate: planStartDate,
          endDate: planEndDate,
          status,
          meals: {
            create: meals.map((m, idx) => ({
              mealTime: (m.mealTime || "08:00 AM").trim(),
              mealName: m.mealName.trim(),
              food: m.food.trim(),
              instructions: m.instructions?.trim() || null,
              order: m.order !== undefined ? Number(m.order) : idx,
            })),
          },
        },
        include: {
          meals: { orderBy: { order: "asc" } },
          user: { include: { profile: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "DIET_PLAN_UPDATED",
          entity: "DIET_PLAN",
          entityId: id,
        },
      });

      return planUpdated;
    });

    revalidatePath("/dashboard/diets");
    revalidatePath("/dashboard");
    revalidatePath("/member/diet");
    revalidatePath("/member");

    return { success: true, plan: updated };
  } catch (error: any) {
    console.error("Error updating diet plan:", error);
    return { error: "Failed to update diet plan." };
  }
}

export async function getDietPlanDetails(planId: string) {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized." };
  }

  try {
    const plan = await prisma.dietPlan.findUnique({
      where: { id: planId },
      include: {
        user: { include: { profile: true } },
        meals: { orderBy: { order: "asc" } },
      },
    });

    if (!plan) {
      return { error: "Diet plan not found." };
    }

    // Security: Members can only see their own plan
    if (session.user?.role !== Role.OWNER && plan.userId !== session.user?.id) {
      return { error: "Unauthorized access to diet plan." };
    }

    return { success: true, plan };
  } catch (error: any) {
    console.error("Error loading diet plan details:", error);
    return { error: "Failed to load diet plan details." };
  }
}

// -------------------------------------------------------------
// 2. MEMBER CURRENT DIET PLAN
// -------------------------------------------------------------

export async function getMemberCurrentDietPlan() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized." };
  }

  const userId = session.user.id;

  try {
    const plan = await prisma.dietPlan.findFirst({
      where: {
        userId,
        status: PlanStatus.ACTIVE,
      },
      orderBy: { createdAt: "desc" },
      include: {
        meals: {
          orderBy: { order: "asc" },
        },
      },
    });

    return {
      success: true,
      plan,
      meals: plan?.meals || [],
    };
  } catch (error: any) {
    console.error("Error fetching member diet plan:", error);
    return { error: "Failed to load diet plan." };
  }
}
