"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Wallet,
  Receipt,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { Project, Expense, ProjectDeveloper } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type PeriodType = "month" | "quarter" | "ytd" | "custom";

export default function FinancialsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseFormData, setExpenseFormData] = useState({
    project_id: "none",
    category: "",
    amount: "",
    spent_at: new Date().toISOString().split("T")[0],
    vendor: "",
    note: "",
  });

  // Fetch data
  const { data: projects = [], mutate: mutateProjects } = useSWR<Project[]>(
    "/api/projects",
    fetcher
  );
  const { data: expenses = [], mutate: mutateExpenses } = useSWR<Expense[]>(
    periodType === "custom" && customStartDate && customEndDate
      ? `/api/expenses?startDate=${customStartDate}&endDate=${customEndDate}`
      : "/api/expenses",
    fetcher
  );

  // Fetch all developers
  const { data: allDevelopers = [] } = useSWR<
    Array<
      ProjectDeveloper & {
        project?: {
          id: string;
          name: string;
          client?: { id: string; name: string } | null;
        } | null;
      }
    >
  >("/api/developers", fetcher);

  // Calculate date range based on period type
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (periodType) {
      case "month":
        const [year, month] = selectedMonth.split("-").map(Number);
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0, 23, 59, 59, 999);
        break;
      case "quarter":
        const quarter = Number.parseInt(selectedQuarter[1]);
        const quarterStartMonth = (quarter - 1) * 3;
        start = new Date(selectedYear, quarterStartMonth, 1);
        end = new Date(selectedYear, quarterStartMonth + 3, 0, 23, 59, 59, 999);
        break;
      case "ytd":
        start = new Date(selectedYear, 0, 1);
        end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
        } else {
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        }
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
    }

    return { start, end };
  }, [
    periodType,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    customStartDate,
    customEndDate,
  ]);

  // Filter expenses and payments by date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.spent_at);
      return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
    });
  }, [expenses, dateRange]);

  // Separate general expenses from project expenses
  const generalExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => !e.project_id);
  }, [filteredExpenses]);

  const projectExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => e.project_id);
  }, [filteredExpenses]);

  // Calculate total developer costs
  const totalDeveloperCosts = useMemo(() => {
    return allDevelopers.reduce((sum, dev) => sum + dev.amount, 0);
  }, [allDevelopers]);

  // Group developers by project
  const developersByProject = useMemo(() => {
    const grouped: Record<
      string,
      Array<
        ProjectDeveloper & {
          project?: {
            id: string;
            name: string;
            client?: { id: string; name: string } | null;
          } | null;
        }
      >
    > = {};
    allDevelopers.forEach((dev) => {
      if (dev.project_id) {
        if (!grouped[dev.project_id]) {
          grouped[dev.project_id] = [];
        }
        grouped[dev.project_id].push(dev);
      }
    });
    return grouped;
  }, [allDevelopers]);

  // Get payments from projects (using amount_paid and payment_date)
  const payments = useMemo(() => {
    const allPayments: Array<{
      id: string;
      project_id: string;
      project_name: string;
      client_name: string;
      amount: number;
      date: string;
    }> = [];

    projects.forEach((project) => {
      if (project.payment_date) {
        const paymentDate = new Date(project.payment_date);
        if (paymentDate >= dateRange.start && paymentDate <= dateRange.end) {
          allPayments.push({
            id: project.id,
            project_id: project.id,
            project_name: project.name,
            client_name: (project.clients?.name || "Unknown") as string,
            amount: project.amount_paid || 0,
            date: project.payment_date,
          });
        }
      }
    });

    return allPayments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [projects, dateRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const income = payments.reduce((sum, p) => sum + p.amount, 0);
    const expensesTotal = filteredExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const netProfit = income - expensesTotal;
    const outstandingReceivables = projects
      .filter((p) => p.status !== "cancelled")
      .reduce((sum, p) => {
        const projectPrice = p.revenue || 0;
        const totalPaid = p.amount_paid || 0;
        return sum + Math.max(0, projectPrice - totalPaid);
      }, 0);

    return {
      income,
      expenses: expensesTotal,
      netProfit,
      outstandingReceivables,
    };
  }, [payments, filteredExpenses, projects]);

  // Prepare chart data (monthly breakdown)
  const chartData = useMemo(() => {
    const months: Record<
      string,
      { month: string; income: number; expenses: number; profit: number }
    > = {};

    // Initialize months in range
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      const monthKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthLabel = current.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthLabel,
          income: 0,
          expenses: 0,
          profit: 0,
        };
      }
      current.setMonth(current.getMonth() + 1);
    }

    // Add income
    payments.forEach((payment) => {
      const paymentDate = new Date(payment.date);
      const monthKey = `${paymentDate.getFullYear()}-${String(
        paymentDate.getMonth() + 1
      ).padStart(2, "0")}`;
      if (months[monthKey]) {
        months[monthKey].income += payment.amount;
      }
    });

    // Add expenses
    filteredExpenses.forEach((expense) => {
      const expenseDate = new Date(expense.spent_at);
      const monthKey = `${expenseDate.getFullYear()}-${String(
        expenseDate.getMonth() + 1
      ).padStart(2, "0")}`;
      if (months[monthKey]) {
        months[monthKey].expenses += expense.amount;
      }
    });

    // Calculate profit
    Object.keys(months).forEach((key) => {
      months[key].profit = months[key].income - months[key].expenses;
    });

    return Object.values(months).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [payments, filteredExpenses, dateRange]);

  const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--chart-1))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-2))",
    },
    profit: {
      label: "Profit",
      color: "hsl(var(--chart-3))",
    },
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        project_id:
          expenseFormData.project_id === "none"
            ? null
            : expenseFormData.project_id,
        category: expenseFormData.category,
        amount: Number.parseFloat(expenseFormData.amount),
        spent_at: expenseFormData.spent_at,
        vendor: expenseFormData.vendor || null,
        note: expenseFormData.note || null,
      };

      const url = editingExpenseId
        ? `/api/expenses/${editingExpenseId}`
        : "/api/expenses";
      const method = editingExpenseId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save expense");
      }

      toast({
        title: `Expense ${
          editingExpenseId ? "updated" : "created"
        } successfully`,
      });
      mutateExpenses();
      setExpenseDialogOpen(false);
      setEditingExpenseId(null);
      setExpenseFormData({
        project_id: "none",
        category: "",
        amount: "",
        spent_at: new Date().toISOString().split("T")[0],
        vendor: "",
        note: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setExpenseFormData({
      project_id: expense.project_id || "none",
      category: expense.category,
      amount: expense.amount.toString(),
      spent_at: expense.spent_at,
      vendor: expense.vendor || "",
      note: expense.note || "",
    });
    setExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      toast({
        title: "Expense deleted successfully",
      });
      mutateExpenses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Financials</h1>
            <p className="text-muted-foreground mt-1">
              Track income, expenses, and profitability
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingExpenseId(null);
            setExpenseFormData({
              project_id: "none",
              category: "",
              amount: "",
              spent_at: new Date().toISOString().split("T")[0],
              vendor: "",
              note: "",
            });
            setExpenseDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Period Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Period Type</Label>
              <Select
                value={periodType}
                onValueChange={(value) => setPeriodType(value as PeriodType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodType === "month" && (
              <div className="space-y-2">
                <Label>Month</Label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            )}

            {periodType === "quarter" && (
              <>
                <div className="space-y-2">
                  <Label>Quarter</Label>
                  <Select
                    value={selectedQuarter}
                    onValueChange={setSelectedQuarter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={selectedYear}
                    onChange={(e) =>
                      setSelectedYear(Number.parseInt(e.target.value))
                    }
                  />
                </div>
              </>
            )}

            {periodType === "ytd" && (
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(Number.parseInt(e.target.value))
                  }
                />
              </div>
            )}

            {periodType === "custom" && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              RM
              {kpis.income.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total payments received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              RM
              {kpis.expenses.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Total expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {kpis.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                kpis.netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              RM
              {kpis.netProfit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Receivables
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              RM
              {kpis.outstandingReceivables.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Unpaid project amounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Monthly comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) => `RM${(value / 1000).toFixed(0)}K`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0)
                        return null;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            {payload.map((entry: any, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm">
                                  {entry.name === "income"
                                    ? "Income"
                                    : "Expenses"}
                                  : RM{entry.value?.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="var(--color-income)" />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit by Month</CardTitle>
            <CardDescription>Monthly profit trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) => `RM${(value / 1000).toFixed(0)}K`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0)
                        return null;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: payload[0]?.color }}
                              />
                              <span className="text-sm">
                                Profit: RM{payload[0]?.value?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="var(--color-profit)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              Payments received in selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.length > 0 ? (
                payments.slice(0, 10).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{payment.project_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.client_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        RM
                        {payment.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No payments in this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Expenses in selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* General Expenses Section */}
              {generalExpenses.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">General Expenses</Badge>
                    <p className="text-sm text-muted-foreground">
                      Total: RM
                      {generalExpenses
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {generalExpenses.slice(0, 5).map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-950"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{expense.category}</p>
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-100 dark:bg-blue-900"
                            >
                              General
                            </Badge>
                          </div>
                          {expense.vendor && (
                            <p className="text-sm text-muted-foreground">
                              {expense.vendor}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(expense.spent_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-semibold text-red-600">
                              RM
                              {expense.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Expenses Section */}
              {projectExpenses.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Project Expenses</Badge>
                    <p className="text-sm text-muted-foreground">
                      Total: RM
                      {projectExpenses
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {projectExpenses.slice(0, 5).map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{expense.category}</p>
                            {expense.project && (
                              <Badge variant="outline" className="text-xs">
                                {expense.project.name}
                              </Badge>
                            )}
                          </div>
                          {expense.vendor && (
                            <p className="text-sm text-muted-foreground">
                              {expense.vendor}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(expense.spent_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-semibold text-red-600">
                              RM
                              {expense.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredExpenses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No expenses in this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingExpenseId ? "Edit" : "Add"} Expense
            </DialogTitle>
            <DialogDescription>
              Record an expense for tracking financials
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">Project (Optional)</Label>
                <Select
                  value={expenseFormData.project_id}
                  onValueChange={(value) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      project_id: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      No Project (General Expense)
                    </SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={expenseFormData.category}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      category: e.target.value,
                    })
                  }
                  placeholder="e.g., Office Supplies, Travel, Software"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (RM) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={expenseFormData.amount}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      amount: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spent_at">Date *</Label>
                <Input
                  id="spent_at"
                  type="date"
                  value={expenseFormData.spent_at}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      spent_at: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor (Optional)</Label>
                <Input
                  id="vendor"
                  value={expenseFormData.vendor}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      vendor: e.target.value,
                    })
                  }
                  placeholder="Vendor name"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input
                  id="note"
                  value={expenseFormData.note}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      note: e.target.value,
                    })
                  }
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setExpenseDialogOpen(false);
                  setEditingExpenseId(null);
                  setExpenseFormData({
                    project_id: "none",
                    category: "",
                    amount: "",
                    spent_at: new Date().toISOString().split("T")[0],
                    vendor: "",
                    note: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingExpenseId ? "Update" : "Create"} Expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
