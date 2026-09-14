"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { MembershipStatus, PaymentMethod, PaymentStatus, Role } from "@prisma/client";
import { generateReceiptNumber } from "@/services/financial.service";

// Helper function to generate Member ID
async function generateMemberId(): Promise<string> {
  const count = await prisma.memberProfile.count();
  const nextId = count + 1;
  return `GYM-${nextId.toString().padStart(6, '0')}`;
}

export async function createMember(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  // Personal Info
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const gender = formData.get("gender") as string;
  const dob = formData.get("dob") as string;
  const address = formData.get("address") as string;

  // Emergency Contact
  const emergencyContactName = formData.get("emergencyContactName") as string;
  const emergencyContactPhone = formData.get("emergencyContactPhone") as string;
  const emergencyContactRel = formData.get("emergencyContactRel") as string;

  // Membership & Payment
  const planId = formData.get("planId") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const paymentAmountStr = formData.get("paymentAmount") as string;

  if (!email || !firstName || !planId) {
    return { error: "Missing required fields" };
  }

  try {
    // Verify plan exists
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return { error: "Selected plan not found" };
    }

    const amount = paymentAmountStr ? parseFloat(paymentAmountStr) : plan.price;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Create random initial password
    const rawPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const memberId = await generateMemberId();

    await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`.trim(),
          email,
          password: hashedPassword,
          role: Role.MEMBER,
        }
      });

      // 2. Create Profile
      await tx.memberProfile.create({
        data: {
          userId: user.id,
          memberId,
          phone: phone || null,
          gender: gender || null,
          dob: dob ? new Date(dob) : null,
          address: address || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          emergencyContactRel: emergencyContactRel || null,
        }
      });

      // 3. Create Membership
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          planId: plan.id,
          startDate,
          endDate,
          status: MembershipStatus.ACTIVE,
        }
      });

      // 4. Create Payment
      const receiptNumber = await generateReceiptNumber(tx);
      await tx.payment.create({
        data: {
          receiptNumber,
          userId: user.id,
          membershipId: membership.id,
          amount,
          status: PaymentStatus.COMPLETED,
          paymentMethod: (paymentMethod as any) || PaymentMethod.CASH,
        }
      });
    });

    revalidatePath("/dashboard/members");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create member:", error);
    if (error?.code === 'P2002') {
      return { error: "A member with this email already exists." };
    }
    return { error: "An unexpected error occurred while creating the member." };
  }
}

export async function getMembers(search?: string, status?: MembershipStatus, planId?: string) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  try {
    const where: any = {
      role: Role.MEMBER,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { memberId: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status || planId) {
      where.memberships = {
        some: {
          ...(status && { status }),
          ...(planId && { planId }),
        }
      };
    }

    const members = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        memberships: {
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { members };
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return { error: "An unexpected error occurred while fetching members." };
  }
}

export async function getMemberById(id: string) {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  try {
    const member = await prisma.user.findUnique({
      where: { id, role: Role.MEMBER },
      include: {
        profile: true,
        memberships: {
          include: {
            plan: true,
            payments: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    });


    return { member };
  } catch (error) {
    console.error("Failed to fetch member details:", error);
    return { error: "An unexpected error occurred while fetching member details." };
  }
}
