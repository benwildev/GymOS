import { prisma } from "@/lib/prisma";
import { PaymentStatus, Status } from "@/types/enums";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, isBefore } from "date-fns";

import { roundCurrency, formatCurrency } from "@/lib/utils";
export { roundCurrency, formatCurrency };


/**
 * Atomic generation of sequential receipt number (e.g. REC-000001)
 */
export async function generateReceiptNumber(tx?: any): Promise<string> {
  const db = tx || prisma;
  const count = await db.payment.count();
  const nextNum = count + 1;
  let candidate = `REC-${nextNum.toString().padStart(6, "0")}`;

  // Ensure collision safety
  let exists = await db.payment.findFirst({
    where: { receiptNumber: candidate },
  });

  let counter = nextNum;
  while (exists) {
    counter++;
    candidate = `REC-${counter.toString().padStart(6, "0")}`;
    exists = await db.payment.findFirst({
      where: { receiptNumber: candidate },
    });
  }

  return candidate;
}

/**
 * Calculate financial balance for a specific member
 */
export async function getMemberFinancialSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      memberships: {
        include: {
          plan: true,
        },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Calculate total charges from all active/historical memberships
  const totalCharges = roundCurrency(
    user.memberships.reduce((sum, m) => sum + (m.plan?.price || 0), 0)
  );

  // Calculate total completed payments
  const completedPayments = user.payments.filter(
    (p) => p.status === PaymentStatus.COMPLETED
  );

  const totalPaid = roundCurrency(
    completedPayments.reduce((sum, p) => sum + p.amount, 0)
  );

  const totalDue = roundCurrency(Math.max(0, totalCharges - totalPaid));

  let status: "PAID" | "PARTIALLY_PAID" | "DUE" | "OVERDUE" = "PAID";
  if (totalDue > 0) {
    // Check if any membership has passed its start date / due date
    const now = new Date();
    const hasPastDue = user.memberships.some(
      (m) => isBefore(new Date(m.startDate), now)
    );

    if (totalPaid > 0) {
      status = hasPastDue ? "OVERDUE" : "PARTIALLY_PAID";
    } else {
      status = hasPastDue ? "OVERDUE" : "DUE";
    }
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    memberId: user.profile?.memberId,
    phone: user.profile?.phone,
    totalCharges,
    totalPaid,
    totalDue,
    status,
    memberships: user.memberships,
    payments: user.payments,
  };
}

/**
 * Get top-level dashboard financial metrics for Owner
 */
export async function getFinancialMetrics() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // 1. Today's collection (completed payments today)
  const todayPayments = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.COMPLETED,
      paymentDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    _sum: { amount: true },
  });
  const todayCollection = roundCurrency(todayPayments._sum.amount || 0);

  // 2. This month's collection / revenue
  const monthPayments = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.COMPLETED,
      paymentDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    _sum: { amount: true },
  });
  const monthRevenue = roundCurrency(monthPayments._sum.amount || 0);

  // 3. This month's expenses
  const monthExpenses = await prisma.expense.aggregate({
    where: {
      status: Status.ACTIVE,
      expenseDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    _sum: { amount: true },
  });
  const totalMonthExpenses = roundCurrency(monthExpenses._sum.amount || 0);

  // 4. Net operational amount for this month
  const netOperational = roundCurrency(monthRevenue - totalMonthExpenses);

  // 5. Calculate outstanding dues across all members
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    include: {
      memberships: {
        include: { plan: true },
      },
      payments: {
        where: { status: PaymentStatus.COMPLETED },
      },
    },
  });

  let totalOutstandingDue = 0;
  let totalOverdue = 0;

  for (const m of members) {
    const memberCharge = m.memberships.reduce((sum, mem) => sum + (mem.plan?.price || 0), 0);
    const memberPaid = m.payments.reduce((sum, p) => sum + p.amount, 0);
    const due = Math.max(0, memberCharge - memberPaid);

    if (due > 0) {
      totalOutstandingDue += due;
      const isOverdue = m.memberships.some((mem) => isBefore(new Date(mem.startDate), now));
      if (isOverdue) {
        totalOverdue += due;
      }
    }
  }

  return {
    todayCollection,
    monthRevenue,
    outstandingDue: roundCurrency(totalOutstandingDue),
    overdueAmount: roundCurrency(totalOverdue),
    monthExpenses: totalMonthExpenses,
    netOperational,
  };
}

/**
 * Get all members with outstanding dues or overdue amounts
 */
export async function getDueAndOverdueMembers(searchQuery?: string, filterStatus?: string) {
  const now = new Date();

  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      ...(searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { email: { contains: searchQuery, mode: "insensitive" } },
              {
                profile: {
                  OR: [
                    { phone: { contains: searchQuery, mode: "insensitive" } },
                    { memberId: { contains: searchQuery, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    },
    include: {
      profile: true,
      memberships: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        where: { status: PaymentStatus.COMPLETED },
      },
    },
  });

  const dueList = [];

  for (const member of members) {
    const totalCharge = roundCurrency(
      member.memberships.reduce((sum, m) => sum + (m.plan?.price || 0), 0)
    );
    const totalPaid = roundCurrency(
      member.payments.reduce((sum, p) => sum + p.amount, 0)
    );
    const due = roundCurrency(Math.max(0, totalCharge - totalPaid));

    if (due > 0) {
      const activeMembership = member.memberships[0];
      const dueDate = activeMembership?.startDate || new Date();
      const isOverdue = isBefore(new Date(dueDate), now);

      let status: "DUE" | "PARTIALLY_PAID" | "OVERDUE" = "DUE";
      if (isOverdue) {
        status = "OVERDUE";
      } else if (totalPaid > 0) {
        status = "PARTIALLY_PAID";
      }

      if (!filterStatus || filterStatus === "ALL" || filterStatus === status) {
        dueList.push({
          userId: member.id,
          name: member.name,
          email: member.email,
          phone: member.profile?.phone,
          memberId: member.profile?.memberId,
          activePlan: activeMembership?.plan?.name || "N/A",
          activeMembershipId: activeMembership?.id || null,
          totalCharge,
          totalPaid,
          due,
          dueDate,
          status,
        });
      }
    }
  }

  return dueList.sort((a, b) => b.due - a.due);
}
