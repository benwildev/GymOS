"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Perform a highly optimized, fast search across member name, email, phone, and memberId.
 * Returns member details along with their *current* membership status.
 */
export async function searchMembersForCheckIn(query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        {
          profile: {
            OR: [
              { phone: { contains: query, mode: "insensitive" } },
              { memberId: { contains: query, mode: "insensitive" } },
            ],
          },
        },
      ],
    },
    include: {
      profile: true,
      memberships: {
        where: {
          status: "ACTIVE",
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        include: {
          plan: true,
        },
      },
      attendances: {
        where: {
          checkInAt: {
            // Get all check-ins from the start of today
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        orderBy: {
          checkInAt: 'desc'
        }
      }
    },
    take: 10,
  });

  return users.map(user => {
    const activeMembership = user.memberships.length > 0 ? user.memberships[0] : null;
    const activeCheckIn = user.attendances.find(a => a.checkOutAt === null);
    const todaysVisitsCount = user.attendances.length;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      memberId: user.profile?.memberId,
      phone: user.profile?.phone,
      hasActiveMembership: !!activeMembership,
      activeMembershipPlan: activeMembership?.plan.name,
      membershipEndDate: activeMembership?.endDate,
      isCheckedIn: !!activeCheckIn,
      activeCheckInId: activeCheckIn?.id,
      checkInAt: activeCheckIn?.checkInAt,
      todaysVisitsCount,
    };
  });
}

/**
 * Check in a member
 */
export async function checkInMember(userId: string) {
  // 1. Verify active membership
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: {
          status: "ACTIVE",
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        }
      },
      attendances: {
        where: {
          checkOutAt: null,
        }
      }
    }
  });

  if (!user) {
    return { success: false, error: "Member not found" };
  }

  if (user.memberships.length === 0) {
    return { success: false, error: "Member does not have an active membership" };
  }

  if (user.attendances.length > 0) {
    return { success: false, error: "Member is already checked in" };
  }

  // Create attendance record
  await prisma.attendance.create({
    data: {
      userId,
      method: "MANUAL",
    }
  });

  // Log action
  await prisma.activityLog.create({
    data: {
      actorId: user.id, // Or the admin checking them in
      action: "CHECK_IN",
      entity: "ATTENDANCE",
      entityId: userId,
    }
  });

  revalidatePath("/dashboard/attendance");
  return { success: true };
}

/**
 * Check out a member
 */
export async function checkOutMember(attendanceId: string) {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });

  if (!attendance) {
    return { success: false, error: "Attendance record not found" };
  }

  if (attendance.checkOutAt) {
    return { success: false, error: "Member is already checked out" };
  }

  await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      checkOutAt: new Date(),
    }
  });

  // Log action
  await prisma.activityLog.create({
    data: {
      actorId: attendance.userId,
      action: "CHECK_OUT",
      entity: "ATTENDANCE",
      entityId: attendanceId,
    }
  });

  revalidatePath("/dashboard/attendance");
  return { success: true };
}

/**
 * Get members currently checked in
 */
export async function getCurrentlyCheckedInMembers() {
  const attendances = await prisma.attendance.findMany({
    where: {
      checkOutAt: null,
    },
    include: {
      user: {
        include: {
          profile: true,
        }
      }
    },
    orderBy: {
      checkInAt: 'desc'
    }
  });

  return attendances;
}

/**
 * Get recent check-outs
 */
export async function getRecentCheckOuts(limit: number = 10) {
  const attendances = await prisma.attendance.findMany({
    where: {
      checkOutAt: { not: null },
    },
    include: {
      user: {
        include: {
          profile: true,
        }
      }
    },
    orderBy: {
      checkOutAt: 'desc'
    },
    take: limit,
  });

  return attendances;
}

/**
 * Get attendance history for a specific member
 */
export async function getMemberAttendanceHistory(userId: string) {
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
    },
    orderBy: {
      checkInAt: 'desc'
    }
  });

  return attendances;
}
