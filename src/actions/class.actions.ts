"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { ClassStatus, ScheduleStatus, BookingStatus } from "@/types/enums";
import { startOfDay, endOfDay } from "date-fns";

export interface CreateClassInput {
  name: string;
  description?: string;
  duration: number;
  capacity: number;
  status?: ClassStatus;
}

export interface UpdateClassInput {
  name: string;
  description?: string;
  duration: number;
  capacity: number;
  status: ClassStatus;
}

export interface CreateScheduleInput {
  classId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "07:00 AM" or "07:00"
  endTime: string; // "08:00 AM" or "08:00"
  capacity?: number;
}

// -------------------------------------------------------------
// 1. CLASS DEFINITIONS (REUSABLE TEMPLATES)
// -------------------------------------------------------------

export async function getClasses(search?: string, status?: string) {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const where: any = {};
    if (search && search.trim()) {
      where.name = { contains: search.trim(), mode: "insensitive" };
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    const todayStart = startOfDay(new Date());

    const classes = await prisma.class.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            schedules: {
              where: {
                date: { gte: todayStart },
                status: ScheduleStatus.ACTIVE,
              },
            },
          },
        },
      },
    });

    return { success: true, classes };
  } catch (error: any) {
    console.error("Error fetching classes:", error);
    return { error: "Failed to load gym classes." };
  }
}

export async function createClass(input: CreateClassInput) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only gym owners can create classes." };
  }

  const { name, description, duration, capacity, status } = input;

  if (!name || !name.trim()) {
    return { error: "Class name is required." };
  }

  const numDuration = Number(duration);
  if (isNaN(numDuration) || numDuration <= 0) {
    return { error: "Duration must be greater than 0 minutes." };
  }

  const numCapacity = Number(capacity);
  if (isNaN(numCapacity) || numCapacity <= 0) {
    return { error: "Capacity must be at least 1 spot." };
  }

  try {
    const newClass = await prisma.$transaction(async (tx) => {
      const created = await tx.class.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          duration: numDuration,
          capacity: numCapacity,
          status: status || ClassStatus.ACTIVE,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "CLASS_CREATED",
          entity: "CLASS",
          entityId: created.id,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/classes");
    revalidatePath("/member/classes");

    return { success: true, class: newClass };
  } catch (error: any) {
    console.error("Error creating class:", error);
    return { error: "Failed to create class. Please try again." };
  }
}

export async function updateClass(id: string, input: UpdateClassInput) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only gym owners can update classes." };
  }

  const { name, description, duration, capacity, status } = input;

  if (!name || !name.trim()) {
    return { error: "Class name is required." };
  }

  const numDuration = Number(duration);
  if (isNaN(numDuration) || numDuration <= 0) {
    return { error: "Duration must be greater than 0 minutes." };
  }

  const numCapacity = Number(capacity);
  if (isNaN(numCapacity) || numCapacity <= 0) {
    return { error: "Capacity must be at least 1 spot." };
  }

  try {
    const updatedClass = await prisma.$transaction(async (tx) => {
      const updated = await tx.class.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          duration: numDuration,
          capacity: numCapacity,
          status,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "CLASS_UPDATED",
          entity: "CLASS",
          entityId: updated.id,
        },
      });

      return updated;
    });

    revalidatePath("/dashboard/classes");
    revalidatePath("/member/classes");

    return { success: true, class: updatedClass };
  } catch (error: any) {
    console.error("Error updating class:", error);
    return { error: "Failed to update class." };
  }
}

export async function toggleArchiveClass(id: string) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized." };
  }

  try {
    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Class not found." };
    }

    const nextStatus =
      existing.status === ClassStatus.ACTIVE ? ClassStatus.INACTIVE : ClassStatus.ACTIVE;

    await prisma.$transaction(async (tx) => {
      await tx.class.update({
        where: { id },
        data: { status: nextStatus },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: nextStatus === ClassStatus.ACTIVE ? "CLASS_ACTIVATED" : "CLASS_DEACTIVATED",
          entity: "CLASS",
          entityId: id,
        },
      });
    });

    revalidatePath("/dashboard/classes");
    revalidatePath("/member/classes");

    return { success: true, status: nextStatus };
  } catch (error: any) {
    console.error("Error toggling class status:", error);
    return { error: "Failed to update class status." };
  }
}

// -------------------------------------------------------------
// 2. CLASS SCHEDULES (INDIVIDUAL SESSIONS)
// -------------------------------------------------------------

export async function getClassSchedules(filters?: {
  date?: string;
  classId?: string;
  upcomingOnly?: boolean;
}) {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const where: any = {};

    if (filters?.classId && filters.classId !== "ALL") {
      where.classId = filters.classId;
    }

    if (filters?.date) {
      const parsedDate = new Date(filters.date);
      where.date = {
        gte: startOfDay(parsedDate),
        lte: endOfDay(parsedDate),
      };
    } else if (filters?.upcomingOnly) {
      where.date = {
        gte: startOfDay(new Date()),
      };
    }

    const schedules = await prisma.classSchedule.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        class: true,
        bookings: {
          where: { status: BookingStatus.BOOKED },
          select: { id: true, userId: true },
        },
      },
    });

    const formatted = schedules.map((s) => {
      const bookedCount = s.bookings.length;
      const availableSpots = Math.max(0, s.capacity - bookedCount);
      const isFull = bookedCount >= s.capacity;
      const isUserBooked = session?.user?.id
        ? s.bookings.some((b) => b.userId === session.user.id)
        : false;

      return {
        ...s,
        bookedCount,
        availableSpots,
        isFull,
        isUserBooked,
      };
    });

    return { success: true, schedules: formatted };
  } catch (error: any) {
    console.error("Error fetching class schedules:", error);
    return { error: "Failed to load class schedules." };
  }
}

export async function createClassSchedule(input: CreateScheduleInput) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only gym owners can schedule classes." };
  }

  const { classId, date, startTime, endTime, capacity } = input;

  if (!classId) {
    return { error: "Please select a gym class." };
  }

  if (!date) {
    return { error: "Schedule date is required." };
  }

  if (!startTime || !endTime) {
    return { error: "Start time and end time are required." };
  }

  try {
    const parentClass = await prisma.class.findUnique({ where: { id: classId } });
    if (!parentClass) {
      return { error: "Class template not found." };
    }

    if (parentClass.status !== ClassStatus.ACTIVE) {
      return { error: "Cannot schedule sessions for an inactive class." };
    }

    const sessionCapacity = capacity && Number(capacity) > 0 ? Number(capacity) : parentClass.capacity;

    const scheduleDate = new Date(date);
    if (isNaN(scheduleDate.getTime())) {
      return { error: "Invalid date format." };
    }

    const newSchedule = await prisma.$transaction(async (tx) => {
      const created = await tx.classSchedule.create({
        data: {
          classId,
          date: scheduleDate,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          capacity: sessionCapacity,
          status: ScheduleStatus.ACTIVE,
        },
        include: { class: true },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "CLASS_SCHEDULE_CREATED",
          entity: "CLASS_SCHEDULE",
          entityId: created.id,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");
    revalidatePath("/member/classes");
    revalidatePath("/member");

    return { success: true, schedule: newSchedule };
  } catch (error: any) {
    console.error("Error creating class schedule:", error);
    return { error: "Failed to create class schedule." };
  }
}

export async function cancelClassSchedule(scheduleId: string) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized." };
  }

  try {
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: scheduleId },
      include: { class: true },
    });

    if (!schedule) {
      return { error: "Schedule session not found." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.classSchedule.update({
        where: { id: scheduleId },
        data: { status: ScheduleStatus.CANCELLED },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "CLASS_SCHEDULE_CANCELLED",
          entity: "CLASS_SCHEDULE",
          entityId: scheduleId,
        },
      });
    });

    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");
    revalidatePath("/member/classes");
    revalidatePath("/member");

    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling schedule:", error);
    return { error: "Failed to cancel class session." };
  }
}

// -------------------------------------------------------------
// 3. OWNER ROSTER & BOOKING MANAGEMENT
// -------------------------------------------------------------

export async function getClassScheduleBookings(scheduleId: string) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized." };
  }

  try {
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        class: true,
        bookings: {
          orderBy: { bookedAt: "asc" },
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      return { error: "Class schedule session not found." };
    }

    const activeBookings = schedule.bookings.filter(
      (b) => b.status === BookingStatus.BOOKED || b.status === BookingStatus.ATTENDED
    );
    const bookedCount = activeBookings.length;
    const availableSpots = Math.max(0, schedule.capacity - bookedCount);

    return {
      success: true,
      schedule,
      bookedCount,
      availableSpots,
      bookings: schedule.bookings,
    };
  } catch (error: any) {
    console.error("Error fetching schedule bookings:", error);
    return { error: "Failed to load session roster." };
  }
}

export async function updateBookingAttendance(
  bookingId: string,
  status: "ATTENDED" | "NO_SHOW" | "CANCELLED"
) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized." };
  }

  try {
    const booking = await prisma.classBooking.findUnique({
      where: { id: bookingId },
      include: { classSchedule: true },
    });

    if (!booking) {
      return { error: "Booking not found." };
    }

    const dataToUpdate: any = { status };
    if (status === "CANCELLED") {
      dataToUpdate.cancelledAt = new Date();
    }

    await prisma.$transaction(async (tx) => {
      await tx.classBooking.update({
        where: { id: bookingId },
        data: dataToUpdate,
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: `BOOKING_${status}`,
          entity: "CLASS_BOOKING",
          entityId: bookingId,
        },
      });
    });

    revalidatePath("/dashboard/classes");
    revalidatePath("/member/classes");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating booking status:", error);
    return { error: "Failed to update attendance status." };
  }
}

// -------------------------------------------------------------
// 4. MEMBER BOOKING & CANCELLATION (CONCURRENCY-PROTECTED)
// -------------------------------------------------------------

export async function bookClass(scheduleId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Please sign in to book a class." };
  }

  const userId = session.user.id;

  try {
    // 1. Verify Member Profile & Active Membership Status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: {
            status: "ACTIVE",
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
      },
    });

    if (!user) {
      return { error: "User account not found." };
    }

    // Role check: Only MEMBERS can book
    if (user.role !== Role.MEMBER) {
      return { error: "Only active gym members can book fitness classes." };
    }

    if (!user.memberships || user.memberships.length === 0) {
      return {
        error: "Active gym membership required. Please renew or activate your membership first.",
      };
    }

    // 2. Concurrency-Safe Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Fetch schedule and verify status
      const schedule = await tx.classSchedule.findUnique({
        where: { id: scheduleId },
        include: { class: true },
      });

      if (!schedule) {
        throw new Error("Class schedule session not found.");
      }

      if (schedule.status !== ScheduleStatus.ACTIVE) {
        throw new Error("This class session has been cancelled or completed.");
      }

      if (schedule.class.status !== ClassStatus.ACTIVE) {
        throw new Error("This class is currently inactive.");
      }

      // Check current active bookings count
      const activeBookingsCount = await tx.classBooking.count({
        where: {
          classScheduleId: scheduleId,
          status: BookingStatus.BOOKED,
        },
      });

      if (activeBookingsCount >= schedule.capacity) {
        throw new Error("Class is full. No spots available.");
      }

      // Check if this member has already booked this session
      const existingBooking = await tx.classBooking.findUnique({
        where: {
          classScheduleId_userId: {
            classScheduleId: scheduleId,
            userId,
          },
        },
      });

      let bookingRecord;

      if (existingBooking) {
        if (existingBooking.status === BookingStatus.BOOKED) {
          throw new Error("You have already booked this class session.");
        }

        // If previously cancelled or no-show, re-activate booking
        bookingRecord = await tx.classBooking.update({
          where: { id: existingBooking.id },
          data: {
            status: BookingStatus.BOOKED,
            bookedAt: new Date(),
            cancelledAt: null,
          },
        });
      } else {
        bookingRecord = await tx.classBooking.create({
          data: {
            classScheduleId: scheduleId,
            userId,
            status: BookingStatus.BOOKED,
            bookedAt: new Date(),
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          actorId: userId,
          action: "MEMBER_BOOKED_CLASS",
          entity: "CLASS_BOOKING",
          entityId: bookingRecord.id,
        },
      });

      return {
        booking: bookingRecord,
        className: schedule.class.name,
        date: schedule.date,
        startTime: schedule.startTime,
      };
    });

    revalidatePath("/member/classes");
    revalidatePath("/member");
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `You're booked for ${result.className} at ${result.startTime}!`,
      booking: result.booking,
    };
  } catch (error: any) {
    console.error("Class booking error:", error.message || error);
    return {
      error: error.message || "Unable to complete class booking. Please try again.",
    };
  }
}

export async function cancelClassBooking(bookingId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  try {
    const booking = await prisma.classBooking.findUnique({
      where: { id: bookingId },
      include: { classSchedule: { include: { class: true } } },
    });

    if (!booking) {
      return { error: "Booking record not found." };
    }

    // Security: only the member who made the booking or an owner can cancel
    if (booking.userId !== userId && session.user.role !== Role.OWNER) {
      return { error: "Unauthorized to cancel this booking." };
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return { error: "This booking has already been cancelled." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.classBooking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: userId,
          action: "MEMBER_CANCELLED_BOOKING",
          entity: "CLASS_BOOKING",
          entityId: bookingId,
        },
      });
    });

    revalidatePath("/member/classes");
    revalidatePath("/member");
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Booking cancelled successfully. Your spot has been released.",
    };
  } catch (error: any) {
    console.error("Booking cancellation error:", error);
    return { error: "Failed to cancel booking. Please try again." };
  }
}

// -------------------------------------------------------------
// 5. MEMBER PORTAL CLASS DATA
// -------------------------------------------------------------

export async function getMemberClassesData() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;
  const todayStart = startOfDay(new Date());

  try {
    // 1. Available upcoming schedules
    const schedules = await prisma.classSchedule.findMany({
      where: {
        date: { gte: todayStart },
        status: ScheduleStatus.ACTIVE,
        class: { status: ClassStatus.ACTIVE },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        class: true,
        bookings: {
          where: { status: BookingStatus.BOOKED },
          select: { id: true, userId: true },
        },
      },
    });

    const availableClasses = schedules.map((s) => {
      const bookedCount = s.bookings.length;
      const availableSpots = Math.max(0, s.capacity - bookedCount);
      const isFull = bookedCount >= s.capacity;
      const userBooking = s.bookings.find((b) => b.userId === userId);

      return {
        id: s.id,
        classId: s.classId,
        className: s.class.name,
        description: s.class.description,
        duration: s.class.duration,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: s.capacity,
        bookedCount,
        availableSpots,
        isFull,
        isUserBooked: !!userBooking,
        userBookingId: userBooking?.id || null,
      };
    });

    // 2. Member's own bookings (Upcoming + Past)
    const myBookings = await prisma.classBooking.findMany({
      where: { userId },
      orderBy: { bookedAt: "desc" },
      include: {
        classSchedule: {
          include: {
            class: true,
          },
        },
      },
    });

    const upcomingBookings = myBookings.filter(
      (b) =>
        b.status === BookingStatus.BOOKED &&
        new Date(b.classSchedule.date) >= todayStart &&
        b.classSchedule.status === ScheduleStatus.ACTIVE
    );

    const bookingHistory = myBookings.filter(
      (b) =>
        b.status !== BookingStatus.BOOKED ||
        new Date(b.classSchedule.date) < todayStart ||
        b.classSchedule.status !== ScheduleStatus.ACTIVE
    );

    return {
      success: true,
      availableClasses,
      upcomingBookings,
      bookingHistory,
    };
  } catch (error: any) {
    console.error("Error fetching member classes:", error);
    return { error: "Failed to load classes." };
  }
}
