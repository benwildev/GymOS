import { prisma } from "@/lib/prisma";
import { PaymentStatus, Status } from "@/types/enums";
import { formatCurrency, roundCurrency } from "./financial.service";

/**
 * Get membership growth and distribution
 */
export async function getMembershipReport() {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    include: {
      memberships: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const totalMembers = members.length;
  let activeMembers = 0;
  let inactiveMembers = 0;
  
  // Plan distribution
  const planDistribution: Record<string, number> = {};

  for (const member of members) {
    const latestMembership = member.memberships[0];
    const status = latestMembership?.status || "INACTIVE";
    
    if (status === "ACTIVE") activeMembers++;
    else inactiveMembers++;

    if (latestMembership?.plan?.name) {
      const planName = latestMembership.plan.name;
      planDistribution[planName] = (planDistribution[planName] || 0) + 1;
    }
  }

  // Format plan distribution for charts
  const planChartData = Object.keys(planDistribution).map((name) => ({
    name,
    value: planDistribution[name],
  }));

  return {
    totalMembers,
    activeMembers,
    inactiveMembers,
    planDistribution: planChartData,
  };
}

/**
 * Get attendance overview for a date range
 */
export async function getAttendanceReport(startDate: Date, endDate: Date) {
  const attendances = await prisma.attendance.findMany({
    where: {
      checkInAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: true,
    },
    orderBy: {
      checkInAt: "asc",
    },
  });

  // Group by day (YYYY-MM-DD)
  const dailyAttendance: Record<string, number> = {};
  
  for (const att of attendances) {
    const day = att.checkInAt.toISOString().split("T")[0];
    dailyAttendance[day] = (dailyAttendance[day] || 0) + 1;
  }

  const dailyChartData = Object.keys(dailyAttendance).map((date) => ({
    date,
    count: dailyAttendance[date],
  }));

  return {
    totalCheckIns: attendances.length,
    dailyChartData,
  };
}

/**
 * Get comprehensive financial report for a date range
 */
export async function getFinancialReport(startDate: Date, endDate: Date, currency: string = "USD") {
  // Revenue
  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.COMPLETED,
      paymentDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { paymentDate: "asc" },
  });

  // Expenses
  const expenses = await prisma.expense.findMany({
    where: {
      status: Status.ACTIVE,
      expenseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { expenseDate: "asc" },
  });

  const totalRevenue = roundCurrency(payments.reduce((sum, p) => sum + p.amount, 0));
  const totalExpenses = roundCurrency(expenses.reduce((sum, e) => sum + e.amount, 0));
  const netProfit = roundCurrency(totalRevenue - totalExpenses);

  // Group by day for timeline
  const dailyData: Record<string, { revenue: number; expense: number }> = {};
  
  for (const p of payments) {
    const day = p.paymentDate.toISOString().split("T")[0];
    if (!dailyData[day]) dailyData[day] = { revenue: 0, expense: 0 };
    dailyData[day].revenue += p.amount;
  }

  for (const e of expenses) {
    const day = e.expenseDate.toISOString().split("T")[0];
    if (!dailyData[day]) dailyData[day] = { revenue: 0, expense: 0 };
    dailyData[day].expense += e.amount;
  }

  const timelineData = Object.keys(dailyData).sort().map((date) => ({
    date,
    revenue: roundCurrency(dailyData[date].revenue),
    expense: roundCurrency(dailyData[date].expense),
    profit: roundCurrency(dailyData[date].revenue - dailyData[date].expense),
  }));

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    totalRevenueFormatted: formatCurrency(totalRevenue, currency),
    totalExpensesFormatted: formatCurrency(totalExpenses, currency),
    netProfitFormatted: formatCurrency(netProfit, currency),
    timelineData,
  };
}
