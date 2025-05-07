// This marks the file to be treated as a server action in Next.js (app directory with server actions)
"use server";

// Importing custom ArcJet instance from local library
import aj from "@/lib/arcjet";

// Importing Prisma client to interact with the database
import { db } from "@/lib/prisma";

// Importing request object from ArcJet for analyzing user requests
import { request } from "@arcjet/next";

// Importing auth method from Clerk to get the authenticated user
import { auth } from "@clerk/nextjs/server";

// Used to revalidate a specific path in Next.js after data changes (like after creating a new account)
import { revalidatePath } from "next/cache";

// Function to convert BigInt values (like amount, balance) to numbers for serialization
const serializeTransaction = (obj) => {
  const serialized = { ...obj }; // Clone the object
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber(); // Convert balance to number if present
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber(); // Convert amount to number if present
  }
  return serialized; // Return the serialized object
};

// Function to get all accounts belonging to the currently logged-in user
export async function getUserAccounts() {
  const { userId } = await auth(); // Get the authenticated user's ID
  if (!userId) throw new Error("Unauthorized"); // If no user, throw error

  const user = await db.user.findUnique({
    where: { clerkUserId: userId }, // Find the user in the DB by Clerk ID
  });

  if (!user) {
    throw new Error("User not found"); // If user doesn't exist in DB
  }

  try {
    const accounts = await db.account.findMany({
      where: { userId: user.id }, // Get accounts where userId matches current user
      orderBy: { createdAt: "desc" }, // Order by creation time (newest first)
      include: {
        _count: {
          select: {
            transactions: true, // Include transaction count per account
          },
        },
      },
    });

    // Convert each account's BigInt values to numbers
    const serializedAccounts = accounts.map(serializeTransaction);

    return serializedAccounts; // Return the list of serialized accounts
  } catch (error) {
    console.error(error.message); // Log any DB errors
  }
}

// Function to create a new account for the logged-in user
export async function createAccount(data) {
  try {
    const { userId } = await auth(); // Get the logged-in user
    if (!userId) throw new Error("Unauthorized");

    const req = await request(); // Get current request context for ArcJet

    // Use ArcJet to protect the route (rate limiting, abuse detection)
    const decision = await aj.protect(req, {
      userId,         // Unique user ID to track limits
      requested: 1,   // Consume 1 token from the rate limit
    });

    // If ArcJet blocks the request
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) { // Specifically for rate limiting
        const { remaining, reset } = decision.reason; // Get rate limit details
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later."); // Rate limit error
      }

      throw new Error("Request blocked"); // Other block reasons
    }

    // Find the user in the database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Convert input balance (string) to float for database
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount"); // Input validation
    }

    // Check if this is the user's first account
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    // Determine whether this new account should be default
    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // If this account is set to be default, unset the default flag on others
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create the account with provided data and computed flags
    const account = await db.account.create({
      data: {
        ...data, // Spread all user-provided data
        balance: balanceFloat, // Overwrite balance as float
        userId: user.id, // Link account to the user
        isDefault: shouldBeDefault, // Mark as default if applicable
      },
    });

    // Convert BigInt fields to number before sending to client
    const serializedAccount = serializeTransaction(account);

    // Revalidate the dashboard page so the client sees updated data
    revalidatePath("/dashboard");

    return { success: true, data: serializedAccount }; // Return success result
  } catch (error) {
    throw new Error(error.message); // Bubble up any error
  }
}

// Function to get dashboard data (user transactions list)
export async function getDashboardData() {
  const { userId } = await auth(); // Get current user ID
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId }, // Get user from DB
  });

  if (!user) {
    throw new Error("User not found"); // Error if user not in DB
  }

  // Fetch all transactions for this user, newest first
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" }, // Sort by most recent date
  });

  // Return transactions with BigInts converted to numbers
  return transactions.map(serializeTransaction);
}
