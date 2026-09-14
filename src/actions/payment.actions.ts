"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PaymentMethod, PaymentStatus, Role } from "@prisma/client";
import { generateReceiptNumber, getMemberFinancialSummary, roundCurrency } from "@/services/financial.service";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface RecordPaymentInput {
  userId: string;
  membershipId?: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string | Date;
  reference?: string;
  note?: string;
}

export async function recordPayment(input: RecordPaymentInput) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only gym owners can record payments." };
  }

  const { userId, membershipId, amount, paymentMethod, paymentDate, reference, note } = input;

  if (!userId) {
    return { error: "Member is required." };
  }

  const numAmount = roundCurrency(Number(amount));
  if (isNaN(numAmount) || numAmount <= 0) {
    return { error: "Payment amount must be greater than 0." };
  }

  // 1. Fetch member and their memberships to validate balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { plan: true },
      },
      payments: {
        where: { status: PaymentStatus.COMPLETED },
      },
    },
  });

  if (!user || user.role !== Role.MEMBER) {
    return { error: "Member not found." };
  }

  const totalCharges = roundCurrency(
    user.memberships.reduce((sum, m) => sum + (m.plan?.price || 0), 0)
  );
  const totalPaid = roundCurrency(
    user.payments.reduce((sum, p) => sum + p.amount, 0)
  );
  const currentDue = roundCurrency(Math.max(0, totalCharges - totalPaid));

  // 2. Anti-overpayment validation
  if (numAmount > currentDue) {
    return {
      error: `Payment exceeds the outstanding balance. Current due is ${currentDue.toFixed(2)}, but received ${numAmount.toFixed(2)}.`,
    };
  }

  try {
    // 3. Prevent accidental double-submission within last 3 seconds
    const threeSecondsAgo = new Date(Date.now() - 3000);
    const recentDuplicate = await prisma.payment.findFirst({
      where: {
        userId,
        amount: numAmount,
        paymentMethod,
        createdAt: { gte: threeSecondsAgo },
      },
    });

    if (recentDuplicate) {
      return {
        success: true,
        payment: recentDuplicate,
        receiptNumber: recentDuplicate.receiptNumber,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const receiptNumber = await generateReceiptNumber(tx);

      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          userId,
          membershipId: membershipId || null,
          amount: numAmount,
          paymentMethod: paymentMethod || PaymentMethod.CASH,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          reference: reference?.trim() || null,
          note: note?.trim() || null,
          status: PaymentStatus.COMPLETED,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "PAYMENT_RECORDED",
          entity: "PAYMENT",
          entityId: payment.id,
        },
      });

      return { payment, receiptNumber };
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/payments/due");
    revalidatePath(`/dashboard/members/${userId}`);
    revalidatePath("/member");
    revalidatePath("/member/payments");

    return {
      success: true,
      payment: result.payment,
      receiptNumber: result.receiptNumber,
    };
  } catch (error: any) {
    console.error("Failed to record payment:", error);
    return { error: "Failed to record payment. Please try again." };
  }
}

export async function cancelPayment(paymentId: string, reason: string) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only owners can cancel payments." };
  }

  if (!reason || reason.trim().length < 3) {
    return { error: "A valid cancellation reason is required." };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    return { error: "Payment record not found." };
  }

  if (payment.status === PaymentStatus.CANCELLED) {
    return { error: "Payment is already cancelled." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.CANCELLED,
          cancelReason: reason.trim(),
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "PAYMENT_CANCELLED",
          entity: "PAYMENT",
          entityId: paymentId,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/payments/due");
    revalidatePath(`/dashboard/payments/${paymentId}`);
    revalidatePath(`/dashboard/members/${payment.userId}`);
    revalidatePath("/member/payments");

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel payment:", error);
    return { error: "An unexpected error occurred while cancelling payment." };
  }
}

export interface PaymentFilterOptions {
  search?: string;
  method?: PaymentMethod | "ALL";
  status?: PaymentStatus | "ALL";
  datePreset?: "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM" | "ALL";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getPayments(options: PaymentFilterOptions = {}) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized" };
  }

  const {
    search,
    method,
    status,
    datePreset = "ALL",
    startDate,
    endDate,
    page = 1,
    limit = 15,
  } = options;

  const now = new Date();
  let dateFilter: any = undefined;

  if (datePreset === "TODAY") {
    dateFilter = { gte: startOfDay(now), lte: endOfDay(now) };
  } else if (datePreset === "YESTERDAY") {
    const yesterday = subDays(now, 1);
    dateFilter = { gte: startOfDay(yesterday), lte: endOfDay(yesterday) };
  } else if (datePreset === "THIS_WEEK") {
    dateFilter = { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) };
  } else if (datePreset === "THIS_MONTH") {
    dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
  } else if (datePreset === "LAST_MONTH") {
    const lastMonth = subMonths(now, 1);
    dateFilter = { gte: startOfMonth(lastMonth), lte: endOfMonth(lastMonth) };
  } else if (datePreset === "CUSTOM" && startDate && endDate) {
    dateFilter = { gte: startOfDay(new Date(startDate)), lte: endOfDay(new Date(endDate)) };
  }

  const where: any = {
    ...(status && status !== "ALL" ? { status } : {}),
    ...(method && method !== "ALL" ? { paymentMethod: method } : {}),
    ...(dateFilter ? { paymentDate: dateFilter } : {}),
    ...(search
      ? {
          OR: [
            { receiptNumber: { contains: search, mode: "insensitive" } },
            { reference: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { profile: { memberId: { contains: search, mode: "insensitive" } } } },
            { user: { profile: { phone: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        user: {
          include: { profile: true },
        },
        membership: {
          include: { plan: true },
        },
      },
      orderBy: { paymentDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    payments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPaymentById(paymentId: string) {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        include: {
          profile: true,
          memberships: {
            include: { plan: true },
          },
          payments: {
            where: { status: PaymentStatus.COMPLETED },
            orderBy: { paymentDate: "asc" },
          },
        },
      },
      membership: {
        include: { plan: true },
      },
    },
  });

  if (!payment) {
    return { error: "Payment not found." };
  }

  // If role is MEMBER, verify user owns this payment
  if (session.user.role === Role.MEMBER && payment.userId !== session.user.id) {
    return { error: "Unauthorized access to payment record." };
  }

  // Calculate historical previous due and remaining due at the time this payment was completed
  const memberships = payment.user?.memberships || [];
  const userPayments = payment.user?.payments || [];
  const totalCharge = memberships.reduce((sum, m) => sum + (m.plan?.price || 0), 0);
  const paymentsUpToThis = userPayments.filter(
    (p) => new Date(p.paymentDate).getTime() <= new Date(payment.paymentDate).getTime()
  );
  const paidUpToThis = paymentsUpToThis.reduce((sum, p) => sum + p.amount, 0);
  const remainingDue = Math.max(0, totalCharge - paidUpToThis);
  const previousDue = remainingDue + payment.amount;

  const gym = await prisma.gym.findFirst();

  return {
    payment,
    gym,
    financials: {
      totalCharge: roundCurrency(totalCharge),
      previousDue: roundCurrency(previousDue),
      paidAmount: roundCurrency(payment.amount),
      remainingDue: roundCurrency(remainingDue),
    },
  };
}

export async function getMemberBalanceAction(userId: string) {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" };
  }

  // If member, ensure they can only query their own balance
  if (session.user.role === Role.MEMBER && session.user.id !== userId) {
    return { error: "Unauthorized" };
  }

  try {
    const summary = await getMemberFinancialSummary(userId);
    return { summary };
  } catch (error) {
    console.error("Failed to get member balance:", error);
    return { error: "Failed to get member balance." };
  }
}

