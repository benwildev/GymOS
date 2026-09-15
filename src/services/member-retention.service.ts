import { prisma } from "@/lib/prisma";
import { MembershipStatus, Role } from "@prisma/client";
import { subDays, addDays, differenceInDays } from "date-fns";
import { getMemberFinancialSummary } from "./financial.service";

export interface RetentionSummary {
  inactiveMembersCount: number;
  expiringMembersCount: number;
  overduePaymentsCount: number;
  totalAlertsCount: number;
}

/**
 * Get aggregated counts for the 3 member retention categories
 */
export async function getRetentionAttentionSummary(): Promise<RetentionSummary> {
  const now = new Date();
  const fourteenDaysAgo = subDays(now, 14);
  const sevenDaysAhead = addDays(now, 7);

  // 1. Expiring memberships count
  const expiringMembersPromise = prisma.membership.count({
    where: {
      status: MembershipStatus.ACTIVE,
      endDate: {
        gte: now,
        lte: sevenDaysAhead,
      },
    },
  });

  // 2. Active members for checking inactivity and overdue balances
  const allMembersPromise = prisma.user.findMany({
    where: {
      role: Role.MEMBER,
      memberships: {
        some: { status: MembershipStatus.ACTIVE },
      },
    },
    select: {
      id: true,
      createdAt: true,
      attendances: {
        orderBy: { checkInAt: "desc" },
        take: 1,
        select: { checkInAt: true },
      },
      payments: {
        where: { status: "COMPLETED" },
        select: { amount: true },
      },
      memberships: {
        select: {
          plan: { select: { price: true } },
          startDate: true,
        },
      },
    },
  });

  const [expiringMembersCount, activeMembers] = await Promise.all([
    expiringMembersPromise,
    allMembersPromise,
  ]);

  let inactiveMembersCount = 0;
  let overduePaymentsCount = 0;

  for (const member of activeMembers) {
    // Check Inactive (14+ days without attendance)
    const latestAttendance = member.attendances[0]?.checkInAt;
    if (latestAttendance) {
      if (latestAttendance < fourteenDaysAgo) {
        inactiveMembersCount++;
      }
    } else if (member.createdAt < fourteenDaysAgo) {
      inactiveMembersCount++;
    }

    // Check Overdue Payments
    const totalBilled = member.memberships.reduce((sum, m) => sum + (m.plan?.price || 0), 0);
    const totalPaid = member.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = Math.max(0, totalBilled - totalPaid);
    if (totalDue > 0) {
      overduePaymentsCount++;
    }
  }

  const totalAlertsCount =
    inactiveMembersCount + expiringMembersCount + overduePaymentsCount;

  return {
    inactiveMembersCount,
    expiringMembersCount,
    overduePaymentsCount,
    totalAlertsCount,
  };
}

/**
 * Fetch detailed list of inactive members (14+ days without attendance)
 */
export async function getInactiveMembers(days = 14) {
  const threshold = subDays(new Date(), days);

  const members = await prisma.user.findMany({
    where: {
      role: Role.MEMBER,
      memberships: {
        some: { status: MembershipStatus.ACTIVE },
      },
    },
    include: {
      profile: true,
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        include: { plan: true },
        orderBy: { endDate: "desc" },
        take: 1,
      },
      attendances: {
        orderBy: { checkInAt: "desc" },
        take: 1,
      },
    },
  });

  const inactiveList = [];
  const now = new Date();

  for (const member of members) {
    const lastCheckIn = member.attendances[0]?.checkInAt;
    let isInactive = false;
    let daysInactive = 0;

    if (lastCheckIn) {
      if (lastCheckIn < threshold) {
        isInactive = true;
        daysInactive = differenceInDays(now, new Date(lastCheckIn));
      }
    } else if (member.createdAt < threshold) {
      isInactive = true;
      daysInactive = differenceInDays(now, new Date(member.createdAt));
    }

    if (isInactive) {
      inactiveList.push({
        id: member.id,
        name: member.name || "Member",
        email: member.email,
        memberId: member.profile?.memberId || "N/A",
        phone: member.profile?.phone || "—",
        lastAttendanceDate: lastCheckIn || null,
        daysInactive,
        activePlan: member.memberships[0]?.plan?.name || "Active Membership",
      });
    }
  }

  // Sort by most days inactive first
  return inactiveList.sort((a, b) => b.daysInactive - a.daysInactive);
}

/**
 * Fetch detailed list of members with memberships expiring within N days
 */
export async function getExpiringMembers(days = 7) {
  const now = new Date();
  const threshold = addDays(now, days);

  const memberships = await prisma.membership.findMany({
    where: {
      status: MembershipStatus.ACTIVE,
      endDate: {
        gte: now,
        lte: threshold,
      },
    },
    include: {
      user: {
        include: { profile: true },
      },
      plan: true,
    },
    orderBy: { endDate: "asc" },
  });

  return memberships.map((m) => {
    const daysRemaining = Math.max(0, differenceInDays(new Date(m.endDate), now));
    return {
      membershipId: m.id,
      userId: m.user.id,
      name: m.user.name || "Member",
      email: m.user.email,
      memberId: m.user.profile?.memberId || "N/A",
      phone: m.user.profile?.phone || "—",
      planName: m.plan.name,
      planPrice: m.plan.price,
      endDate: m.endDate,
      daysRemaining,
    };
  });
}

/**
 * Fetch detailed list of members with overdue payment balances
 */
export async function getOverdueMembers() {
  const members = await prisma.user.findMany({
    where: {
      role: Role.MEMBER,
    },
    include: {
      profile: true,
      memberships: {
        include: { plan: true },
      },
      payments: {
        where: { status: "COMPLETED" },
      },
    },
  });

  const overdueList = [];

  for (const member of members) {
    const totalBilled = member.memberships.reduce((sum, m) => sum + (m.plan?.price || 0), 0);
    const totalPaid = member.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = Math.max(0, totalBilled - totalPaid);

    if (totalDue > 0) {
      overdueList.push({
        userId: member.id,
        name: member.name || "Member",
        email: member.email,
        memberId: member.profile?.memberId || "N/A",
        phone: member.profile?.phone || "—",
        totalBilled,
        totalPaid,
        totalDue,
      });
    }
  }

  // Sort by highest overdue amount
  return overdueList.sort((a, b) => b.totalDue - a.totalDue);
}


