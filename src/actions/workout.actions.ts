"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { PlanStatus } from "@/types/enums";

export interface ExerciseItemInput {
  id?: string;
  day: string; // e.g. "MONDAY", "WEDNESDAY", "FRIDAY"
  exerciseName: string;
  sets: number;
  reps: string; // e.g. "10" or "8-12"
  weight?: number; // kg
  restSeconds?: number; // sec
  instructions?: string;
  order: number;
}

export interface CreateWorkoutPlanInput {
  userId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: PlanStatus;
  exercises?: ExerciseItemInput[];
}

export interface UpdateWorkoutPlanInput {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: PlanStatus;
  exercises?: ExerciseItemInput[];
}

// -------------------------------------------------------------
// 1. OWNER WORKOUT PLAN MANAGEMENT
// -------------------------------------------------------------

export async function getWorkoutPlans(search?: string, status?: string) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only gym owners can access all workout plans." };
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

    const plans = await prisma.workoutPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: { exercises: true },
        },
      },
    });

    return { success: true, plans };
  } catch (error: any) {
    console.error("Error fetching workout plans:", error);
    return { error: "Failed to load workout plans." };
  }
}

export async function createWorkoutPlan(input: CreateWorkoutPlanInput) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only gym owners can create workout plans." };
  }

  const { userId, name, description, startDate, endDate, status = PlanStatus.ACTIVE, exercises = [] } = input;

  if (!userId) {
    return { error: "Please select a member." };
  }

  if (!name || !name.trim()) {
    return { error: "Plan name is required." };
  }

  // Validate exercises
  for (const ex of exercises) {
    if (!ex.exerciseName || !ex.exerciseName.trim()) {
      return { error: "All exercises must have a valid name." };
    }
    if (Number(ex.sets) <= 0) {
      return { error: `Sets for "${ex.exerciseName}" must be greater than 0.` };
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
      // History preservation: If setting as ACTIVE, complete any existing ACTIVE plans for this member
      if (status === PlanStatus.ACTIVE) {
        await tx.workoutPlan.updateMany({
          where: {
            userId,
            status: PlanStatus.ACTIVE,
          },
          data: {
            status: PlanStatus.COMPLETED,
          },
        });
      }

      const created = await tx.workoutPlan.create({
        data: {
          userId,
          name: name.trim(),
          description: description?.trim() || null,
          startDate: planStartDate,
          endDate: planEndDate,
          status,
          exercises: {
            create: exercises.map((ex, idx) => ({
              day: (ex.day || "MONDAY").toUpperCase().trim(),
              exerciseName: ex.exerciseName.trim(),
              sets: Number(ex.sets) || 3,
              reps: String(ex.reps || "10").trim(),
              weight: Number(ex.weight) || 0,
              restSeconds: Number(ex.restSeconds) || 60,
              instructions: ex.instructions?.trim() || null,
              order: ex.order !== undefined ? Number(ex.order) : idx,
            })),
          },
        },
        include: {
          exercises: { orderBy: { order: "asc" } },
          user: { include: { profile: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "WORKOUT_PLAN_CREATED",
          entity: "WORKOUT_PLAN",
          entityId: created.id,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "WORKOUT_PLAN_ASSIGNED",
          entity: "USER",
          entityId: userId,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/workouts");
    revalidatePath("/dashboard");
    revalidatePath("/member/workout");
    revalidatePath("/member");

    return { success: true, plan: newPlan };
  } catch (error: any) {
    console.error("Error creating workout plan:", error);
    return { error: "Failed to create workout plan." };
  }
}

export async function updateWorkoutPlan(id: string, input: UpdateWorkoutPlanInput) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized." };
  }

  const { name, description, startDate, endDate, status, exercises = [] } = input;

  if (!name || !name.trim()) {
    return { error: "Plan name is required." };
  }

  // Validate exercises
  for (const ex of exercises) {
    if (!ex.exerciseName || !ex.exerciseName.trim()) {
      return { error: "All exercises must have a valid name." };
    }
    if (Number(ex.sets) <= 0) {
      return { error: `Sets for "${ex.exerciseName}" must be greater than 0.` };
    }
  }

  try {
    const existing = await prisma.workoutPlan.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Workout plan not found." };
    }

    const planStartDate = startDate ? new Date(startDate) : existing.startDate;
    const planEndDate = endDate ? new Date(endDate) : null;

    const updated = await prisma.$transaction(async (tx) => {
      // If switching to ACTIVE, complete other active plans for this member
      if (status === PlanStatus.ACTIVE && existing.status !== PlanStatus.ACTIVE) {
        await tx.workoutPlan.updateMany({
          where: {
            userId: existing.userId,
            status: PlanStatus.ACTIVE,
            NOT: { id },
          },
          data: { status: PlanStatus.COMPLETED },
        });
      }

      // Delete existing exercises and recreate atomically
      await tx.workoutExercise.deleteMany({ where: { workoutPlanId: id } });

      const planUpdated = await tx.workoutPlan.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          startDate: planStartDate,
          endDate: planEndDate,
          status,
          exercises: {
            create: exercises.map((ex, idx) => ({
              day: (ex.day || "MONDAY").toUpperCase().trim(),
              exerciseName: ex.exerciseName.trim(),
              sets: Number(ex.sets) || 3,
              reps: String(ex.reps || "10").trim(),
              weight: Number(ex.weight) || 0,
              restSeconds: Number(ex.restSeconds) || 60,
              instructions: ex.instructions?.trim() || null,
              order: ex.order !== undefined ? Number(ex.order) : idx,
            })),
          },
        },
        include: {
          exercises: { orderBy: { order: "asc" } },
          user: { include: { profile: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "WORKOUT_PLAN_UPDATED",
          entity: "WORKOUT_PLAN",
          entityId: id,
        },
      });

      return planUpdated;
    });

    revalidatePath("/dashboard/workouts");
    revalidatePath("/dashboard");
    revalidatePath("/member/workout");
    revalidatePath("/member");

    return { success: true, plan: updated };
  } catch (error: any) {
    console.error("Error updating workout plan:", error);
    return { error: "Failed to update workout plan." };
  }
}

export async function getWorkoutPlanDetails(planId: string) {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized." };
  }

  try {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id: planId },
      include: {
        user: { include: { profile: true } },
        exercises: { orderBy: [{ day: "asc" }, { order: "asc" }] },
      },
    });

    if (!plan) {
      return { error: "Workout plan not found." };
    }

    // Security: Members can only see their own plan
    if (session.user?.role !== Role.OWNER && plan.userId !== session.user?.id) {
      return { error: "Unauthorized access to workout plan." };
    }

    return { success: true, plan };
  } catch (error: any) {
    console.error("Error loading workout plan details:", error);
    return { error: "Failed to load workout plan details." };
  }
}

// -------------------------------------------------------------
// 2. MEMBER CURRENT WORKOUT PLAN
// -------------------------------------------------------------

export async function getMemberCurrentWorkoutPlan() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized." };
  }

  const userId = session.user.id;

  try {
    const plan = await prisma.workoutPlan.findFirst({
      where: {
        userId,
        status: PlanStatus.ACTIVE,
      },
      orderBy: { createdAt: "desc" },
      include: {
        exercises: {
          orderBy: { order: "asc" },
        },
      },
    });

    // Determine current day of week (e.g. MONDAY)
    const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const currentDayName = daysOfWeek[new Date().getDay()];

    if (!plan) {
      return {
        success: true,
        plan: null,
        currentDay: currentDayName,
        groupedExercises: {},
      };
    }

    // Group exercises by day
    const groupedExercises: Record<string, typeof plan.exercises> = {};
    for (const ex of plan.exercises) {
      const day = ex.day.toUpperCase();
      if (!groupedExercises[day]) {
        groupedExercises[day] = [];
      }
      groupedExercises[day].push(ex);
    }

    return {
      success: true,
      plan,
      currentDay: currentDayName,
      groupedExercises,
      todayExercises: groupedExercises[currentDayName] || [],
    };
  } catch (error: any) {
    console.error("Error fetching member workout plan:", error);
    return { error: "Failed to load workout plan." };
  }
}
