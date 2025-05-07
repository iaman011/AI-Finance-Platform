"use client"; // Enables client-side rendering for this component in Next.js

// Importing icons from the lucide-react library
import { ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";

// Importing the Switch component (toggle) from the UI library
import { Switch } from "@/components/ui/switch";

// Importing Badge component (though not used in this file)
import { Badge } from "@/components/ui/badge";

// React hook for side effects
import { useEffect } from "react";

// Custom hook to perform fetch-like API calls
import useFetch from "@/hooks/use-fetch";

// Importing UI components for card layout
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Next.js Link component for client-side navigation
import Link from "next/link";

// Function to update the default account (API call)
import { updateDefaultAccount } from "@/actions/account";

// Toast notifications for user feedback
import { toast } from "sonner";

// Main AccountCard component, receives `account` as a prop
export function AccountCard({ account }) {
  // Destructuring account properties
  const { name, type, balance, id, isDefault } = account;

  // Initializing the custom useFetch hook with the updateDefaultAccount function
  const {
    loading: updateDefaultLoading, // loading state
    fn: updateDefaultFn,           // function to call the API
    data: updatedAccount,          // data returned after success
    error,                         // error if any
  } = useFetch(updateDefaultAccount);

  // Handler function when the Switch toggle is clicked
  const handleDefaultChange = async (event) => {
    event.preventDefault(); // Prevents default link behavior

    if (isDefault) {
      // Don't allow user to unset the only default account
      toast.warning("You need atleast 1 default account");
      return;
    }

    // Call the API to set this account as default
    await updateDefaultFn(id);
  };

  // Side effect to show success toast if the update is successful
  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  // Side effect to show error toast if the update fails
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  // Render the card UI for the account
  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      {/* Wrap entire card with Link to the account details page */}
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Display account name */}
          <CardTitle className="text-sm font-medium capitalize">
            {name}
          </CardTitle>

          {/* Toggle switch for setting default account */}
          <Switch
            checked={isDefault} // toggle state
            onClick={handleDefaultChange} // handler
            disabled={updateDefaultLoading} // disable when loading
          />
        </CardHeader>

        {/* Card body showing account balance and type */}
        <CardContent>
          <div className="text-2xl font-bold">
            ${parseFloat(balance).toFixed(2)} {/* Format balance */}
          </div>
          <p className="text-xs text-muted-foreground">
            {/* Capitalize type and append "Account" */}
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>

        {/* Card footer showing static income/expense labels with icons */}
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
