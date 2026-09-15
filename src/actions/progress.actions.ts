"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { GoalStatus, GoalType } from "@prisma/client";

/**
 * Create a new fitness goal for a member (OWNER only)
 */
export async function createGoalAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized." };
  }

  const userId = formData.get("userId") as string;
  const goalTypeStr = formData.get("goalType") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const targetValueStr = formData.get("targetValue") as string;
  const targetUnit = formData.get("targetUnit") as string;
  const startDateStr = formData.get("startDate") as string;
  const targetDateStr = formData.get("targetDate") as string;

  if (!userId || !title?.trim()) {
    return { error: "Member and goal title are required." };
  }

  const goalType = (goalTypeStr in GoalType ? goalTypeStr : "GENERAL_FITNESS") as GoalType;
  const targetValue = targetValueStr ? parseFloat(targetValueStr) : null;
  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  const targetDate = targetDateStr ? new Date(targetDateStr) : null;

  try {
    // Transition any existing ACTIVE goals for this user to COMPLETED to maintain single active goal
    await prisma.memberGoal.updateMany({
      where: {
        userId,
        status: GoalStatus.ACTIVE,
      },
      data: {
        status: GoalStatus.COMPLETED,
      },
    });

    const newGoal = await prisma.memberGoal.create({
      data: {
        userId,
        goalType,
        title: title.trim(),
        description: description?.trim() || null,
        targetValue: targetValue && !isNaN(targetValue) ? Number(targetValue.toFixed(2)) : null,
        targetUnit: targetUnit?.trim() || "kg",
        startDate,
        targetDate,
        status: GoalStatus.ACTIVE,
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "GOAL_CREATED",
          entity: "MEMBER_GOAL",
          entityId: newGoal.id,
        },
      });
    } catch (logErr) {
      console.warn("Could not write activity log:", logErr);
    }

    revalidatePath(`/dashboard/members/${userId}`);
    revalidatePath("/member/progress");
    revalidatePath("/member");

    return { success: true, goal: newGoal };
  } catch (error) {
    console.error("Failed to create goal:", error);
    return { error: "An unexpected error occurred while creating the goal." };
  }
}

/**
 * Update a goal status (e.g. mark COMPLETED or CANCELLED)
 */
export async function updateGoalStatusAction(goalId: string, status: GoalStatus) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized." };
  }

  const goal = await prisma.memberGoal.findUnique({ where: { id: goalId } });
  if (!goal) {
    return { error: "Goal not found." };
  }

  try {
    const res = await prisma.memberGoal.update({
      where: { id: goalId },
      data: { status },
    });

    try {
      await prisma.activityLog.create({
        data: {
          actorId: session.user.id,
          action: status === GoalStatus.COMPLETED ? "GOAL_COMPLETED" : "GOAL_STATUS_UPDATED",
          entity: "MEMBER_GOAL",
          entityId: goalId,
        },
      });
    } catch (logErr) {
      console.warn("Could not write activity log:", logErr);
    }

    revalidatePath(`/dashboard/members/${goal.userId}`);
    revalidatePath("/member/progress");
    revalidatePath("/member");

    return { success: true, goal: res };
  } catch (error) {
    console.error("Failed to update goal status:", error);
    return { error: "Failed to update goal status." };
  }
}

/**
 * Delete a goal (OWNER only)
 */
export async function deleteGoalAction(goalId: string) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized." };
  }

  const goal = await prisma.memberGoal.findUnique({ where: { id: goalId } });
  if (!goal) {
    return { error: "Goal not found." };
  }

  try {
    await prisma.memberGoal.delete({ where: { id: goalId } });

    try {
      await prisma.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "GOAL_DELETED",
          entity: "MEMBER_GOAL",
          entityId: goalId,
        },
      });
    } catch (logErr) {
      console.warn("Could not write activity log:", logErr);
    }

    revalidatePath(`/dashboard/members/${goal.userId}`);
    revalidatePath("/member/progress");
    revalidatePath("/member");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete goal:", error);
    return { error: "Failed to delete goal." };
  }
}
