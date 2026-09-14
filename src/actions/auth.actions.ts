"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function registerOwner(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const gymName = formData.get("gymName") as string;

  if (!email || !password || !name || !gymName) {
    return { error: "All fields are required" };
  }

  // Check if an owner or gym already exists
  const existingOwner = await prisma.user.findFirst({
    where: { role: "OWNER" }
  });

  const existingGym = await prisma.gym.findFirst();

  if (existingOwner || existingGym) {
    return { error: "An owner and gym already exist for this installation." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    // Run in transaction to ensure both or neither are created
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: "OWNER",
          status: "ACTIVE",
        }
      });

      await tx.gym.create({
        data: {
          name: gymName,
          email,
        }
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to register owner:", error);
    return { error: "An unexpected error occurred during registration." };
  }
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error; // Let Next.js handle redirect
  }
}
