import { getExpenses } from "@/actions/expense.actions";
import { getFinancialMetrics, formatCurrency } from "@/services/financial.service";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ReceiptText, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Plus
} from "lucide-react";
import Link from "next/link";
import { AddExpenseDialog } from "./components/AddExpenseDialog";
import { EditExpenseDialog } from "./components/EditExpenseDialog";
import { ExpenseFilters } from "./components/ExpenseFilters";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { Status } from "@/types/enums";

export const metadata = {
  title: "Expenses | GymOS",
  description: "Track the money your gym spends.",
};

export default async function ExpensesPage(props: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    datePreset?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1", 10);

  const now = new Date();
  const [gym, expensesData, todayAgg, monthAgg] = await Promise.all([
    prisma.gym.findFirst(),
    getExpenses({
      search: searchParams.search,
      category: searchParams.category as any,
      datePreset: searchParams.datePreset as any,
      page,
      limit: 15,
    }),
    prisma.expense.aggregate({
      where: {
        status: Status.ACTIVE,
        expenseDate: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        status: Status.ACTIVE,
        expenseDate: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
      _sum: { amount: true },
    }),
  ]);

  const currency = gym?.currency || "USD";
  const expenses = expensesData.expenses || [];
  const total = expensesData.total || 0;
  const totalPages = expensesData.totalPages || 1;
  const todayTotal = todayAgg._sum.amount || 0;
  const monthTotal = monthAgg._sum.amount || 0;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track and monitor the operational money your gym spends.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddExpenseDialog currency={currency} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-purple-100 bg-purple-50/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              This Month's Spending
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(monthTotal, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Current calendar month</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/30 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today's Expenses
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(todayTotal, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Logged today</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/30 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Recorded
            </CardTitle>
            <ReceiptText className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Expense entries recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ExpenseFilters />

      {/* Expenses Table */}
      <div className="bg-white rounded-lg border shadow-xs overflow-hidden">
        {expenses.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <ReceiptText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No expenses recorded</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No gym expense records match your selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b text-xs uppercase font-medium text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-xs font-medium">
                        {exp.category}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-900">{exp.description}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-purple-700">
                        -{formatCurrency(exp.amount, currency)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                      {exp.reference || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <EditExpenseDialog expense={exp} currency={currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground bg-gray-50/50">
            <span>
              Page {page} of {totalPages} ({total} total expenses)
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/dashboard/expenses?page=${page - 1}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                  </Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/dashboard/expenses?page=${page + 1}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
