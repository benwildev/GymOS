import { prisma } from "@/lib/prisma";
import { GoalStatus, GoalType } from "@prisma/client";

export interface MemberGoalSummary {
  activeGoal: any | null;
  totalGoalsCount: number;
}

/**
 * Retrieve active and historical goals summary for a member
 */
export async function getMemberProgress(userId: string): Promise<MemberGoalSummary> {
  const [activeGoal, totalGoalsCount] = await Promise.all([
    prisma.memberGoal.findFirst({
      where: {
        userId,
        status: GoalStatus.ACTIVE,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.memberGoal.count({
      where: { userId },
    }),
  ]);

  return {
    activeGoal,
    totalGoalsCount,
  };
}

/**
 * Retrieve active and historical goals for a member
 */
export async function getMemberGoals(userId: string) {
  return await prisma.memberGoal.findMany({
    where: { userId },
    orderBy: [
      { status: "asc" }, // ACTIVE appears before COMPLETED/CANCELLED
      { createdAt: "desc" },
    ],
  });
}

/**
 * Retrieve only the active fitness goal
 */
export async function getActiveGoal(userId: string) {
  return await prisma.memberGoal.findFirst({
    where: {
      userId,
      status: GoalStatus.ACTIVE,
    },
    orderBy: { createdAt: "desc" },
  });
}
