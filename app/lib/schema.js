// Importing `z` from Zod — a TypeScript-first schema validation library
// here it is used in form validation to create new account
import { z } from "zod";

// Schema for validating account creation/update input
export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"), // 'name' must be a non-empty string
  type: z.enum(["CURRENT", "SAVINGS"]),        // 'type' must be either "CURRENT" or "SAVINGS"
  balance: z.string().min(1, "Initial balance is required"), // 'balance' must be a non-empty string (can be parsed later)
  isDefault: z.boolean().default(false),       // Optional boolean, defaulting to false if not provided
});

// Schema for validating transaction creation/update input
export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]), // Must be either "INCOME" or "EXPENSE"
    amount: z.string().min(1, "Amount is required"), // Amount must be a non-empty string (you can convert to number later)
    description: z.string().optional(),   // Optional description field
    date: z.date({ required_error: "Date is required" }), // Required date field
    accountId: z.string().min(1, "Account is required"), // Must be a valid string (usually a UUID)
    category: z.string().min(1, "Category is required"), // Category must be a non-empty string
    isRecurring: z.boolean().default(false), // Optional boolean, defaults to false
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]) // If recurring, one of these intervals is allowed
      .optional(), // This field is optional (conditionally required below)
  })
  .superRefine((data, ctx) => {
    // Custom validation to ensure recurringInterval is provided if isRecurring is true
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"], // Targeted field for the validation error
      });
    }
  });
