"use server"; // Enables server-side execution in Next.js App Router

// Import the Prisma client to access the database
import { db } from "@/lib/prisma";

// Import Clerk's auth function to get the currently authenticated user
import { auth } from "@clerk/nextjs/server";

// Revalidate cached pages to reflect new server-side data
import { revalidatePath } from "next/cache";

// Utility function to convert Prisma Decimal fields to plain numbers
const serializeDecimal = (obj) => {
  const serialized = { ...obj }; // Make a shallow copy of the object

  // If balance is a Decimal, convert to number
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }

  // If amount is a Decimal, convert to number
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }

  return serialized; // Return the converted object
};

// Get account data along with all its transactions for a specific account ID
export async function getAccountWithTransactions(accountId) {
  const { userId } = await auth(); // Get the logged-in user ID from Clerk
  if (!userId) throw new Error("Unauthorized"); // If no user, throw an error

  const user = await db.user.findUnique({
    where: { clerkUserId: userId }, // Look up user in the DB by Clerk ID
  });

  if (!user) throw new Error("User not found"); // If user doesn't exist, throw error

  // Fetch the account and related transactions for this user
  const account = await db.account.findUnique({
    where: {
      id: accountId, // Match the account ID
      userId: user.id, // Ensure account belongs to the authenticated user
    },
    include: {
      transactions: {
        orderBy: { date: "desc" }, // Include transactions ordered by most recent
      },
      _count: {
        select: { transactions: true }, // Also include transaction count
      },
    },
  });

  if (!account) return null; // Return null if no matching account found

  // Return account data with serialized Decimal fields
  return {
    ...serializeDecimal(account),
    transactions: account.transactions.map(serializeDecimal), // Serialize each transaction
  };
}

// Bulk delete multiple transactions and update their respective account balances
export async function bulkDeleteTransactions(transactionIds) {
  try {
    const { userId } = await auth(); // Get logged-in user ID
    if (!userId) throw new Error("Unauthorized"); // If not logged in, throw error

    const user = await db.user.findUnique({
      where: { clerkUserId: userId }, // Look up user in DB by Clerk ID
    });

    if (!user) throw new Error("User not found"); // If user not found, throw error

    // Fetch all transactions that will be deleted (used for recalculating balance)
    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds }, // Filter by given transaction IDs
        userId: user.id, // Ensure transactions belong to this user
      },
    });

    // Calculate balance changes for each account based on transaction type
    const accountBalanceChanges = transactions.reduce((acc, transaction) => {
      // If it's an EXPENSE, we add the amount back to the account
      // If it's INCOME, we subtract it (since we're deleting it)
      const change =
        transaction.type === "EXPENSE"
          ? transaction.amount
          : -transaction.amount;

      // Accumulate balance change for each account
      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
      return acc;
    }, {});

    // Use Prisma transaction to ensure atomic updates and deletions
    await db.$transaction(async (tx) => {
      // Delete the selected transactions
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds }, // Match by given IDs
          userId: user.id, // Ensure they belong to user
        },
      });

      // Apply balance changes to each affected account
      for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
        await tx.account.update({
          where: { id: accountId }, // Update by account ID
          data: {
            balance: {
              increment: balanceChange, // Apply the balance change
            },
          },
        });
      }
    });

    // Revalidate paths to show updated data in the frontend
    revalidatePath("/dashboard"); // Revalidate dashboard
    revalidatePath("/account/[id]"); // Revalidate individual account page

    return { success: true }; // Return success flag
  } catch (error) {
    return { success: false, error: error.message }; // On error, return message
  }
}

// Set one account as the user's default account (only one allowed)
export async function updateDefaultAccount(accountId) {
  try {
    const { userId } = await auth(); // Get logged-in user ID
    if (!userId) throw new Error("Unauthorized"); // Block unauthenticated access

    const user = await db.user.findUnique({
      where: { clerkUserId: userId }, // Find user by Clerk ID
    });

    if (!user) {
      throw new Error("User not found"); // Handle missing user
    }

    // Step 1: Remove default status from any existing default account
    await db.account.updateMany({
      where: {
        userId: user.id, // Only for this user
        isDefault: true, // Only those currently marked as default
      },
      data: { isDefault: false }, // Unset default
    });

    // Step 2: Set the selected account as the new default
    const account = await db.account.update({
      where: {
        id: accountId, // Match by ID
        userId: user.id, // Ensure it belongs to user
      },
      data: { isDefault: true }, // Set as default
    });

    // Revalidate dashboard to reflect change
    revalidatePath("/dashboard");

    // Return success response and account data
    return { success: true, data: serializeDecimal(account) };
  } catch (error) {
    return { success: false, error: error.message }; // Return error info
  }
}
