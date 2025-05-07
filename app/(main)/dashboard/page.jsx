// Import Suspense for potential lazy-loading (though not used directly here)
import { Suspense } from "react";

// Import server-side functions to fetch user-related data
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";

// UI Components
import { AccountCard } from "./_components/account-card";          // Displays each account
import { CreateAccountDrawer } from "@/components/create-account-drawer"; // Drawer for adding new accounts
import { BudgetProgress } from "./_components/budget-progress";    // Budget progress bar
import { Card, CardContent } from "@/components/ui/card";          // UI card layout
import { Plus } from "lucide-react";                               // Plus icon
import { DashboardOverview } from "./_components/transaction-overview"; // Shows account summary + recent transactions

// Async Server Component for rendering dashboard
export default async function DashboardPage() {
  // Fetch accounts and transactions concurrently
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),     // Get all accounts belonging to the current user
    getDashboardData(),    // Get all transactions for the user
  ]);

  // Identify the default account from user's list of accounts
  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Fetch current month's budget only if a default account is found
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id); // Budget info for default account
  }

  // JSX render block
  return (
    <div className="space-y-8">
      {/* Show progress bar for budget if data is available */}
      <BudgetProgress
        initialBudget={budgetData?.budget}                  // Planned budget
        currentExpenses={budgetData?.currentExpenses || 0}  // Actual spending
      />

      {/* Transaction and balance summary section */}
      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />

      {/* Grid of accounts including "Add New" card */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Create account drawer opens when this card is clicked */}
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" /> {/* Plus icon */}
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {/* Render cards for each user account */}
        {accounts.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
}
