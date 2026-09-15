import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  subDays,
  addDays,
  format,
  getHours,
} from "date-fns";
import { BookingStatus, PaymentStatus, ScheduleStatus } from "@/types/enums";
import { getFinancialMetrics } from "./financial.service";
import { getRetentionAttentionSummary } from "./member-retention.service";

/**
 * Dashboard read-model.
 *
 * This module does NOT own business rules — overdue balances, retention
 * thresholds and financial totals all come from the existing services. It only
 * shapes those results (plus a few narrow aggregate queries) into the exact
 * payloads the owner dashboard renders.
 *
 * Every shared fetcher is wrapped in React `cache()` so that sibling dashboard
 * sections rendering in parallel share a single database round-trip per request.
 */

export const getGym = cache(async () =>
  prisma.gym.findFirst({
    select: { id: true, name: true, currency: true },
  })
);

export const getFinancialSnapshot = cache(getFinancialMetrics);

export const getRetentionSnapshot = cache(getRetentionAttentionSummary);

/* -------------------------------------------------------------------------- */
/* KPI row                                                                    */
/* -------------------------------------------------------------------------- */

export interface DashboardKpis {
  totalMembers: number;
  newMembersThisMonth: number;
  memberGrowthPct: number | null;
  activeMemberships: number;
  checkedInNow: number;
  checkInsToday: number;
  todayCollection: number;
  paymentsToday: number;
  overdueAmount: number;
  overdueMembers: number;
}

export const getDashboardKpis = cache(async (): Promise<DashboardKpis> => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  const [
    totalMembers,
    membersBeforeThisMonth,
    activeMemberships,
    checkedInNow,
    checkInsToday,
    paymentsToday,
    financial,
    retention,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { lt: monthStart } } }),
    prisma.membership.count({ where: { status: "ACTIVE" } }),
    prisma.attendance.count({
      where: { checkInAt: { gte: todayStart, lte: todayEnd }, checkOutAt: null },
    }),
    prisma.attendance.count({
      where: { checkInAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.payment.count({
      where: {
        status: PaymentStatus.COMPLETED,
        paymentDate: { gte: todayStart, lte: todayEnd },
      },
    }),
    getFinancialSnapshot(),
    getRetentionSnapshot(),
  ]);

  const newMembersThisMonth = Math.max(0, totalMembers - membersBeforeThisMonth);

  return {
    totalMembers,
    newMembersThisMonth,
    // Only a real prior-month baseline can produce a real percentage.
    memberGrowthPct:
      membersBeforeThisMonth > 0
        ? (newMembersThisMonth / membersBeforeThisMonth) * 100
        : null,
    activeMemberships,
    checkedInNow,
    checkInsToday,
    todayCollection: financial.todayCollection,
    paymentsToday,
    overdueAmount: financial.overdueAmount,
    overdueMembers: retention.overduePaymentsCount,
  };
});

/* -------------------------------------------------------------------------- */
/* Attendance trend                                                           */
/* -------------------------------------------------------------------------- */

export interface AttendancePoint {
  label: string;
  fullLabel: string;
  count: number;
}

export interface AttendanceSeries {
  today: AttendancePoint[];
  week: AttendancePoint[];
  month: AttendancePoint[];
  totals: { today: number; week: number; month: number };
  dailyAverage: { week: number; month: number };
  hasAnyData: boolean;
}

const MONTH_WINDOW_DAYS = 30;

/**
 * One query (30 days of check-in timestamps, timestamp column only) powers all
 * three ranges, so switching range on the client costs no further round-trips.
 */
export const getAttendanceSeries = cache(async (): Promise<AttendanceSeries> => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const windowStart = startOfDay(subDays(todayStart, MONTH_WINDOW_DAYS - 1));

  const rows = await prisma.attendance.findMany({
    where: { checkInAt: { gte: windowStart, lte: endOfDay(now) } },
    select: { checkInAt: true },
  });

  const checkIns = rows.map((r) => new Date(r.checkInAt));

  // Today — eight three-hour blocks, so no check-in falls outside the chart.
  const today: AttendancePoint[] = [];
  for (let block = 0; block < 8; block++) {
    const startHour = block * 3;
    const count = checkIns.filter(
      (d) =>
        d >= todayStart && getHours(d) >= startHour && getHours(d) < startHour + 3
    ).length;
    const blockStart = new Date(todayStart);
    blockStart.setHours(startHour, 0, 0, 0);
    const blockEnd = new Date(blockStart.getTime() + 3 * 60 * 60 * 1000 - 1);
    today.push({
      label: format(blockStart, "ha").toLowerCase(),
      fullLabel: format(blockStart, "h a") + " to " + format(blockEnd, "h a"),
      count,
    });
  }

  const dayBuckets: AttendancePoint[] = [];
  for (let i = MONTH_WINDOW_DAYS - 1; i >= 0; i--) {
    const day = subDays(todayStart, i);
    const dayEnd = endOfDay(day);
    const count = checkIns.filter((d) => d >= day && d <= dayEnd).length;
    dayBuckets.push({
      label: format(day, "d MMM"),
      fullLabel: format(day, "EEEE, d MMM"),
      count,
    });
  }

  const week = dayBuckets.slice(-7).map((point, index) => ({
    ...point,
    label: format(subDays(todayStart, 6 - index), "EEE"),
  }));

  const todayTotal = today.reduce((sum, p) => sum + p.count, 0);
  const weekTotal = week.reduce((sum, p) => sum + p.count, 0);
  const monthTotal = dayBuckets.reduce((sum, p) => sum + p.count, 0);

  return {
    today,
    week,
    month: dayBuckets,
    totals: { today: todayTotal, week: weekTotal, month: monthTotal },
    dailyAverage: {
      week: weekTotal / 7,
      month: monthTotal / MONTH_WINDOW_DAYS,
    },
    hasAnyData: checkIns.length > 0,
  };
});

/* -------------------------------------------------------------------------- */
/* Membership health                                                          */
/* -------------------------------------------------------------------------- */

export interface MembershipHealth {
  active: number;
  expiringSoon: number;
  expired: number;
  frozen: number;
  total: number;
}

export const getMembershipHealth = cache(async (): Promise<MembershipHealth> => {
  const todayStart = startOfDay(new Date());
  const sevenDaysAhead = addDays(todayStart, 7);

  const [active, expiringSoon, expired, frozen] = await Promise.all([
    prisma.membership.count({
      where: { status: "ACTIVE", endDate: { gt: sevenDaysAhead } },
    }),
    prisma.membership.count({
      where: {
        status: "ACTIVE",
        endDate: { gte: todayStart, lte: sevenDaysAhead },
      },
    }),
    prisma.membership.count({
      where: {
        OR: [
          { status: "INACTIVE" },
          { status: "CANCELLED" },
          { endDate: { lt: todayStart } },
        ],
      },
    }),
    prisma.membership.count({ where: { status: "FROZEN" } }),
  ]);

  return {
    active,
    expiringSoon,
    expired,
    frozen,
    total: active + expiringSoon + expired + frozen,
  };
});

/* -------------------------------------------------------------------------- */
/* Needs attention                                                            */
/* -------------------------------------------------------------------------- */

export interface AttentionSummary {
  expiringMemberships: number;
  overdueMembers: number;
  overdueAmount: number;
  inactiveMembers: number;
  nearlyFullClasses: number;
  totalAlerts: number;
}

const NEARLY_FULL_THRESHOLD = 0.8;

export const getAttentionSummary = cache(async (): Promise<AttentionSummary> => {
  const now = new Date();

  const [retention, financial, upcomingSchedules] = await Promise.all([
    getRetentionSnapshot(),
    getFinancialSnapshot(),
    prisma.classSchedule.findMany({
      where: {
        status: ScheduleStatus.ACTIVE,
        date: { gte: startOfDay(now), lte: endOfDay(addDays(now, 7)) },
      },
      select: {
        capacity: true,
        bookings: {
          where: { status: BookingStatus.BOOKED },
          select: { id: true },
        },
      },
    }),
  ]);

  const nearlyFullClasses = upcomingSchedules.filter(
    (s) => s.capacity > 0 && s.bookings.length / s.capacity >= NEARLY_FULL_THRESHOLD
  ).length;

  return {
    expiringMemberships: retention.expiringMembersCount,
    overdueMembers: retention.overduePaymentsCount,
    overdueAmount: financial.overdueAmount,
    inactiveMembers: retention.inactiveMembersCount,
    nearlyFullClasses,
    totalAlerts: retention.totalAlertsCount + nearlyFullClasses,
  };
});

/* -------------------------------------------------------------------------- */
/* Activity feed                                                              */
/* -------------------------------------------------------------------------- */

export type ActivityKind = "CHECK_IN" | "PAYMENT" | "MEMBER" | "CLASS";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  initials: string;
  at: Date;
  /** Present on PAYMENT items only. */
  amount?: number;
}

const FEED_SOURCE_LIMIT = 8;
const FEED_LIMIT = 8;

function initialsOf(name?: string | null) {
  if (!name) return "M";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * A single chronological stream assembled from records the app already writes:
 * check-ins, completed payments, member sign-ups and finished class sessions.
 */
export const getActivityFeed = cache(async (): Promise<ActivityItem[]> => {
  const now = new Date();
  const since = subDays(now, 14);

  const [checkIns, payments, newMembers, finishedClasses] = await Promise.all([
    prisma.attendance.findMany({
      where: { checkInAt: { gte: since } },
      orderBy: { checkInAt: "desc" },
      take: FEED_SOURCE_LIMIT,
      select: {
        id: true,
        checkInAt: true,
        user: { select: { name: true, profile: { select: { memberId: true } } } },
      },
    }),
    prisma.payment.findMany({
      where: { status: PaymentStatus.COMPLETED, paymentDate: { gte: since } },
      orderBy: { paymentDate: "desc" },
      take: FEED_SOURCE_LIMIT,
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        paymentMethod: true,
        user: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "MEMBER", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: FEED_SOURCE_LIMIT,
      select: {
        id: true,
        name: true,
        createdAt: true,
        profile: { select: { memberId: true } },
      },
    }),
    prisma.classSchedule.findMany({
      where: { status: ScheduleStatus.COMPLETED, date: { gte: since, lte: now } },
      orderBy: { date: "desc" },
      take: FEED_SOURCE_LIMIT,
      select: {
        id: true,
        date: true,
        endTime: true,
        class: { select: { name: true } },
        bookings: {
          where: { status: BookingStatus.ATTENDED },
          select: { id: true },
        },
      },
    }),
  ]);

  const items: ActivityItem[] = [
    ...checkIns.map((a) => ({
      id: "checkin-" + a.id,
      kind: "CHECK_IN" as const,
      title: (a.user?.name || "Member") + " checked in",
      detail: a.user?.profile?.memberId || "Member",
      initials: initialsOf(a.user?.name),
      at: new Date(a.checkInAt),
    })),
    ...payments.map((p) => ({
      id: "payment-" + p.id,
      kind: "PAYMENT" as const,
      title: (p.user?.name || "Member") + " made a payment",
      detail: p.paymentMethod,
      initials: initialsOf(p.user?.name),
      at: new Date(p.paymentDate),
      amount: p.amount,
    })),
    ...newMembers.map((m) => ({
      id: "member-" + m.id,
      kind: "MEMBER" as const,
      title: (m.name || "New member") + " joined",
      detail: m.profile?.memberId || "New member",
      initials: initialsOf(m.name),
      at: new Date(m.createdAt),
    })),
    ...finishedClasses.map((s) => ({
      id: "class-" + s.id,
      kind: "CLASS" as const,
      title: s.class.name + " class completed",
      detail:
        s.bookings.length + (s.bookings.length === 1 ? " attendee" : " attendees"),
      initials: initialsOf(s.class.name),
      at: new Date(s.date),
    })),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, FEED_LIMIT);
});

/* -------------------------------------------------------------------------- */
/* Today's classes                                                            */
/* -------------------------------------------------------------------------- */

export interface TodayClass {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  booked: number;
  capacity: number;
  cancelled: boolean;
}

export const getTodaysClasses = cache(async (): Promise<TodayClass[]> => {
  const now = new Date();

  const schedules = await prisma.classSchedule.findMany({
    where: { date: { gte: startOfDay(now), lte: endOfDay(now) } },
    orderBy: { startTime: "asc" },
    take: 5,
    select: {
      id: true,
      startTime: true,
      endTime: true,
      capacity: true,
      status: true,
      class: { select: { name: true } },
      bookings: { where: { status: BookingStatus.BOOKED }, select: { id: true } },
    },
  });

  return schedules.map((s) => ({
    id: s.id,
    name: s.class.name,
    startTime: s.startTime,
    endTime: s.endTime,
    booked: s.bookings.length,
    capacity: s.capacity,
    cancelled: s.status === ScheduleStatus.CANCELLED,
  }));
});

/* -------------------------------------------------------------------------- */
/* Recent members                                                             */
/* -------------------------------------------------------------------------- */

export interface RecentMember {
  id: string;
  name: string;
  memberId: string | null;
  plan: string | null;
  membershipStatus: string | null;
  lastVisit: Date | null;
}

export const getRecentMembers = cache(async (): Promise<RecentMember[]> => {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      profile: { select: { memberId: true } },
      // Nested `take: 1` keeps this to a single round-trip instead of N+1.
      memberships: {
        orderBy: { endDate: "desc" },
        take: 1,
        select: { status: true, plan: { select: { name: true } } },
      },
      attendances: {
        orderBy: { checkInAt: "desc" },
        take: 1,
        select: { checkInAt: true },
      },
    },
  });

  return members.map((m) => ({
    id: m.id,
    name: m.name || "Member",
    memberId: m.profile?.memberId ?? null,
    plan: m.memberships[0]?.plan?.name ?? null,
    membershipStatus: m.memberships[0]?.status ?? null,
    lastVisit: m.attendances[0]?.checkInAt ?? null,
  }));
});

/* -------------------------------------------------------------------------- */
/* Recent payments                                                            */
/* -------------------------------------------------------------------------- */

export interface RecentPayment {
  id: string;
  memberName: string;
  plan: string | null;
  amount: number;
  paidAt: Date;
}

export const getRecentPayments = cache(async (): Promise<RecentPayment[]> => {
  const payments = await prisma.payment.findMany({
    where: { status: PaymentStatus.COMPLETED },
    orderBy: { paymentDate: "desc" },
    take: 5,
    select: {
      id: true,
      amount: true,
      paymentDate: true,
      paymentMethod: true,
      user: { select: { name: true } },
      membership: { select: { plan: { select: { name: true } } } },
    },
  });

  return payments.map((p) => ({
    id: p.id,
    memberName: p.user?.name || "Member",
    plan: p.membership?.plan?.name ?? p.paymentMethod,
    amount: p.amount,
    paidAt: new Date(p.paymentDate),
  }));
});
