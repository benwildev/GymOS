"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { MembershipStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { generateReceiptNumber } from "@/services/financial.service";
import { addDays } from "date-fns";

export async function renewMembershipAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized. Only gym owners can process membership renewals." };
  }

  const userId = formData.get("userId") as string;
  const planId = formData.get("planId") as string;
  const paymentMethod = (formData.get("paymentMethod") as string) || "CASH";
  const paymentAmountStr = formData.get("paymentAmount") as string;
  const reference = formData.get("reference") as string;
  const note = formData.get("note") as string;

  if (!userId || !planId) {
    return { error: "Member ID and Membership Plan are required." };
  }

  try {
    const [user, plan, currentActiveMembership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.membershipPlan.findUnique({
        where: { id: planId },
      }),
      prisma.membership.findFirst({
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
        },
        orderBy: { endDate: "desc" },
      }),
    ]);

    if (!user) {
      return { error: "Member record not found." };
    }

    if (!plan) {
      return { error: "Selected membership plan not found." };
    }

    const now = new Date();
    // If renewal happens before expiry, new membership starts after current expiry to prevent losing days
    let startDate: Date;
    if (currentActiveMembership && currentActiveMembership.endDate > now) {
      startDate = new Date(currentActiveMembership.endDate);
    } else {
      startDate = now;
    }

    const endDate = addDays(startDate, plan.duration);
    const amount = paymentAmountStr ? parseFloat(paymentAmountStr) : plan.price;

    // 1. Create the new membership record (preserves previous membership history)
    const newMembership = await prisma.membership.create({
      data: {
        userId: user.id,
        planId: plan.id,
        startDate,
        endDate,
        status: MembershipStatus.ACTIVE,
      },
    });

    // 2. Generate sequential receipt number and record payment
    const receiptNumber = await generateReceiptNumber(prisma);
    const payment = await prisma.payment.create({
      data: {
        receiptNumber,
        userId: user.id,
        membershipId: newMembership.id,
        amount: isNaN(amount) ? plan.price : amount,
        status: PaymentStatus.COMPLETED,
        paymentMethod: (paymentMethod as any) || PaymentMethod.CASH,
        reference: reference?.trim() || null,
        note: note?.trim() || `Renewal for ${plan.name}`,
      },
    });

    // 3. Log event in ActivityLog
    try {
      await prisma.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "MEMBERSHIP_RENEWED",
          entity: "MEMBERSHIP",
          entityId: newMembership.id,
        },
      });
    } catch (logErr) {
      console.warn("Could not write activity log:", logErr);
    }

    const result = { membership: newMembership, payment, receiptNumber };

    revalidatePath(`/dashboard/members/${userId}`);
    revalidatePath("/dashboard/memberships");
    revalidatePath("/dashboard/members/attention");
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard");
    revalidatePath("/member/membership");
    revalidatePath("/member");

    return {
      success: true,
      membership: result.membership,
      receiptNumber: result.receiptNumber,
    };
  } catch (error) {
    console.error("Failed to renew membership:", error);
    return { error: "An unexpected error occurred while renewing the membership." };
  }
}
