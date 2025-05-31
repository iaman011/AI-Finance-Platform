"use client"; // Enables React Server Components to work with client-side interactivity

// Import React hooks
import { useState, useEffect } from "react";
// Import icons from lucide-react
import { Pencil, Check, X } from "lucide-react";
// Import a custom hook to perform async fetch logic
import useFetch from "@/hooks/use-fetch";
// Toast notification library for success/error messages
import { toast } from "sonner";

// Import UI components from your design system
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Import the action function to update the budget on the server
import { updateBudget } from "@/actions/budget";

// Main component that takes `initialBudget` and `currentExpenses` as props
export function BudgetProgress({ initialBudget, currentExpenses }) {
  // State to toggle edit mode
  const [isEditing, setIsEditing] = useState(false);
  // State to hold the input value when editing the budget
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || "" // Convert initial amount to string if available
  );

  // Use the custom fetch hook with the `updateBudget` function
  const {
    loading: isLoading, // Indicates if update is in progress
    fn: updateBudgetFn, // Function to trigger the update
    data: updatedBudget, // Contains response data from the update
    error, // Contains error info if update fails
  } = useFetch(updateBudget);

  // Calculate how much of the budget has been used as a percentage
  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  // Function to handle budget update
  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget); // Convert input to float

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount"); // Show error for invalid input
      return;
    }

    await updateBudgetFn(amount); // Call update function
  };

  // Function to cancel editing and reset value
  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || ""); // Reset input value
    setIsEditing(false); // Exit edit mode
  };

  // Side effect: when update is successful
  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false); // Exit edit mode
      toast.success("Budget updated successfully"); // Show success message
    }
  }, [updatedBudget]);

  // Side effect: if an error occurred during update
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget"); // Show error message
    }
  }, [error]);

  // Component JSX return
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium">
            Monthly Budget (Default Account) {/* Budget title */}
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {isEditing ? ( // If editing mode is on
              <div className="flex items-center gap-2">
                <Input
                  type="number" // Only allow number input
                  value={newBudget} // Controlled input bound to state
                  onChange={(e) => setNewBudget(e.target.value)} // Update state on change
                  className="w-32"
                  placeholder="Enter amount"
                  autoFocus
                  disabled={isLoading} // Disable while loading
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget} // Submit update
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 text-green-500" /> {/* Check icon */}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel} // Cancel editing
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 text-red-500" /> {/* Cancel icon */}
                </Button>
              </div>
            ) : ( // If not editing
              <>
                <CardDescription>
                  {initialBudget
                    ? `$${currentExpenses.toFixed(
                        2
                      )} of $${initialBudget.amount.toFixed(2)} spent`
                    : "No budget set"} {/* Display spent vs total */}
                </CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)} // Enter edit mode
                  className="h-6 w-6"
                >
                  <Pencil className="h-3 w-3" /> {/* Edit icon */}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {initialBudget && ( // Show progress only if budget is set
          <div className="space-y-2">
            <Progress
              value={percentUsed} // Progress bar based on percentage
              extraStyles={`${
                // Dynamically color progress bar
                percentUsed >= 90
                  ? "bg-red-500" // Danger zone
                  : percentUsed >= 75
                    ? "bg-yellow-500" // Warning zone
                    : "bg-green-500" // Safe zone
              }`}
            />
            <p className="text-xs text-muted-foreground text-right">
              {percentUsed.toFixed(1)}% used {/* Show percentage */}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
