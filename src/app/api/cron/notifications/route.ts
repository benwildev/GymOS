import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, addDays, subDays } from "date-fns";

export async function GET(req: Request) {
  try {
    // Basic security: check for Vercel Cron authorization if running in production
    const authHeader = req.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const todayStart = startOfDay(new Date());
    const inThreeDays = addDays(todayStart, 3);
    const threeDaysAgo = subDays(todayStart, 3);
    const sevenDaysAgo = subDays(todayStart, 7);

    let notificationsCreated = 0;

    // 1. Expiring Memberships
    const expiringMemberships = await prisma.membership.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          gte: todayStart,
          lte: inThreeDays,
        },
      },
      include: { plan: true },
    });

    for (const membership of expiringMemberships) {
      // Check if we already notified them recently (idempotency)
      const existing = await prisma.notification.findFirst({
        where: {
          userId: membership.userId,
          title: { contains: "Membership Expiring" },
          createdAt: { gte: threeDaysAgo },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: membership.userId,
            title: "Membership Expiring Soon",
            message: `Your ${membership.plan.name} membership expires on ${membership.endDate.toLocaleDateString()}. Please renew soon!`,
            type: "REMINDER",
          },
        });
        notificationsCreated++;
      }
    }

    // 2. Overdue Payments
    // Members who have active memberships that started in the past, but haven't paid enough
    const members = await prisma.user.findMany({
      where: { role: "MEMBER" },
      include: {
        memberships: {
          where: { startDate: { lt: todayStart } },
          include: { plan: true },
        },
        payments: {
          where: { status: "COMPLETED" },
        },
      },
    });

    for (const member of members) {
      if (member.memberships.length === 0) continue;

      const totalCharge = member.memberships.reduce((sum, m) => sum + (m.plan?.price || 0), 0);
      const totalPaid = member.payments.reduce((sum, p) => sum + p.amount, 0);
      const due = Math.max(0, totalCharge - totalPaid);

      if (due > 0) {
        // Check if we notified them in the last 7 days
        const existing = await prisma.notification.findFirst({
          where: {
            userId: member.id,
            title: { contains: "Overdue" },
            createdAt: { gte: sevenDaysAgo },
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: member.id,
              title: "Payment Overdue",
              message: `You have an outstanding balance of ${due}. Please clear your dues at the front desk.`,
              type: "REMINDER",
            },
          });
          notificationsCreated++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron executed successfully. Created ${notificationsCreated} notifications.`,
      count: notificationsCreated 
    });
  } catch (error) {
    console.error("Notifications cron failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
