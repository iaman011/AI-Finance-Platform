"use server"; // Marks this file as a Server Action module for Next.js

import { db } from "@/lib/prisma"; // Prisma client for database operations
import { auth } from "@clerk/nextjs/server"; // Clerk server-side auth to get current user
import { revalidatePath } from "next/cache"; // Used to invalidate cache for a given path

// Function to get the current user's budget and current month's expenses
export async function getCurrentBudget(accountId) {
  try {
    const { userId } = await auth(); // Get the authenticated user's ID
    if (!userId) throw new Error("Unauthorized"); // If not logged in, throw error

    // Find the user in your database using the Clerk user ID
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found"); // If user not found in DB, throw error
    }

    // Find the budget for the user
    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // Get the start and end of the current month
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Aggregate the sum of all EXPENSE transactions for the current month and account
    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId,
      },
      _sum: {
        amount: true, // Sum the 'amount' field
      },
    });

    // Return both budget (if exists) and current expenses for this month
    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error); // Log error
    throw error; // Rethrow so calling function can handle it
  }
}

// Function to update (or create) the user's budget
export async function updateBudget(amount) {
  try {
    const { userId } = await auth(); // Get the authenticated user's ID
    if (!userId) throw new Error("Unauthorized"); // If not logged in, throw error

    // Find the user in your database using the Clerk user ID
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found"); // If user not found in DB, throw error

    // Update existing budget if it exists, otherwise create a new one
    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount, // Update amount if budget exists
      },
      create: {
        userId: user.id,
        amount, // Create new budget with amount
      },
    });

    revalidatePath("/dashboard"); // Invalidate cache for dashboard page to reflect updated data

    // Return success response with updated budget data
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error); // Log error
    // Return failure response
    return { success: false, error: error.message };
  }
}
