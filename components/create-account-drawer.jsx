// Enable React Client Component mode (for interactivity and hooks)
"use client";

// React hooks
import { useState, useEffect } from "react";

// React Hook Form for form handling
import { useForm } from "react-hook-form";

// Zod resolver for validating schema using Zod
import { zodResolver } from "@hookform/resolvers/zod";

// Loading spinner icon
import { Loader2 } from "lucide-react";

// Custom hook for handling fetch logic (loading, error, etc.)
import useFetch from "@/hooks/use-fetch";

// Toast notifications
import { toast } from "sonner";

// Button component from your UI library
import { Button } from "@/components/ui/button";

// Drawer UI components for sliding panel behavior
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";

// Input field component
import { Input } from "@/components/ui/input";

// Select dropdown UI components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Switch toggle component
import { Switch } from "@/components/ui/switch";

// Server action to create an account
import { createAccount } from "@/actions/dashboard";

// Zod schema for account form validation
import { accountSchema } from "@/app/lib/schema";

// Main component for creating a new account using a drawer UI
export function CreateAccountDrawer({ children }) {
  // State to control drawer open/close
  const [open, setOpen] = useState(false);  //for drawer on dashboard

  // Setup form with validation and default values using useForm
  const {
    register, // Hook for registering input fields
    handleSubmit, // Function to handle form submit
    formState: { errors }, // Form validation errors
    setValue, // Programmatically set form field values
    watch, // Watch form field values (e.g. for isDefault toggle)
    reset, // Reset form after submission
  } = useForm({
    resolver: zodResolver(accountSchema), // Apply schema validation
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  // Custom hook to handle account creation request
  const {
    loading: createAccountLoading, // Boolean flag for loading state
    fn: createAccountFn, // The actual function to call createAccount
    error, // Error object from the request
    data: newAccount, // Data returned from successful request
  } = useFetch(createAccount);

  // Handler function called on form submission
  const onSubmit = async (data) => {
    await createAccountFn(data); // Trigger account creation
  };

  // Run when new account is created successfully
  useEffect(() => {
    if (newAccount) {
      toast.success("Account created successfully"); // Show success message
      reset(); // Reset form fields
      setOpen(false); // Close drawer
    }
  }, [newAccount, reset]);

  // Run if there is an error during creation
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to create account"); // Show error message
    }
  }, [error]);

  return (
    // Drawer component for showing the form in a sliding panel
    <Drawer open={open} onOpenChange={setOpen}>
      {/* Button or element that triggers the drawer */}
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      {/* Content of the drawer */}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Account</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4">
          {/* Form to create new account */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Account name field */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Account Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Main Checking"
                {...register("name")} // Register input to form
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p> // Show validation error
              )}
            </div>

            {/* Account type select field */}
            <div className="space-y-2">
              <label
                htmlFor="type"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Account Type
              </label>
              <Select
                onValueChange={(value) => setValue("type", value)} // Update form value
                defaultValue={watch("type")} // Set default from form
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Balance input field */}
            <div className="space-y-2">
              <label
                htmlFor="balance"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Initial Balance
              </label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-sm text-red-500">{errors.balance.message}</p>
              )}
            </div>

            {/* Switch for marking account as default */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <label
                  htmlFor="isDefault"
                  className="text-base font-medium cursor-pointer"
                >
                  Set as Default
                </label>
                <p className="text-sm text-muted-foreground">
                  This account will be selected by default for transactions
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={watch("isDefault")} // Get current value
                onCheckedChange={(checked) => setValue("isDefault", checked)} // Update form value
              />
            </div>

            {/* Submit and cancel buttons */}
            <div className="flex gap-4 pt-4">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>

              <Button
                type="submit"
                className="flex-1"
                disabled={createAccountLoading}
              >
                {createAccountLoading ? (  //using ternary operator
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
