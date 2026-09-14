import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

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

    // Find all active check-ins that were started before today
    const staleAttendances = await prisma.attendance.findMany({
      where: {
        checkOutAt: null,
        checkInAt: {
          lt: todayStart,
        },
      },
    });

    if (staleAttendances.length === 0) {
      return NextResponse.json({ success: true, message: "No stale check-ins found.", count: 0 });
    }

    // Process check-outs: set checkOutAt to 23:59:59 of the day they checked in
    const updates = staleAttendances.map((attendance) => {
      const endOfCheckInDay = endOfDay(attendance.checkInAt);
      
      return prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOutAt: endOfCheckInDay,
          notes: attendance.notes ? `${attendance.notes} (Auto-checkout)` : "(Auto-checkout)",
        },
      });
    });

    // Execute all updates in a transaction
    await prisma.$transaction(updates);

    return NextResponse.json({ 
      success: true, 
      message: `Automatically checked out ${staleAttendances.length} member(s).`,
      count: staleAttendances.length 
    });
  } catch (error) {
    console.error("Auto-checkout cron failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
