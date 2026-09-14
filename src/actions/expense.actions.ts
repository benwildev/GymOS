"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ExpenseCategory, Role, Status } from "@prisma/client";
import { roundCurrency } from "@/services/financial.service";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  expenseDate?: string | Date;
  description: string;
  reference?: string;
}

export async function createExpense(input: CreateExpenseInput) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized. Only gym owners can add expenses." };
  }

  const { category, amount, expenseDate, description, reference } = input;

  const numAmount = roundCurrency(Number(amount));
  if (isNaN(numAmount) || numAmount <= 0) {
    return { error: "Expense amount must be greater than 0." };
  }

  if (!description || description.trim().length === 0) {
    return { error: "Expense description is required." };
  }

  try {
    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          category: category || ExpenseCategory.OTHER,
          amount: numAmount,
          expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
          description: description.trim(),
          reference: reference?.trim() || null,
          status: Status.ACTIVE,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "EXPENSE_CREATED",
          entity: "EXPENSE",
          entityId: exp.id,
        },
      });

      return exp;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");
    return { success: true, expense };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { error: "Failed to create expense. Please try again." };
  }
}

export async function updateExpense(id: string, input: Partial<CreateExpenseInput>) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized." };
  }

  try {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Expense record not found." };
    }

    const data: any = {};
    if (input.category) data.category = input.category;
    if (input.amount !== undefined) {
      const num = roundCurrency(Number(input.amount));
      if (num <= 0) return { error: "Amount must be greater than 0." };
      data.amount = num;
    }
    if (input.description) data.description = input.description.trim();
    if (input.reference !== undefined) data.reference = input.reference?.trim() || null;
    if (input.expenseDate) data.expenseDate = new Date(input.expenseDate);

    await prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data,
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "EXPENSE_UPDATED",
          entity: "EXPENSE",
          entityId: id,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");
    return { success: true };
  } catch (error) {
    console.error("Failed to update expense:", error);
    return { error: "Failed to update expense." };
  }
}

export async function cancelExpense(id: string) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: { status: Status.INACTIVE },
      });

      await tx.activityLog.create({
        data: {
          actorId: session.user.id,
          action: "EXPENSE_CANCELLED",
          entity: "EXPENSE",
          entityId: id,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel expense:", error);
    return { error: "Failed to cancel expense." };
  }
}

export interface ExpenseFilterOptions {
  search?: string;
  category?: ExpenseCategory | "ALL";
  datePreset?: "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM" | "ALL";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getExpenses(options: ExpenseFilterOptions = {}) {
  const session = await auth();
  if (!session || session.user?.role !== Role.OWNER) {
    return { error: "Unauthorized" };
  }

  const {
    search,
    category,
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
    status: Status.ACTIVE,
    ...(category && category !== "ALL" ? { category } : {}),
    ...(dateFilter ? { expenseDate: dateFilter } : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            { reference: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    expenses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
