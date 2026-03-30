"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import type React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  Mail,
  Phone,
  User as UserIcon,
  Target,
  BarChart3,
  AlertTriangle,
  FileText,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  X,
  FolderKanban,
  Shield,
  LogOut,
  GanttChart,
  ListChecks,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Search,
  Loader2,
} from "lucide-react";
import type {
  RevenueTarget,
  Client,
  Project,
  KPI,
  Risk,
  Developer,
  User,
  Task,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { UrgentRisksNotification } from "@/components/urgent-risks-notification";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

function ProjectMilestoneProgress({ projectId }: { projectId: string }) {
  const { data: milestones } = useSWR<any[]>(
    projectId ? `/api/projects/${projectId}/milestones` : null,
    fetcher,
  );

  const total = milestones?.length ?? 0;
  const completed = (milestones ?? []).filter(
    (m) => m?.status === "completed",
  ).length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Milestone Completion</span>
        <span
          className={
            total > 0 ? "text-muted-foreground" : "text-muted-foreground"
          }
        >
          {milestones ? `${percentage.toFixed(1)}%` : "—"}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${
            total > 0 && completed === total ? "bg-green-500" : "bg-primary"
          }`}
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function AdminPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    | "revenue"
    | "clients"
    | "projects"
    | "risks"
    | "financials"
    | "users"
    | "tasks"
  >("revenue");
  const [sharedYear, setSharedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast({ title: "Logged out successfully" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  // Handle tab from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "revenue",
        "clients",
        "projects",
        "risks",
        "financials",
        "users",
        "tasks",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="p-8 space-y-6">
      <UrgentRisksNotification />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-balance">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">
              Manage all data for the Alogza 2026 Plan Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Year:</Label>
            <Select
              value={sharedYear.toString()}
              onValueChange={(value) => setSharedYear(Number.parseInt(value))}
            >
              <SelectTrigger className="w-32 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => currentYear - 2 + i).map(
                  (year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>{user.name}</span>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/admin/dashboard")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View KPI Dashboard
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {[
          { id: "revenue", label: "Revenue Targets" },
          { id: "clients", label: "Clients" },
          { id: "projects", label: "Projects" },
          { id: "risks", label: "Risks" },
          { id: "financials", label: "Financials" },
          { id: "users", label: "Users" },
          { id: "tasks", label: "Tasks" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "revenue" && (
        <RevenueTargetManager
          toast={toast}
          selectedYear={sharedYear}
          onYearChange={setSharedYear}
        />
      )}
      {activeTab === "clients" && <ClientManager toast={toast} />}
      {activeTab === "projects" && (
        <ProjectManager toast={toast} selectedYear={sharedYear} />
      )}
      {activeTab === "risks" && <RiskManager toast={toast} />}
      {activeTab === "users" && <UserManager toast={toast} />}
      {activeTab === "tasks" && <TaskManager toast={toast} />}
      {activeTab === "financials" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
              <CardDescription>
                Track income, expenses, and profitability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/admin/financials")}
                size="lg"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Open Financials Page
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                View detailed financial reports, KPI cards, charts, and manage
                expenses.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function RevenueTargetManager({
  toast,
  selectedYear: yearFromHeader,
  onYearChange,
}: {
  toast: any;
  selectedYear: number;
  onYearChange?: (year: number) => void;
}) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const selectedYear = yearFromHeader || currentYear;
  const { data: yearTargets, error: yearError } = useSWR<any[]>(
    "/api/year-targets",
    fetcher,
  );
  const { data: revenues, error } = useSWR<any[]>(
    "/api/revenue-targets",
    fetcher,
  );
  const [yearTargetOpen, setYearTargetOpen] = useState(false);
  const [monthTargetOpen, setMonthTargetOpen] = useState(false);
  const [editingMonthId, setEditingMonthId] = useState<string | null>(null);
  const [yearFormData, setYearFormData] = useState({
    minimum_amount: "",
    target_amount: "",
    actual_amount: "",
  });
  const [monthFormData, setMonthFormData] = useState({
    month: "",
    target_amount: "",
    actual_amount: "",
  });

  const currentYearTarget = yearTargets?.find(
    (yt: any) => yt.year === selectedYear,
  );

  const handleYearTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Don't send actual_amount - it's calculated automatically from payments
    const data = {
      year: selectedYear,
      minimum_amount: Number.parseFloat(yearFormData.minimum_amount),
      target_amount: Number.parseFloat(yearFormData.target_amount),
      // actual_amount is calculated automatically from payments
    };

    try {
      const response = await fetch("/api/year-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      toast({
        title: `Year target ${
          currentYearTarget ? "updated" : "created"
        } successfully. Quarterly targets have been automatically created.`,
      });
      mutate("/api/year-targets");
      mutate("/api/revenue-targets");
      setYearTargetOpen(false);
      setYearFormData({
        minimum_amount: "",
        target_amount: "",
        actual_amount: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMonthTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      month: `${selectedYear}-${monthFormData.month.padStart(2, "0")}-01`,
      target_amount: Number.parseFloat(monthFormData.target_amount),
      actual_amount: Number.parseFloat(monthFormData.actual_amount) || 0,
    };

    try {
      const url = editingMonthId
        ? `/api/revenue-targets/${editingMonthId}`
        : "/api/revenue-targets";
      const method = editingMonthId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      toast({
        title: `Month target ${
          editingMonthId ? "updated" : "created"
        } successfully`,
      });
      mutate("/api/revenue-targets");
      setMonthTargetOpen(false);
      setEditingMonthId(null);
      setMonthFormData({ month: "", target_amount: "", actual_amount: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditYearTarget = () => {
    if (currentYearTarget) {
      setYearFormData({
        minimum_amount: currentYearTarget.minimum_amount.toString(),
        target_amount: (
          currentYearTarget.maximum_amount || currentYearTarget.minimum_amount
        ).toString(),
        actual_amount: currentYearTarget.actual_amount.toString(),
      });
    }
    setYearTargetOpen(true);
  };

  const handleEditMonthTarget = (revenue: RevenueTarget) => {
    setEditingMonthId(revenue.id);
    const [year, month] = revenue.month.split("-");
    setMonthFormData({
      month: month,
      target_amount: revenue.target_amount.toString(),
      actual_amount: revenue.actual_amount.toString(),
    });
    setMonthTargetOpen(true);
  };

  const handleDeleteMonthTarget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this month target?")) return;
    try {
      const response = await fetch(`/api/revenue-targets/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast({ title: "Month target deleted successfully" });
      mutate("/api/revenue-targets");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter monthly targets for selected year
  const monthlyTargets =
    revenues?.filter((r: any) => {
      const revenueYear = new Date(r.month).getFullYear();
      return revenueYear === selectedYear;
    }) || [];

  if (error || yearError)
    return <div className="text-destructive">Failed to load targets</div>;
  if (!revenues || !yearTargets) return <div>Loading...</div>;

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="space-y-6">
      {/* Year Target Card */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">
              {selectedYear} Year Targets
            </CardTitle>
            <CardDescription>
              Set revenue target for the year. Quarterly targets will be
              automatically created.
            </CardDescription>
          </div>
          <Button
            onClick={handleEditYearTarget}
            variant={currentYearTarget ? "outline" : "default"}
          >
            {currentYearTarget ? (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Year Target
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Set Year Target
              </>
            )}
          </Button>
        </CardHeader>
        {currentYearTarget ? (
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Minimum Target
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  RM{currentYearTarget.minimum_amount.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Target
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  RM
                  {(
                    currentYearTarget.maximum_amount ||
                    currentYearTarget.minimum_amount
                  ).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Actual Amount
                </p>
                <p className="text-2xl font-bold text-green-600">
                  RM{currentYearTarget.actual_amount.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-3">Quarterly Targets</p>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((q) => {
                  const quarterMin = currentYearTarget
                    ? currentYearTarget.minimum_amount / 4
                    : 0;
                  const quarterMax = currentYearTarget
                    ? (currentYearTarget.maximum_amount ||
                        currentYearTarget.minimum_amount) / 4
                    : 0;

                  // Calculate which quarter we're currently in
                  const currentDate = new Date();
                  const currentYear = currentDate.getFullYear();
                  const currentMonth = currentDate.getMonth() + 1; // 1-12
                  const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1; // 1-4
                  const isCurrentQuarter =
                    currentYear === selectedYear && currentQuarter === q;

                  // Calculate actual amount for this quarter
                  // Sum actual amounts from monthly targets in this quarter
                  const quarterStartMonth = (q - 1) * 3 + 1; // Q1: 1, Q2: 4, Q3: 7, Q4: 10
                  const quarterEndMonth = q * 3; // Q1: 3, Q2: 6, Q3: 9, Q4: 12

                  const quarterActual =
                    monthlyTargets
                      ?.filter((mt: any) => {
                        const mtDate = new Date(mt.month);
                        const mtYear = mtDate.getFullYear();
                        const mtMonth = mtDate.getMonth() + 1;
                        return (
                          mtYear === selectedYear &&
                          mtMonth >= quarterStartMonth &&
                          mtMonth <= quarterEndMonth
                        );
                      })
                      .reduce(
                        (sum: number, mt: any) => sum + (mt.actual_amount || 0),
                        0,
                      ) || 0;

                  // Calculate status based on progress toward target
                  let status: "low" | "medium" | "high" = "low";
                  let statusColor = "bg-red-500";
                  let statusText = "Low";
                  let statusTextColor = "text-red-700";
                  let cardBgColor = "";
                  let cardBorderColor = "";

                  // Only apply status colors to current quarter
                  if (isCurrentQuarter && quarterMax > 0) {
                    if (quarterActual >= quarterMax) {
                      // At or above target (high)
                      status = "high";
                      statusColor = "bg-green-500";
                      statusText = "High";
                      statusTextColor = "text-green-700";
                      cardBgColor = "bg-green-50";
                      cardBorderColor = "border-green-200";
                    } else if (quarterActual >= quarterMin) {
                      // Between minimum and target (medium)
                      status = "medium";
                      statusColor = "bg-yellow-500";
                      statusText = "Medium";
                      statusTextColor = "text-yellow-700";
                      cardBgColor = "bg-yellow-50";
                      cardBorderColor = "border-yellow-200";
                    } else {
                      // Below minimum (low)
                      status = "low";
                      statusColor = "bg-red-500";
                      statusText = "Low";
                      statusTextColor = "text-red-700";
                      cardBgColor = "bg-red-50";
                      cardBorderColor = "border-red-200";
                    }
                  } else {
                    // For non-current quarters, show status badge but no card color
                    if (quarterMax > 0) {
                      if (quarterActual >= quarterMax) {
                        status = "high";
                        statusColor = "bg-green-500";
                        statusText = "High";
                        statusTextColor = "text-green-700";
                      } else if (quarterActual >= quarterMin) {
                        status = "medium";
                        statusColor = "bg-yellow-500";
                        statusText = "Medium";
                        statusTextColor = "text-yellow-700";
                      } else {
                        status = "low";
                        statusColor = "bg-red-500";
                        statusText = "Low";
                        statusTextColor = "text-red-700";
                      }
                    }
                  }

                  return (
                    <Card
                      key={q}
                      className={`p-3 ${
                        isCurrentQuarter && cardBgColor
                          ? `border-2 ${cardBgColor} ${cardBorderColor} ring-2 ring-primary ring-offset-2`
                          : isCurrentQuarter
                            ? "border-2 border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                            : ""
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium">Q{q}</p>
                        <Badge
                          className={`${statusColor} ${statusTextColor} border-0 text-xs font-semibold`}
                        >
                          {statusText}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>
                          <p className="text-muted-foreground">Min</p>
                          <p className="font-semibold text-orange-600">
                            RM
                            {quarterMin.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Max</p>
                          <p className="font-semibold text-blue-600">
                            RM
                            {quarterMax.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="pt-1 border-t">
                          <p className="text-muted-foreground">Actual</p>
                          <p
                            className={`font-semibold ${
                              quarterActual >= quarterMin
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            RM
                            {quarterActual.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          {quarterMax > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {((quarterActual / quarterMax) * 100).toFixed(1)}%
                              of target
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Calculated from Year Target (Min ÷ 4 and Target ÷ 4). Actual is
                sum of monthly actual amounts in each quarter.
              </p>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-muted-foreground">
              No year targets set. Click "Set Year Target" to get started.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Year Target Dialog */}
      <Dialog open={yearTargetOpen} onOpenChange={setYearTargetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedYear} Year Target
            </DialogTitle>
            <DialogDescription className="text-base">
              Set minimum and target revenue for {selectedYear}. Monthly targets
              can be set individually, with a suggested average shown as
              reference.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleYearTargetSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Year Targets</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pl-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="minimum_amount"
                    className="text-sm font-medium"
                  >
                    Minimum (RM) *
                  </Label>
                  <Input
                    id="minimum_amount"
                    type="number"
                    step="0.01"
                    value={yearFormData.minimum_amount}
                    onChange={(e) =>
                      setYearFormData({
                        ...yearFormData,
                        minimum_amount: e.target.value,
                      })
                    }
                    placeholder="800000.00"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="target_amount"
                    className="text-sm font-medium"
                  >
                    Target (RM) *
                  </Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    value={yearFormData.target_amount}
                    onChange={(e) =>
                      setYearFormData({
                        ...yearFormData,
                        target_amount: e.target.value,
                      })
                    }
                    placeholder="1000000.00"
                    className="h-10"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Suggested monthly average: RM
                    {(
                      Number.parseFloat(yearFormData.target_amount) / 12 || 0
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="actual_amount"
                    className="text-sm font-medium"
                  >
                    Actual (RM)
                  </Label>
                  <Input
                    id="actual_amount"
                    type="number"
                    step="0.01"
                    value={yearFormData.actual_amount}
                    onChange={(e) =>
                      setYearFormData({
                        ...yearFormData,
                        actual_amount: e.target.value,
                      })
                    }
                    placeholder="Auto-calculated from payments"
                    className="h-10"
                    disabled={!!currentYearTarget}
                    readOnly={!!currentYearTarget}
                  />
                  {currentYearTarget && (
                    <p className="text-xs text-muted-foreground">
                      Actual amount is automatically calculated from project
                      payments and cannot be edited.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setYearTargetOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {currentYearTarget ? "Update" : "Create"} Year Target
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Monthly Targets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">
              {selectedYear} Monthly Targets
            </h3>
            <p className="text-sm text-muted-foreground">
              Set monthly revenue targets individually. Suggested average per
              month is shown when setting targets.
            </p>
          </div>
          <Dialog open={monthTargetOpen} onOpenChange={setMonthTargetOpen}>
            <Button
              onClick={() => {
                setEditingMonthId(null);
                setMonthFormData({
                  month: "",
                  target_amount: "",
                  actual_amount: "",
                });
                setMonthTargetOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Month Target
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {editingMonthId ? "Edit" : "Add"} Month Target
                </DialogTitle>
                <DialogDescription className="text-base">
                  Set monthly revenue target for {selectedYear}. A suggested
                  average is shown as reference.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMonthTargetSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Month Information</span>
                  </div>
                  <div className="pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="month" className="text-sm font-medium">
                        Month *
                      </Label>
                      <Select
                        value={monthFormData.month}
                        onValueChange={(value) =>
                          setMonthFormData({ ...monthFormData, month: value })
                        }
                        required
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Target Amounts</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="target_amount"
                        className="text-sm font-medium"
                      >
                        Target Amount (RM) *
                      </Label>
                      <Input
                        id="target_amount"
                        type="number"
                        step="0.01"
                        value={monthFormData.target_amount}
                        onChange={(e) =>
                          setMonthFormData({
                            ...monthFormData,
                            target_amount: e.target.value,
                          })
                        }
                        placeholder={
                          currentYearTarget
                            ? (
                                (currentYearTarget.maximum_amount ||
                                  currentYearTarget.minimum_amount) / 12
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0.00"
                        }
                        className="h-10"
                        required
                      />
                      {currentYearTarget && (
                        <p className="text-xs text-muted-foreground">
                          Suggested average: RM
                          {(
                            (currentYearTarget.maximum_amount ||
                              currentYearTarget.minimum_amount) / 12
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          (Year Target ÷ 12)
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="actual_amount"
                        className="text-sm font-medium"
                      >
                        Actual Amount (RM)
                      </Label>
                      <Input
                        id="actual_amount"
                        type="number"
                        step="0.01"
                        value={monthFormData.actual_amount}
                        onChange={(e) =>
                          setMonthFormData({
                            ...monthFormData,
                            actual_amount: e.target.value,
                          })
                        }
                        placeholder="85000.00"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMonthTargetOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingMonthId ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Update Target
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Target
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Monthly Targets Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {months.map((month) => {
            const monthTarget = monthlyTargets.find((mt: any) => {
              const mtDate = new Date(mt.month);
              return mtDate.getMonth() + 1 === Number.parseInt(month.value);
            });
            // Format month for navigation: YYYY-MM
            const monthYear = selectedYear;
            const monthNumber = Number.parseInt(month.value);
            const monthPath = `${monthYear}-${monthNumber
              .toString()
              .padStart(2, "0")}`;

            return (
              <Card
                key={month.value}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/admin/month/${monthPath}`)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    {month.label}
                  </CardTitle>
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {monthTarget && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMonthTarget(monthTarget)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDeleteMonthTarget(monthTarget.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {monthTarget ? (
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Target</p>
                        <p className="text-lg font-semibold">
                          RM{monthTarget.target_amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual</p>
                        <p className="text-lg font-semibold">
                          RM{monthTarget.actual_amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground">
                          Click to view details
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        No target set
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMonthId(null);
                          setMonthFormData({
                            month: month.value,
                            target_amount: "",
                            actual_amount: "",
                          });
                          setMonthTargetOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Set Target
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ClientManager({ toast }: { toast: any }) {
  const { data: clients, error } = useSWR<Client[]>("/api/clients", fetcher);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [clientFilters, setClientFilters] = useState({
    search: "",
    status: "all" as "all" | "active" | "inactive" | "prospective",
  });

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    contact_person: "",
    email: "",
    phone: "",
    status: "active" as "active" | "inactive" | "prospective",
    lifetime_value: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      industry: formData.industry || null,
      contact_person: formData.contact_person || null,
      email: formData.email || null,
      phone: formData.phone || null,
      status: formData.status,
      lifetime_value: Number.parseFloat(formData.lifetime_value) || 0,
    };

    try {
      const url = editingId ? `/api/clients/${editingId}` : "/api/clients";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      toast({
        title: `Client ${editingId ? "updated" : "created"} successfully`,
      });
      mutate("/api/clients");
      setOpen(false);
      setEditingId(null);
      setFormData({
        name: "",
        industry: "",
        contact_person: "",
        email: "",
        phone: "",
        status: "active",
        lifetime_value: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      industry: client.industry || "",
      contact_person: client.contact_person || "",
      email: client.email || "",
      phone: client.phone || "",
      status: client.status,
      lifetime_value: client.lifetime_value.toString(),
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      toast({ title: "Client deleted successfully" });
      mutate("/api/clients");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (error)
    return <div className="text-destructive">Failed to load clients</div>;
  if (!clients) return <div>Loading...</div>;

  const filteredClients = clients.filter((c) => {
    if (clientFilters.status !== "all" && c.status !== clientFilters.status)
      return false;
    if (clientFilters.search) {
      const q = clientFilters.search.toLowerCase();
      const haystack = [
        c.name,
        c.industry ?? "",
        c.email ?? "",
        c.contact_person ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: "",
              industry: "",
              contact_person: "",
              email: "",
              phone: "",
              status: "active",
              lifetime_value: "",
            });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingId ? "Edit" : "Add"} Client
            </DialogTitle>
            <DialogDescription className="text-base">
              Manage client information and relationship details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Company Information</span>
              </div>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Client Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Tech Solutions Inc"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">
                    Industry
                  </Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    placeholder="Technology, Finance, Healthcare..."
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>Contact Information</span>
              </div>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="contact_person"
                    className="text-sm font-medium"
                  >
                    Contact Person
                  </Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
                    }
                    placeholder="John Smith"
                    className="h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="john@company.com"
                        className="h-10 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+60123456789"
                        className="h-10 pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Business Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="prospective">Prospective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lifetime_value"
                    className="text-sm font-medium"
                  >
                    Lifetime Value (RM)
                  </Label>
                  <Input
                    id="lifetime_value"
                    type="number"
                    step="0.01"
                    value={formData.lifetime_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lifetime_value: e.target.value,
                      })
                    }
                    placeholder="250000.00"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingId ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Update Client
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-md p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client-search">Search</Label>
            <Input
              id="client-search"
              value={clientFilters.search}
              onChange={(e) =>
                setClientFilters({ ...clientFilters, search: e.target.value })
              }
              placeholder="Name / industry / email / contact"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-status">Status</Label>
            <Select
              value={clientFilters.status}
              onValueChange={(value) =>
                setClientFilters({
                  ...clientFilters,
                  status: value as any,
                })
              }
            >
              <SelectTrigger id="client-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="prospective">Prospective</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end justify-start md:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClientFilters({ search: "", status: "all" })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredClients.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No clients match your filters.
          </div>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">
                    {client.name}
                  </CardTitle>
                  <CardDescription>{client.industry}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(client)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{client.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lifetime Value</p>
                    <p className="font-medium">
                      RM{client.lifetime_value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function ProjectManager({
  toast,
  selectedYear: yearFromRevenue,
}: {
  toast: any;
  selectedYear: number;
}) {
  const currentYear = new Date().getFullYear();
  const { data: projects, error } = useSWR<Project[]>("/api/projects", fetcher);
  const { data: clients } = useSWR<Client[]>("/api/clients", fetcher);
  const { data: revenues } = useSWR<any[]>("/api/revenue-targets", fetcher);
  const { data: developers } = useSWR<Developer[]>("/api/developers", fetcher);
  const { data: users } = useSWR<User[]>("/api/users", fetcher);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch project developers when editing
  const { data: projectDevelopersData } = useSWR<any[]>(
    editingId ? `/api/projects/${editingId}/developers` : null,
    fetcher,
  );

  // Milestones & Tasks state
  const { data: milestones, mutate: mutateMilestones } = useSWR<any[]>(
    editingId ? `/api/projects/${editingId}/milestones` : null,
    fetcher,
  );
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(
    null,
  );
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null,
  );
  // Temporary milestones for new project creation
  const [tempMilestones, setTempMilestones] = useState<any[]>([]);

  // Projects filtering (Projects tab)
  const [projectFilters, setProjectFilters] = useState({
    search: "",
    status: "all" as
      | "all"
      | "prospective"
      | "potential"
      | "pending"
      | "planning"
      | "in-progress"
      | "completed"
      | "on-hold"
      | "cancelled",
    client_id: "all" as "all" | string,
  });

  // Use the year from Revenue Targets section (admin panel header)
  const selectedYear = yearFromRevenue || currentYear;

  // When opening from month page (editProjectId), we must not clear start/end month — handleEdit will set them.
  const skipNextYearEffectClear = useRef(false);

  // Update form data years when yearFromRevenue changes
  useEffect(() => {
    if (!yearFromRevenue) return;
    // Do not clear start/end month when we just loaded a project from the month page (editProjectId)
    if (skipNextYearEffectClear.current) {
      skipNextYearEffectClear.current = false;
      return;
    }
    // Update form data years to match the header year and clear months when user changes year
    setFormData((prev) => ({
      ...prev,
      start_year: yearFromRevenue.toString(),
      end_year: yearFromRevenue.toString(),
      start_month: "",
      end_month: "",
      start_date: "",
      end_date: "",
    }));
  }, [yearFromRevenue]);

  // Check for project ID from sessionStorage (from month page)
  // This useEffect needs to be after handleEdit is defined, so we'll move it later

  // Get available months for the selected year
  const availableMonths =
    revenues?.filter((r: any) => {
      const revenueYear = new Date(r.month).getFullYear();
      return revenueYear === selectedYear;
    }) || [];
  const [formData, setFormData] = useState({
    client_id: "",
    name: "",
    description: "",
    status: "prospective" as
      | "prospective"
      | "potential"
      | "pending"
      | "planning"
      | "in-progress"
      | "completed"
      | "on-hold"
      | "cancelled",
    start_month: "",
    start_year: selectedYear.toString(),
    end_month: "",
    end_year: selectedYear.toString(),
    start_date: "",
    end_date: "",
    budget: "",
    actual_cost: "",
    revenue: "",
    payments: [] as Array<{ amount: string; date: string; note?: string }>,
    progress_notes: "",
    selected_developers: [] as Array<{
      developer_id: string;
      name: string;
      role: string;
      amount: string;
    }>,
  });

  // Track previous month values to detect user changes
  const [prevStartMonth, setPrevStartMonth] = useState<string>("");
  const [prevStartYear, setPrevStartYear] = useState<string>("");
  const [prevEndMonth, setPrevEndMonth] = useState<string>("");
  const [prevEndYear, setPrevEndYear] = useState<string>("");

  // Validate and clear dates only when month selection is changed by user (not on initial load)
  useEffect(() => {
    // Only validate if month/year actually changed (user action)
    const monthChanged =
      prevStartMonth !== formData.start_month ||
      prevStartYear !== formData.start_year;

    if (
      monthChanged &&
      formData.start_month &&
      formData.start_year &&
      formData.start_date
    ) {
      const year = Number.parseInt(formData.start_year);
      const month = Number.parseInt(formData.start_month);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const selectedDate = new Date(formData.start_date);

      if (selectedDate < firstDay || selectedDate > lastDay) {
        setFormData((prev) => ({ ...prev, start_date: "" }));
      }
    } else if (monthChanged && !formData.start_month) {
      setFormData((prev) => ({ ...prev, start_date: "" }));
    }

    // Update previous values
    setPrevStartMonth(formData.start_month);
    setPrevStartYear(formData.start_year);
  }, [
    formData.start_month,
    formData.start_year,
    prevStartMonth,
    prevStartYear,
  ]);

  useEffect(() => {
    // Only validate if month/year actually changed (user action)
    const monthChanged =
      prevEndMonth !== formData.end_month || prevEndYear !== formData.end_year;

    if (
      monthChanged &&
      formData.end_month &&
      formData.end_year &&
      formData.end_date
    ) {
      const year = Number.parseInt(formData.end_year);
      const month = Number.parseInt(formData.end_month);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const selectedDate = new Date(formData.end_date);

      if (selectedDate < firstDay || selectedDate > lastDay) {
        setFormData((prev) => ({ ...prev, end_date: "" }));
      }
    } else if (monthChanged && !formData.end_month) {
      setFormData((prev) => ({ ...prev, end_date: "" }));
    }

    // Update previous values
    setPrevEndMonth(formData.end_month);
    setPrevEndYear(formData.end_year);
  }, [formData.end_month, formData.end_year, prevEndMonth, prevEndYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build dates from month/year selection or use direct date input
    // Prioritize specific dates if provided and within the selected month
    let startDate = formData.start_date;
    let endDate = formData.end_date;

    // If no specific start date but month is selected, use first day of month
    if (!startDate && formData.start_month && formData.start_year) {
      startDate = `${formData.start_year}-${formData.start_month.padStart(
        2,
        "0",
      )}-01`;
    }
    // If no specific end date but month is selected, use last day of month
    if (!endDate && formData.end_month && formData.end_year) {
      // Get last day of the month
      const lastDay = new Date(
        Number.parseInt(formData.end_year),
        Number.parseInt(formData.end_month),
        0,
      ).getDate();
      endDate = `${formData.end_year}-${formData.end_month.padStart(
        2,
        "0",
      )}-${lastDay.toString().padStart(2, "0")}`;
    }

    // Calculate total amount paid from payments array
    const totalAmountPaid = formData.payments.reduce(
      (sum, payment) => sum + Number.parseFloat(payment.amount || "0"),
      0,
    );

    // Get the latest payment date (most recent)
    const paymentDates = formData.payments
      .map((p) => p.date)
      .filter((d) => d)
      .sort()
      .reverse();
    const latestPaymentDate = paymentDates[0] || null;

    const data = {
      client_id: formData.client_id,
      name: formData.name,
      description: formData.description || null,
      status: formData.status,
      progress_notes: formData.progress_notes || null,
      start_date: startDate || null,
      end_date: endDate || null,
      budget: Number.parseFloat(formData.budget) || null,
      actual_cost: Number.parseFloat(formData.actual_cost) || 0,
      revenue: Number.parseFloat(formData.revenue) || 0,
      amount_paid: totalAmountPaid,
      payment_date: latestPaymentDate,
    };

    try {
      const url = editingId ? `/api/projects/${editingId}` : "/api/projects";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      const responseData = await response.json();
      const projectId = editingId || responseData.id;

      // Create milestones and tasks if creating a new project
      if (!editingId && tempMilestones.length > 0) {
        for (const tempMilestone of tempMilestones) {
          try {
            // Create milestone
            const milestoneResponse = await fetch(
              `/api/projects/${projectId}/milestones`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: tempMilestone.title,
                  description: tempMilestone.description || null,
                  start_date: tempMilestone.start_date || null,
                  due_date: tempMilestone.due_date || null,
                  status: tempMilestone.status || "not-started",
                  order: tempMilestone.order || 0,
                }),
              },
            );

            if (milestoneResponse.ok) {
              const createdMilestone = await milestoneResponse.json();
              const milestoneId = createdMilestone.id;

              // Create tasks for this milestone
              if (tempMilestone.tasks && tempMilestone.tasks.length > 0) {
                for (const tempTask of tempMilestone.tasks) {
                  try {
                    await fetch(`/api/milestones/${milestoneId}/tasks`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: tempTask.title,
                        description: tempTask.description || null,
                        developer_id: tempTask.developer_id,
                        priority: tempTask.priority || "medium",
                        due_date: tempTask.due_date || null,
                        estimated_hours: tempTask.estimated_hours || null,
                        project_id: projectId,
                      }),
                    });
                  } catch (error) {
                    console.error("Error creating task:", error);
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error creating milestone:", error);
          }
        }
        // Clear temp milestones after creation
        setTempMilestones([]);
      }

      if (formData.selected_developers.length > 0 && developers) {
        // Delete existing developers for this project
        if (editingId) {
          try {
            const existingDevs = await fetcher(
              `/api/projects/${editingId}/developers`,
            );
            for (const dev of existingDevs) {
              await fetch(`/api/projects/${editingId}/developers/${dev.id}`, {
                method: "DELETE",
              });
            }
          } catch (error) {
            // Ignore errors if no developers exist
          }
        }

        // Create new developer assignments
        for (const selectedDev of formData.selected_developers) {
          try {
            await fetch(`/api/projects/${projectId}/developers`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: selectedDev.name,
                role: selectedDev.role,
                amount: Number.parseFloat(selectedDev.amount) || 0,
                developer_id: selectedDev.developer_id,
              }),
            });
          } catch (error) {
            console.error("Error assigning developer:", error);
          }
        }
      }

      toast({
        title: `Project ${editingId ? "updated" : "created"} successfully`,
      });
      mutate("/api/projects");
      setOpen(false);
      setEditingId(null);
      setFormData({
        client_id: "",
        name: "",
        description: "",
        status: "prospective",
        start_month: "",
        start_year: selectedYear.toString(),
        end_month: "",
        end_year: selectedYear.toString(),
        start_date: "",
        end_date: "",
        budget: "",
        actual_cost: "",
        revenue: "",
        payments: [],
        progress_notes: "",
        selected_developers: [] as Array<{
          developer_id: string;
          name: string;
          role: string;
          amount: string;
        }>,
      });
      // Clear temp milestones
      setTempMilestones([]);
      // Reset previous values when creating new project
      setPrevStartMonth("");
      setPrevStartYear("");
      setPrevEndMonth("");
      setPrevEndYear("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);

    // Parse dates to extract month/year if available
    let startMonth = "";
    let startYear = currentYear.toString();
    let endMonth = "";
    let endYear = currentYear.toString();

    if (project.start_date) {
      const startDate = new Date(project.start_date);
      startMonth = (startDate.getMonth() + 1).toString().padStart(2, "0");
      startYear = startDate.getFullYear().toString();
    }

    if (project.end_date) {
      const endDate = new Date(project.end_date);
      endMonth = (endDate.getMonth() + 1).toString().padStart(2, "0");
      endYear = endDate.getFullYear().toString();
    }

    // Use the project's year for form data
    const projectYear = startYear
      ? Number.parseInt(startYear)
      : endYear
        ? Number.parseInt(endYear)
        : selectedYear;

    // Convert existing payment data to payments array
    // For now, if there's an existing payment, add it to the array
    const payments: Array<{ amount: string; date: string; note?: string }> = [];
    if (
      (project as any).amount_paid &&
      Number((project as any).amount_paid) > 0
    ) {
      payments.push({
        amount: (project as any).amount_paid?.toString() || "0",
        date: (project as any).payment_date || "",
        note: "",
      });
    }

    // Normalize dates to YYYY-MM-DD for DatePicker (handles ISO strings from API)
    const startDateStr = project.start_date
      ? String(project.start_date).slice(0, 10)
      : "";
    const endDateStr = project.end_date
      ? String(project.end_date).slice(0, 10)
      : "";

    const newFormData = {
      client_id: project.client_id,
      name: project.name,
      description: project.description || "",
      status: project.status as any,
      start_month: startMonth,
      start_year: startYear || projectYear.toString(),
      end_month: endMonth,
      end_year: endYear || projectYear.toString(),
      start_date: startDateStr,
      end_date: endDateStr,
      budget: project.budget?.toString() || "",
      actual_cost: project.actual_cost.toString(),
      revenue: project.revenue.toString(),
      payments: payments,
      progress_notes: (project as any).progress_notes || "",
      selected_developers: [] as Array<{
        developer_id: string;
        name: string;
        role: string;
        amount: string;
      }>,
    };

    setFormData(newFormData);

    // Set previous values to prevent clearing dates on initial load
    setPrevStartMonth(startMonth);
    setPrevStartYear(startYear || projectYear.toString());
    setPrevEndMonth(endMonth);
    setPrevEndYear(endYear || projectYear.toString());

    setOpen(true);
  };

  // Load project developers when editing and data is available
  useEffect(() => {
    if (open && editingId && projectDevelopersData && developers) {
      const loadedDevelopers = projectDevelopersData.map((pd: any) => {
        const dev = developers.find((d) => d.id === pd.developer_id);
        return {
          developer_id: pd.developer_id || "",
          name: pd.name || dev?.name || "",
          role: pd.role || "",
          amount: pd.amount?.toString() || "0",
        };
      });

      setFormData((prev) => ({
        ...prev,
        selected_developers: loadedDevelopers,
      }));
    } else if (!editingId && open) {
      // Clear developers when creating new project
      setFormData((prev) => ({
        ...prev,
        selected_developers: [],
      }));
    }
  }, [open, editingId, projectDevelopersData, developers]);

  // Check for project ID from sessionStorage (from month page)
  useEffect(() => {
    const editProjectId = sessionStorage.getItem("editProjectId");
    if (editProjectId && projects) {
      const project = projects.find((p) => p.id === editProjectId);
      if (project) {
        skipNextYearEffectClear.current = true; // so yearFromRevenue effect won't clear start/end month
        handleEdit(project);
        sessionStorage.removeItem("editProjectId");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  // Re-apply Specific Start Date and End Date from project when editing if they were cleared
  // (e.g. by effect ordering when opening from month page)
  useEffect(() => {
    if (!editingId || !open || !projects) return;
    const project = projects.find((p) => p.id === editingId);
    if (!project) return;
    const needStart =
      project.start_date &&
      (!formData.start_date || formData.start_date === "");
    const needEnd =
      project.end_date && (!formData.end_date || formData.end_date === "");
    if (!needStart && !needEnd) return;
    setFormData((prev) => ({
      ...prev,
      ...(needStart && {
        start_date: String(project.start_date!).slice(0, 10),
      }),
      ...(needEnd && { end_date: String(project.end_date!).slice(0, 10) }),
    }));
  }, [editingId, open, projects, formData.start_date, formData.end_date]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      toast({ title: "Project deleted successfully" });
      mutate("/api/projects");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (error)
    return <div className="text-destructive">Failed to load projects</div>;
  if (!projects || !revenues) return <div>Loading...</div>;

  // Get client names for projects
  const projectsWithClients = projects.map((project) => {
    const client = clients?.find((c) => c.id === project.client_id);
    return {
      ...project,
      clientName: client?.name || "Unknown",
    };
  });

  const filteredProjects = projectsWithClients.filter((p) => {
    if (projectFilters.status !== "all" && p.status !== projectFilters.status)
      return false;
    if (
      projectFilters.client_id !== "all" &&
      p.client_id !== projectFilters.client_id
    )
      return false;

    if (projectFilters.search) {
      const q = projectFilters.search.toLowerCase();
      const haystack = [p.name, p.clientName, p.description ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  // Calculate summary metrics (respect filters)
  const activeProjects = filteredProjects.filter(
    (p) => p.status === "in-progress",
  );
  const completedProjects = filteredProjects.filter(
    (p) => p.status === "completed",
  );
  const totalBudget = filteredProjects.reduce(
    (sum, p) => sum + (p.budget || 0),
    0,
  );
  const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.revenue, 0);
  const totalCost = filteredProjects.reduce((sum, p) => sum + p.actual_cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500";
      case "planning":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-500";
      case "on-hold":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-500";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate min/max dates for start_date based on selected start_month
  const getStartDateConstraints = () => {
    if (!formData.start_month || !formData.start_year) {
      return { min: "", max: "" };
    }
    const year = Number.parseInt(formData.start_year);
    const month = Number.parseInt(formData.start_month);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    return {
      min: firstDay.toISOString().split("T")[0],
      max: lastDay.toISOString().split("T")[0],
    };
  };

  // Calculate min/max dates for end_date based on selected end_month
  const getEndDateConstraints = () => {
    if (!formData.end_month || !formData.end_year) {
      return { min: "", max: "" };
    }
    const year = Number.parseInt(formData.end_year);
    const month = Number.parseInt(formData.end_month);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    return {
      min: firstDay.toISOString().split("T")[0],
      max: lastDay.toISOString().split("T")[0],
    };
  };

  const startDateConstraints = getStartDateConstraints();
  const endDateConstraints = getEndDateConstraints();

  // Milestone Dialog Component
  const MilestoneDialog = () => {
    const [milestoneFormData, setMilestoneFormData] = useState({
      title: "",
      description: "",
      start_date: "",
      due_date: "",
      status: "not-started" as
        | "not-started"
        | "in-progress"
        | "completed"
        | "on-hold",
    });

    const projectStart = formData.start_date || "";
    const projectEnd = formData.end_date || "";

    // If exact project start/end dates are missing, fall back to the selected month constraints
    // so we can still disable dates outside the selected project period.
    const projectWindowStartMin =
      projectStart || startDateConstraints.min || "";
    const projectWindowEndMax = projectEnd || endDateConstraints.max || "";

    const milestoneStartMin = projectWindowStartMin || undefined;
    const milestoneStartMax = projectWindowEndMax || undefined;

    // Due date must be within the project window, and not before milestone start.
    const milestoneDueMin = (() => {
      const ms = milestoneFormData.start_date || "";
      const base = projectWindowStartMin || "";
      if (ms && base) return ms < base ? base : ms;
      return ms || base || undefined;
    })();
    const milestoneDueMax = projectWindowEndMax || undefined;

    useEffect(() => {
      if (editingMilestoneId) {
        // Check if editing a temp milestone (for new project)
        if (!editingId && tempMilestones.length > 0) {
          const milestone = tempMilestones.find(
            (m: any) => m.tempId === editingMilestoneId,
          );
          if (milestone) {
            setMilestoneFormData({
              title: milestone.title || "",
              description: milestone.description || "",
              start_date: milestone.start_date || "",
              due_date: milestone.due_date || "",
              status: milestone.status || "not-started",
            });
            return;
          }
        }
        // Check if editing an existing milestone (for existing project)
        if (editingId && milestones) {
          const milestone = milestones.find(
            (m: any) => m.id === editingMilestoneId,
          );
          if (milestone) {
            setMilestoneFormData({
              title: milestone.title || "",
              description: milestone.description || "",
              start_date: milestone.start_date || "",
              due_date: milestone.due_date || "",
              status: milestone.status || "not-started",
            });
            return;
          }
        }
      }
      // Reset form
      setMilestoneFormData({
        title: "",
        description: "",
        start_date: "",
        due_date: "",
        status: "not-started",
      });
    }, [editingMilestoneId, milestones, editingId, tempMilestones]);

    const handleMilestoneSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Enforce milestone date bounds based on the parent project window.
      // This prevents creating milestones with dates outside the project duration.
      const start = milestoneFormData.start_date || "";
      const due = milestoneFormData.due_date || "";

      if (milestoneStartMin && start && start < milestoneStartMin) {
        toast({
          title: "Invalid Start Date",
          description:
            "Milestone start date cannot be before the project start date.",
          variant: "destructive",
        });
        return;
      }

      if (milestoneStartMax && start && start > milestoneStartMax) {
        toast({
          title: "Invalid Start Date",
          description:
            "Milestone start date cannot be after the project end date.",
          variant: "destructive",
        });
        return;
      }

      if (milestoneStartMin && due && due < milestoneStartMin) {
        toast({
          title: "Invalid Due Date",
          description:
            "Milestone due date cannot be before the project start date.",
          variant: "destructive",
        });
        return;
      }
      if (start && due && due < start) {
        toast({
          title: "Invalid Date Range",
          description:
            "Milestone due date cannot be before milestone start date.",
          variant: "destructive",
        });
        return;
      }

      if (milestoneDueMax && due && due > milestoneDueMax) {
        toast({
          title: "Invalid Due Date",
          description:
            "Milestone due date cannot be after the project end date.",
          variant: "destructive",
        });
        return;
      }

      // If creating a new project (no editingId), store in tempMilestones
      if (!editingId) {
        if (editingMilestoneId) {
          // Update existing temp milestone
          setTempMilestones((prev) =>
            prev.map((m) =>
              m.tempId === editingMilestoneId
                ? {
                    ...m,
                    ...milestoneFormData,
                    order: m.order,
                  }
                : m,
            ),
          );
        } else {
          // Create new temp milestone
          const newMilestone = {
            tempId: `temp-${Date.now()}`,
            ...milestoneFormData,
            order: tempMilestones.length,
            tasks: [],
            progress: 0,
            task_count: 0,
            completed_task_count: 0,
          };
          setTempMilestones((prev) => [...prev, newMilestone]);
        }
        toast({
          title: `Milestone ${
            editingMilestoneId ? "updated" : "created"
          } successfully`,
        });
        setMilestoneDialogOpen(false);
        setEditingMilestoneId(null);
        return;
      }

      // Existing project - save to API
      try {
        const url = editingMilestoneId
          ? `/api/milestones/${editingMilestoneId}`
          : `/api/projects/${editingId}/milestones`;
        const method = editingMilestoneId ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(milestoneFormData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to save milestone");
        }

        toast({
          title: `Milestone ${
            editingMilestoneId ? "updated" : "created"
          } successfully`,
        });
        mutateMilestones();
        setMilestoneDialogOpen(false);
        setEditingMilestoneId(null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    return (
      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMilestoneId ? "Edit" : "Create"} Milestone
            </DialogTitle>
            <DialogDescription>
              Define a project phase with tasks and timeline
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMilestoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-title">Title *</Label>
              <Input
                id="milestone-title"
                value={milestoneFormData.title}
                onChange={(e) =>
                  setMilestoneFormData({
                    ...milestoneFormData,
                    title: e.target.value,
                  })
                }
                required
                placeholder="e.g., Discovery, Design, Development"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-description">Description</Label>
              <Textarea
                id="milestone-description"
                value={milestoneFormData.description}
                onChange={(e) =>
                  setMilestoneFormData({
                    ...milestoneFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this milestone phase..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(projectStart || projectEnd) && (
                <div className="col-span-2 text-xs text-muted-foreground -mt-1">
                  Project window:{" "}
                  {projectWindowStartMin
                    ? formatDate(projectWindowStartMin)
                    : "—"}{" "}
                  -{" "}
                  {projectWindowEndMax ? formatDate(projectWindowEndMax) : "—"}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="milestone-start-date">Start Date</Label>
                <DatePicker
                  id="milestone-start-date"
                  value={milestoneFormData.start_date || undefined}
                  onChange={(date) =>
                    setMilestoneFormData({
                      ...milestoneFormData,
                      start_date: date || "",
                    })
                  }
                  placeholder="Select start date"
                  min={milestoneStartMin}
                  max={milestoneStartMax}
                  defaultMonth={milestoneStartMin}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-due-date">Due Date</Label>
                <DatePicker
                  id="milestone-due-date"
                  value={milestoneFormData.due_date || undefined}
                  onChange={(date) =>
                    setMilestoneFormData({
                      ...milestoneFormData,
                      due_date: date || "",
                    })
                  }
                  placeholder="Select due date"
                  min={milestoneDueMin}
                  max={milestoneDueMax}
                  defaultMonth={milestoneStartMin}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-status">Status</Label>
              <Select
                value={milestoneFormData.status}
                onValueChange={(value: any) =>
                  setMilestoneFormData({
                    ...milestoneFormData,
                    status: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setMilestoneDialogOpen(false);
                  setEditingMilestoneId(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingMilestoneId ? "Update" : "Create"} Milestone
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Task Dialog Component
  const TaskDialog = () => {
    const [taskFormData, setTaskFormData] = useState({
      title: "",
      description: "",
      developer_id: "",
      priority: "medium" as "low" | "medium" | "high",
      due_date: "",
      estimated_hours: "",
      actual_hours: "",
      status: "todo" as "todo" | "in-progress" | "done" | "blocked",
    });
    const [taskSubmitting, setTaskSubmitting] = useState(false);

    // Fetch project developers
    const { data: projectDevelopersData } = useSWR<any[]>(
      editingId ? `/api/projects/${editingId}/developers` : null,
      fetcher,
    );

    // Get project developers with developer details
    const projectDevelopers =
      projectDevelopersData
        ?.map((pd: any) => {
          // Try to find developer by developer_id first
          if (pd.developer_id) {
            const dev = developers?.find((d) => d.id === pd.developer_id);
            if (dev) return dev;
          }
          // Fallback: try to find by name if developer_id is not available
          if (pd.name) {
            const dev = developers?.find((d) => d.name === pd.name);
            if (dev) return dev;
          }
          // If no match found but we have developer_id, create a minimal dev object
          if (pd.developer_id) {
            return {
              id: pd.developer_id,
              name: pd.name || "Unknown",
              role: pd.role || "Developer",
            };
          }
          return null;
        })
        .filter(Boolean) || [];

    useEffect(() => {
      if (editingTaskId && selectedMilestoneId) {
        // Check if editing a temp task (for new project)
        if (!editingId && tempMilestones.length > 0) {
          const milestone = tempMilestones.find(
            (m: any) => m.tempId === selectedMilestoneId,
          );
          const task = milestone?.tasks?.find(
            (t: any) => t.tempId === editingTaskId,
          );
          if (task) {
            setTaskFormData({
              title: task.title || "",
              description: task.description || "",
              developer_id: task.developer_id || "",
              priority: task.priority || "medium",
              due_date: task.due_date || "",
              estimated_hours: task.estimated_hours?.toString() || "",
              actual_hours: task.actual_hours?.toString() || "",
              status: task.status || "todo",
            });
            return;
          }
        }
        // Check if editing an existing task (for existing project)
        if (editingId && milestones) {
          const milestone = milestones.find(
            (m: any) => m.id === selectedMilestoneId,
          );
          const task = milestone?.tasks?.find(
            (t: any) => t.id === editingTaskId,
          );
          if (task) {
            setTaskFormData({
              title: task.title || "",
              description: task.description || "",
              developer_id: task.developer_id || "",
              priority: task.priority || "medium",
              due_date: task.due_date || "",
              estimated_hours: task.estimated_hours?.toString() || "",
              actual_hours: task.actual_hours?.toString() || "",
              status: task.status || "todo",
            });
            return;
          }
        }
      }
      // Reset form
      setTaskFormData({
        title: "",
        description: "",
        developer_id: "",
        priority: "medium",
        due_date: "",
        estimated_hours: "",
        actual_hours: "",
        status: "todo",
      });
    }, [
      editingTaskId,
      milestones,
      selectedMilestoneId,
      editingId,
      tempMilestones,
    ]);

    const handleTaskSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (taskSubmitting) return;
      if (!selectedMilestoneId) return;

      setTaskSubmitting(true);
      try {
        // If creating a new project (no editingId), store in tempMilestones
        if (!editingId) {
          setTempMilestones((prev) =>
            prev.map((m) => {
              if (m.tempId === selectedMilestoneId) {
                const taskData = {
                  tempId: editingTaskId || `task-${Date.now()}`,
                  title: taskFormData.title,
                  description: taskFormData.description || "",
                  developer_id: taskFormData.developer_id,
                  priority: taskFormData.priority,
                  due_date: taskFormData.due_date || "",
                  estimated_hours: taskFormData.estimated_hours
                    ? Number.parseFloat(taskFormData.estimated_hours)
                    : null,
                  actual_hours: taskFormData.actual_hours
                    ? Number.parseFloat(taskFormData.actual_hours)
                    : 0,
                  status: taskFormData.status,
                };

                if (editingTaskId) {
                  return {
                    ...m,
                    tasks: m.tasks.map((t: any) =>
                      t.tempId === editingTaskId ? taskData : t,
                    ),
                  };
                }
                return {
                  ...m,
                  tasks: [...(m.tasks || []), taskData],
                };
              }
              return m;
            }),
          );
          toast({
            title: `Task ${editingTaskId ? "updated" : "created"} successfully`,
          });
          setTaskDialogOpen(false);
          setEditingTaskId(null);
          setSelectedMilestoneId(null);
          return;
        }

        const url = editingTaskId
          ? `/api/tasks/${editingTaskId}`
          : `/api/milestones/${selectedMilestoneId}/tasks`;
        const method = editingTaskId ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...taskFormData,
            project_id: editingId,
            estimated_hours: taskFormData.estimated_hours
              ? Number.parseFloat(taskFormData.estimated_hours)
              : null,
            actual_hours: taskFormData.actual_hours
              ? Number.parseFloat(taskFormData.actual_hours)
              : 0,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to save task");
        }

        toast({
          title: `Task ${editingTaskId ? "updated" : "created"} successfully`,
        });
        mutateMilestones();
        setTaskDialogOpen(false);
        setEditingTaskId(null);
        setSelectedMilestoneId(null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setTaskSubmitting(false);
      }
    };

    // Get milestone start date for validation
    const selectedMilestone = editingId
      ? milestones?.find((m: any) => m.id === selectedMilestoneId)
      : tempMilestones.find((m: any) => m.tempId === selectedMilestoneId);
    const minDate = selectedMilestone?.start_date || undefined;

    // Include "general" users as possible task assignees.
    // Task/developer assignment still uses `developer_id` in the DB, so we match general users by email
    // to the corresponding row in `developers`.
    const generalUserEmails = useMemo(() => {
      const s = new Set<string>();
      for (const u of users ?? []) {
        if (u.role === "general" && u.email) s.add(u.email.toLowerCase());
      }
      return s;
    }, [users]);

    const generalDevelopers = (developers ?? []).filter(
      (d) => d.email && generalUserEmails.has(d.email.toLowerCase())
    );

    // Get developers from formData.selected_developers when creating new project
    const availableDevelopersBase = editingId
      ? projectDevelopers
      : formData.selected_developers
          .map((sd) => {
            const dev = developers?.find((d) => d.id === sd.developer_id);
            return dev;
          })
          .filter(Boolean);

    // Union: project-selected developers + any developer rows linked to "general" users.
    const combinedDevelopers = (() => {
      const mapById = new Map<string, any>();
      for (const d of availableDevelopersBase) {
        if (!d) continue;
        mapById.set(d.id, d);
      }
      for (const d of generalDevelopers) mapById.set(d.id, d);

      // Keep current selection valid even if it isn't in the base lists.
      const currentId = taskFormData.developer_id;
      if (currentId && !mapById.has(currentId)) {
        const missing = developers?.find((d) => d.id === currentId);
        if (missing) mapById.set(missing.id, missing);
      }

      return Array.from(mapById.values());
    })();

    return (
      <Dialog
        open={taskDialogOpen}
        onOpenChange={(next) => {
          setTaskDialogOpen(next);
          if (!next) setTaskSubmitting(false);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              {editingTaskId ? "Edit" : "Create"} Task
            </DialogTitle>
            <DialogDescription>
              {selectedMilestone && (
                <span className="flex items-center gap-2">
                  <span>Add a task to milestone:</span>
                  <Badge variant="outline">{selectedMilestone.title}</Badge>
                </span>
              )}
              {!selectedMilestone && "Add a task to this milestone"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleTaskSubmit}
            className="space-y-6"
            aria-busy={taskSubmitting}
          >
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pb-2 border-b">
                <FileText className="h-4 w-4" />
                <span>Basic Information</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-title" className="text-sm font-medium">
                  Task Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="task-title"
                  value={taskFormData.title}
                  onChange={(e) =>
                    setTaskFormData({
                      ...taskFormData,
                      title: e.target.value,
                    })
                  }
                  required
                  placeholder="e.g., Implement user authentication"
                  className="h-10"
                  disabled={taskSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a clear, concise title for this task
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="task-description"
                  className="text-sm font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="task-description"
                  value={taskFormData.description}
                  onChange={(e) =>
                    setTaskFormData({
                      ...taskFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the task requirements, acceptance criteria, and any relevant details..."
                  rows={4}
                  className="resize-none"
                  disabled={taskSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Add detailed information about what needs to be done
                </p>
              </div>
            </div>

            {/* Assignment & Priority Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pb-2 border-b">
                <UserIcon className="h-4 w-4" />
                <span>Assignment & Priority</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="task-developer"
                    className="text-sm font-medium"
                  >
                    Assigned Developer{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  {combinedDevelopers.length === 0 ? (
                    <div className="p-3 border border-dashed rounded-md bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        No developers available. Please add developers to the
                        project first.
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={taskFormData.developer_id}
                      onValueChange={(value) =>
                        setTaskFormData({
                          ...taskFormData,
                          developer_id: value,
                        })
                      }
                      required
                      disabled={taskSubmitting}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select a developer" />
                      </SelectTrigger>
                      <SelectContent>
                        {combinedDevelopers.map((dev: any) => (
                          <SelectItem key={dev.id} value={dev.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{dev.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {dev.role}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="task-priority"
                    className="text-sm font-medium"
                  >
                    Priority
                  </Label>
                  <Select
                    value={taskFormData.priority}
                    onValueChange={(value: any) =>
                      setTaskFormData({
                        ...taskFormData,
                        priority: value,
                      })
                    }
                    disabled={taskSubmitting}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Low</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span>High</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Status & Timeline Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pb-2 border-b">
                <Calendar className="h-4 w-4" />
                <span>Status & Timeline</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={taskFormData.status}
                    onValueChange={(value: any) =>
                      setTaskFormData({
                        ...taskFormData,
                        status: value,
                      })
                    }
                    disabled={taskSubmitting}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                          <span>Todo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="in-progress">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="done">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Done</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="blocked">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span>Blocked</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="task-due-date"
                    className="text-sm font-medium"
                  >
                    Due Date
                  </Label>
                  <DatePicker
                    id="task-due-date"
                    value={taskFormData.due_date || undefined}
                    onChange={(date) =>
                      setTaskFormData({
                        ...taskFormData,
                        due_date: date || "",
                      })
                    }
                    placeholder="Select due date"
                    min={minDate}
                    className="h-10"
                    disabled={taskSubmitting}
                  />
                  {minDate && (
                    <p className="text-xs text-muted-foreground">
                      Must be after milestone start:{" "}
                      {new Date(minDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Time Tracking Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pb-2 border-b">
                <Clock className="h-4 w-4" />
                <span>Time Tracking</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="task-estimated-hours"
                    className="text-sm font-medium"
                  >
                    Estimated Hours
                  </Label>
                  <div className="relative">
                    <Input
                      id="task-estimated-hours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={taskFormData.estimated_hours}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty, decimals, and whole numbers
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setTaskFormData({
                            ...taskFormData,
                            estimated_hours: value,
                          });
                        }
                      }}
                      placeholder="0.0"
                      className="h-10 pr-10"
                      disabled={taskSubmitting}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      hrs
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estimated time to complete this task
                  </p>
                </div>
                {editingTaskId && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="task-actual-hours"
                      className="text-sm font-medium"
                    >
                      Actual Hours
                    </Label>
                    <div className="relative">
                      <Input
                        id="task-actual-hours"
                        type="number"
                        step="0.5"
                        min="0"
                        value={taskFormData.actual_hours || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setTaskFormData({
                              ...taskFormData,
                              actual_hours: value,
                            });
                          }
                        }}
                        placeholder="0.0"
                        className="h-10 pr-10"
                        disabled={taskSubmitting}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        hrs
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Actual time spent on this task
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={taskSubmitting}
                onClick={() => {
                  setTaskDialogOpen(false);
                  setEditingTaskId(null);
                  setSelectedMilestoneId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={taskSubmitting || combinedDevelopers.length === 0}
              >
                {taskSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingTaskId ? "Saving…" : "Creating…"}
                  </>
                ) : editingTaskId ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Update Task
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // If form is open, show full-screen form
  if (open) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="min-h-screen">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b backdrop-blur supports-backdrop-filter:bg-background/95">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setOpen(false);
                      setEditingId(null);
                      setFormData({
                        client_id: "",
                        name: "",
                        description: "",
                        status: "prospective",
                        start_month: "",
                        start_year: selectedYear.toString(),
                        end_month: "",
                        end_year: selectedYear.toString(),
                        start_date: "",
                        end_date: "",
                        budget: "",
                        actual_cost: "",
                        revenue: "",
                        payments: [],
                        progress_notes: "",
                        selected_developers: [] as Array<{
                          developer_id: string;
                          name: string;
                          role: string;
                          amount: string;
                        }>,
                      });
                      setTempMilestones([]);
                      setPrevStartMonth("");
                      setPrevStartYear("");
                      setPrevEndMonth("");
                      setPrevEndYear("");
                    }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold">
                      {editingId ? "Edit" : "Create"} Project
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Create and manage project details, timelines, and
                      financials
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="container mx-auto px-6 py-8 max-w-5xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Briefcase className="h-5 w-5" />
                  <span>Project Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client_id" className="text-sm font-medium">
                      Client *
                    </Label>
                    <Select
                      value={formData.client_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, client_id: value })
                      }
                      required
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Project Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Cloud Migration Project"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Describe the project scope, objectives, and key deliverables..."
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Status
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "prospective", label: "Prospective" },
                        { value: "potential", label: "Potential" },
                        { value: "pending", label: "Pending" },
                        { value: "planning", label: "Planning" },
                        { value: "in-progress", label: "In Progress" },
                        { value: "completed", label: "Completed" },
                        { value: "on-hold", label: "On Hold" },
                        { value: "cancelled", label: "Cancelled" },
                      ].map((status) => (
                        <Button
                          key={status.value}
                          type="button"
                          variant={
                            formData.status === status.value
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setFormData({
                              ...formData,
                              status: status.value as any,
                            })
                          }
                          className="h-10"
                        >
                          {status.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Assignment Section */}
              <div className="border-t pt-8 space-y-6">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Users className="h-5 w-5" />
                  <span>Developer Assignment</span>
                </div>
                <div className="pl-8 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Assign Developers to this Project
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Select developers and set their role and cost for this
                      project
                    </p>
                    {developers && developers.length > 0 ? (
                      <div className="space-y-4">
                        {/* Add Developer Button */}
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (value && value !== "none") {
                              const developer = developers.find(
                                (d) => d.id === value,
                              );
                              if (
                                developer &&
                                !formData.selected_developers.some(
                                  (sd) => sd.developer_id === developer.id,
                                )
                              ) {
                                setFormData({
                                  ...formData,
                                  selected_developers: [
                                    ...formData.selected_developers,
                                    {
                                      developer_id: developer.id,
                                      name: developer.name,
                                      role: developer.role,
                                      amount:
                                        developer.hourly_rate?.toString() ||
                                        "0",
                                    },
                                  ],
                                });
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a developer to add..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>
                              Select a developer...
                            </SelectItem>
                            {developers
                              .filter((dev) => dev.status === "active")
                              .filter(
                                (dev) =>
                                  !formData.selected_developers.some(
                                    (sd) => sd.developer_id === dev.id,
                                  ),
                              )
                              .map((developer) => (
                                <SelectItem
                                  key={developer.id}
                                  value={developer.id}
                                >
                                  {developer.name} - {developer.role}
                                  {developer.hourly_rate &&
                                    ` (RM${developer.hourly_rate.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}/hr)`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {/* Selected Developers List */}
                        {formData.selected_developers.length > 0 && (
                          <div className="space-y-3">
                            {formData.selected_developers.map(
                              (selectedDev, index) => {
                                const developer = developers.find(
                                  (d) => d.id === selectedDev.developer_id,
                                );
                                return (
                                  <div
                                    key={`${selectedDev.developer_id}-${index}`}
                                    className="p-4 border rounded-lg space-y-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium">
                                          {selectedDev.name}
                                        </p>
                                        {developer?.email && (
                                          <p className="text-xs text-muted-foreground">
                                            {developer.email}
                                          </p>
                                        )}
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          const newDevs = [
                                            ...formData.selected_developers,
                                          ];
                                          newDevs.splice(index, 1);
                                          setFormData({
                                            ...formData,
                                            selected_developers: newDevs,
                                          });
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`dev-role-${index}`}
                                          className="text-xs"
                                        >
                                          Role in this Project *
                                        </Label>
                                        <Input
                                          id={`dev-role-${index}`}
                                          value={selectedDev.role}
                                          onChange={(e) => {
                                            const newDevs = [
                                              ...formData.selected_developers,
                                            ];
                                            newDevs[index].role =
                                              e.target.value;
                                            setFormData({
                                              ...formData,
                                              selected_developers: newDevs,
                                            });
                                          }}
                                          placeholder="e.g., Lead Developer, Frontend Developer"
                                          required
                                          className="h-10"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`dev-amount-${index}`}
                                          className="text-xs"
                                        >
                                          Cost for this Project (RM) *
                                        </Label>
                                        <Input
                                          id={`dev-amount-${index}`}
                                          type="number"
                                          step="0.01"
                                          value={selectedDev.amount}
                                          onChange={(e) => {
                                            const newDevs = [
                                              ...formData.selected_developers,
                                            ];
                                            newDevs[index].amount =
                                              e.target.value;
                                            setFormData({
                                              ...formData,
                                              selected_developers: newDevs,
                                            });
                                          }}
                                          placeholder="0.00"
                                          required
                                          className="h-10"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}

                        {formData.selected_developers.length === 0 && (
                          <div className="p-4 border border-dashed rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">
                              No developers assigned. Use the dropdown above to
                              add developers.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          No developers registered. Go to the Developers tab to
                          add developers.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Tracking for Early-Stage Projects */}
              {formData.status !== "completed" &&
                formData.status !== "in-progress" && (
                  <div className="border-t pt-8 space-y-6">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Progress Tracking</span>
                    </div>
                    <div className="pl-8 space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          What have you done so far? (Select all that apply)
                        </Label>
                        <div className="space-y-3">
                          {[
                            {
                              id: "proposal",
                              label: "Did you already do a proposal?",
                            },
                            {
                              id: "meeting",
                              label: "Did you have meeting already?",
                            },
                            {
                              id: "contacted",
                              label: "Did you contact that client?",
                            },
                          ].map((option) => {
                            const isChecked = formData.progress_notes
                              .split("\n")
                              .some((line) => line.includes(option.label));
                            return (
                              <div
                                key={option.id}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`progress-${option.id}`}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const lines =
                                      formData.progress_notes.split("\n");
                                    if (e.target.checked) {
                                      // Add if not already present
                                      if (
                                        !lines.some((line) =>
                                          line.includes(option.label),
                                        )
                                      ) {
                                        setFormData({
                                          ...formData,
                                          progress_notes:
                                            formData.progress_notes.trim() +
                                            (formData.progress_notes.trim()
                                              ? "\n"
                                              : "") +
                                            `✓ ${option.label}`,
                                        });
                                      }
                                    } else {
                                      // Remove if present
                                      const filtered = lines.filter(
                                        (line) => !line.includes(option.label),
                                      );
                                      setFormData({
                                        ...formData,
                                        progress_notes: filtered.join("\n"),
                                      });
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label
                                  htmlFor={`progress-${option.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="progress_notes"
                          className="text-sm font-medium"
                        >
                          Additional Notes (or write other status)
                        </Label>
                        <Textarea
                          id="progress_notes"
                          value={formData.progress_notes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              progress_notes: e.target.value,
                            })
                          }
                          placeholder="Add any other progress notes or status updates..."
                          rows={4}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                          Track your progress with this client. Check the boxes
                          above or write custom notes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              <div className="border-t pt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Calendar className="h-5 w-5" />
                    <span>Timeline - Based on Revenue Plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="year" className="text-sm font-medium">
                      Year:
                    </Label>
                    <div className="px-3 py-2 h-11 min-w-[128px] flex items-center justify-center border border-input bg-background rounded-md text-sm font-medium">
                      {yearFromRevenue || selectedYear}
                    </div>
                  </div>
                </div>
                {availableMonths.length === 0 && (
                  <div className="pl-8">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ No revenue targets set for {selectedYear}. Please set
                        year and month targets in the Revenue Targets tab first.
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-6 pl-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="start_month"
                        className="text-sm font-medium"
                      >
                        Start Month *
                      </Label>
                      <Select
                        value={formData.start_month}
                        onValueChange={(value) =>
                          setFormData({ ...formData, start_month: value })
                        }
                        required
                        disabled={availableMonths.length === 0}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select start month" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMonths.length > 0 ? (
                            availableMonths.map((r: any) => {
                              const date = new Date(r.month);
                              const monthValue = (date.getMonth() + 1)
                                .toString()
                                .padStart(2, "0");
                              const monthLabel = date.toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                },
                              );
                              return (
                                <SelectItem key={r.id} value={monthValue}>
                                  {monthLabel} (Target: RM
                                  {r.target_amount.toLocaleString()})
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="no-months" disabled>
                              No months available - Set revenue targets first
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="end_month"
                        className="text-sm font-medium"
                      >
                        End Month *
                      </Label>
                      <Select
                        value={formData.end_month}
                        onValueChange={(value) =>
                          setFormData({ ...formData, end_month: value })
                        }
                        required
                        disabled={availableMonths.length === 0}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select end month" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMonths.length > 0 ? (
                            availableMonths.map((r: any) => {
                              const date = new Date(r.month);
                              const monthValue = (date.getMonth() + 1)
                                .toString()
                                .padStart(2, "0");
                              const monthLabel = date.toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                },
                              );
                              return (
                                <SelectItem key={r.id} value={monthValue}>
                                  {monthLabel} (Target: RM
                                  {r.target_amount.toLocaleString()})
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="no-months" disabled>
                              No months available - Set revenue targets first
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="start_date"
                        className="text-sm font-medium"
                      >
                        Or Specific Start Date
                      </Label>
                      <DatePicker
                        id="start_date"
                        value={formData.start_date || undefined}
                        onChange={(date) =>
                          setFormData({
                            ...formData,
                            start_date: date || "",
                          })
                        }
                        placeholder="Select start date (optional)"
                        min={startDateConstraints.min}
                        max={startDateConstraints.max}
                        disabled={
                          !formData.start_month || availableMonths.length === 0
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date" className="text-sm font-medium">
                        Or Specific End Date
                      </Label>
                      <DatePicker
                        id="end_date"
                        value={formData.end_date || undefined}
                        onChange={(date) =>
                          setFormData({
                            ...formData,
                            end_date: date || "",
                          })
                        }
                        placeholder="Select end date (optional)"
                        min={endDateConstraints.min}
                        max={endDateConstraints.max}
                        disabled={
                          !formData.end_month || availableMonths.length === 0
                        }
                      />
                    </div>
                  </div>
                  {availableMonths.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      💡 Only months with revenue targets set for {selectedYear}{" "}
                      are shown. You can also use specific dates if needed.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-8 space-y-6">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <DollarSign className="h-5 w-5" />
                  <span>Financial Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-8">
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-sm font-medium">
                      Budget (RM)
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      placeholder="120000.00"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="project_price"
                      className="text-sm font-medium"
                    >
                      Project Price (RM)
                    </Label>
                    <Input
                      id="project_price"
                      type="number"
                      step="0.01"
                      value={formData.revenue}
                      onChange={(e) =>
                        setFormData({ ...formData, revenue: e.target.value })
                      }
                      placeholder="150000.00"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      The cost that the client needs to pay
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="development_cost"
                      className="text-sm font-medium"
                    >
                      Development Cost (RM)
                    </Label>
                    <Input
                      id="development_cost"
                      type="number"
                      step="0.01"
                      value={formData.actual_cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          actual_cost: e.target.value,
                        })
                      }
                      placeholder="45000.00"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      How much we spend in the project for development
                    </p>
                  </div>
                </div>
                {/* Payments Section */}
                <div className="space-y-4 pl-8 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        Payments Received
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Add multiple payments if the client paid in installments
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          payments: [
                            ...formData.payments,
                            { amount: "", date: "", note: "" },
                          ],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment
                    </Button>
                  </div>

                  {formData.payments.length > 0 ? (
                    <div className="space-y-3">
                      {formData.payments.map((payment, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg space-y-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">
                              Payment #{index + 1}
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newPayments = [...formData.payments];
                                newPayments.splice(index, 1);
                                setFormData({
                                  ...formData,
                                  payments: newPayments,
                                });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label
                                htmlFor={`payment-amount-${index}`}
                                className="text-xs"
                              >
                                Amount (RM)
                              </Label>
                              <Input
                                id={`payment-amount-${index}`}
                                type="number"
                                step="0.01"
                                value={payment.amount}
                                onChange={(e) => {
                                  const newPayments = [...formData.payments];
                                  newPayments[index].amount = e.target.value;
                                  setFormData({
                                    ...formData,
                                    payments: newPayments,
                                  });
                                }}
                                placeholder="0.00"
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`payment-date-${index}`}
                                className="text-xs"
                              >
                                Payment Date
                              </Label>
                              <DatePicker
                                id={`payment-date-${index}`}
                                value={payment.date || undefined}
                                onChange={(date) => {
                                  const newPayments = [...formData.payments];
                                  newPayments[index].date = date || "";
                                  setFormData({
                                    ...formData,
                                    payments: newPayments,
                                  });
                                }}
                                placeholder="Select payment date"
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`payment-note-${index}`}
                                className="text-xs"
                              >
                                Note (Optional)
                              </Label>
                              <Input
                                id={`payment-note-${index}`}
                                type="text"
                                value={payment.note || ""}
                                onChange={(e) => {
                                  const newPayments = [...formData.payments];
                                  newPayments[index].note = e.target.value;
                                  setFormData({
                                    ...formData,
                                    payments: newPayments,
                                  });
                                }}
                                placeholder="Payment reference, invoice #, etc."
                                className="h-10"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        No payments added yet. Click "Add Payment" to record a
                        payment.
                      </p>
                    </div>
                  )}

                  {/* Payment Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Total Paid
                      </Label>
                      <p className="text-lg font-semibold">
                        RM
                        {formData.payments
                          .reduce(
                            (sum, p) =>
                              sum + Number.parseFloat(p.amount || "0"),
                            0,
                          )
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Remaining
                      </Label>
                      <p className="text-lg font-semibold text-orange-600">
                        RM
                        {Math.max(
                          (Number.parseFloat(formData.revenue) || 0) -
                            formData.payments.reduce(
                              (sum, p) =>
                                sum + Number.parseFloat(p.amount || "0"),
                              0,
                            ),
                          0,
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Payment Status
                      </Label>
                      <p className="text-sm font-medium">
                        {(() => {
                          const projectPrice =
                            Number.parseFloat(formData.revenue) || 0;
                          const totalPaid = formData.payments.reduce(
                            (sum, p) =>
                              sum + Number.parseFloat(p.amount || "0"),
                            0,
                          );
                          if (totalPaid === 0) return "Unpaid";
                          if (totalPaid < projectPrice) return "Partially Paid";
                          return "Paid";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestones & Tasks Section */}
              <div className="border-t pt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <GanttChart className="h-5 w-5" />
                    <span>Milestones & Tasks</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMilestoneId(null);
                      setSelectedMilestoneId(null);
                      setMilestoneDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>

                {(() => {
                  // Use tempMilestones when creating, milestones when editing
                  const displayMilestones = editingId
                    ? milestones || []
                    : tempMilestones.map((m) => {
                        const tasks = m.tasks || [];
                        const completedTasks = tasks.filter(
                          (t: any) => t.status === "done",
                        ).length;
                        const totalTasks = tasks.length;
                        const progress =
                          totalTasks > 0
                            ? Math.round((completedTasks / totalTasks) * 100)
                            : 0;
                        return {
                          ...m,
                          id: m.tempId,
                          task_count: totalTasks,
                          completed_task_count: completedTasks,
                          progress,
                        };
                      });

                  return displayMilestones.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {displayMilestones.map((milestone: any) => (
                        <AccordionItem
                          key={milestone.id || milestone.tempId}
                          value={milestone.id || milestone.tempId}
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {milestone.title}
                                    </span>
                                    <Badge
                                      variant={
                                        milestone.status === "completed"
                                          ? "default"
                                          : milestone.status === "in-progress"
                                            ? "secondary"
                                            : "outline"
                                      }
                                      className="text-xs"
                                    >
                                      {milestone.status === "not-started"
                                        ? "Not Started"
                                        : milestone.status === "in-progress"
                                          ? "In Progress"
                                          : milestone.status === "completed"
                                            ? "Completed"
                                            : "On Hold"}
                                    </Badge>
                                  </div>
                                  {milestone.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {milestone.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    {milestone.start_date && (
                                      <span>
                                        Start:{" "}
                                        {new Date(
                                          milestone.start_date,
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                    {milestone.due_date && (
                                      <span>
                                        Due:{" "}
                                        {new Date(
                                          milestone.due_date,
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                    <span>
                                      {milestone.completed_task_count} /{" "}
                                      {milestone.task_count} tasks
                                    </span>
                                  </div>
                                </div>
                                <div className="w-32">
                                  <Progress
                                    value={milestone.progress}
                                    className="h-2"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1 text-center">
                                    {milestone.progress}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Tasks</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMilestoneId(
                                      milestone.id || milestone.tempId,
                                    );
                                    setEditingTaskId(null);
                                    setTaskDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Task
                                </Button>
                              </div>

                              {milestone.tasks && milestone.tasks.length > 0 ? (
                                <div className="space-y-2">
                                  {milestone.tasks.map((task: any) => (
                                    <Card
                                      key={task.id || task.tempId}
                                      className="p-3"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                              {task.title}
                                            </span>
                                            <Badge
                                              variant={
                                                task.status === "done"
                                                  ? "default"
                                                  : task.status ===
                                                      "in-progress"
                                                    ? "secondary"
                                                    : "outline"
                                              }
                                              className="text-xs"
                                            >
                                              {task.status === "todo"
                                                ? "Todo"
                                                : task.status === "in-progress"
                                                  ? "In Progress"
                                                  : task.status === "done"
                                                    ? "Done"
                                                    : "Blocked"}
                                            </Badge>
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {task.priority}
                                            </Badge>
                                          </div>
                                          {task.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {task.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            {task.due_date && (
                                              <span>
                                                Due:{" "}
                                                {new Date(
                                                  task.due_date,
                                                ).toLocaleDateString()}
                                              </span>
                                            )}
                                            {task.estimated_hours && (
                                              <span>
                                                Est: {task.estimated_hours}h
                                              </span>
                                            )}
                                            {task.actual_hours > 0 && (
                                              <span>
                                                Actual: {task.actual_hours}h
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedMilestoneId(
                                                milestone.id ||
                                                  milestone.tempId,
                                              );
                                              setEditingTaskId(
                                                task.id || task.tempId,
                                              );
                                              setTaskDialogOpen(true);
                                            }}
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => {
                                              if (
                                                confirm(
                                                  "Are you sure you want to delete this task?",
                                                )
                                              ) {
                                                // If creating new project, remove from tempMilestones
                                                if (!editingId) {
                                                  setTempMilestones((prev) =>
                                                    prev.map((m) =>
                                                      (m.tempId || m.id) ===
                                                      (milestone.tempId ||
                                                        milestone.id)
                                                        ? {
                                                            ...m,
                                                            tasks:
                                                              m.tasks.filter(
                                                                (t: any) =>
                                                                  (t.tempId ||
                                                                    t.id) !==
                                                                  (task.tempId ||
                                                                    task.id),
                                                              ),
                                                          }
                                                        : m,
                                                    ),
                                                  );
                                                  toast({
                                                    title:
                                                      "Task deleted successfully",
                                                  });
                                                  return;
                                                }
                                                // Existing project - delete via API
                                                try {
                                                  const response = await fetch(
                                                    `/api/tasks/${task.id}`,
                                                    { method: "DELETE" },
                                                  );
                                                  if (response.ok) {
                                                    mutateMilestones();
                                                    toast({
                                                      title:
                                                        "Task deleted successfully",
                                                    });
                                                  }
                                                } catch (error: any) {
                                                  toast({
                                                    title: "Error",
                                                    description: error.message,
                                                    variant: "destructive",
                                                  });
                                                }
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-4 border border-dashed rounded-lg text-center">
                                  <p className="text-sm text-muted-foreground">
                                    No tasks in this milestone
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingMilestoneId(
                                      milestone.id || milestone.tempId,
                                    );
                                    setMilestoneDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit Milestone
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    if (
                                      milestone.tasks &&
                                      milestone.tasks.length > 0
                                    ) {
                                      if (
                                        !confirm(
                                          `This milestone contains ${milestone.tasks.length} task(s). Are you sure you want to delete it? Tasks will be unlinked from this milestone.`,
                                        )
                                      ) {
                                        return;
                                      }
                                    }
                                    // If creating new project, remove from tempMilestones
                                    if (!editingId) {
                                      setTempMilestones((prev) =>
                                        prev.filter(
                                          (m) =>
                                            (m.tempId || m.id) !==
                                            (milestone.tempId || milestone.id),
                                        ),
                                      );
                                      toast({
                                        title: "Milestone deleted successfully",
                                      });
                                      return;
                                    }
                                    // Existing project - delete via API
                                    try {
                                      const response = await fetch(
                                        `/api/milestones/${milestone.id}`,
                                        { method: "DELETE" },
                                      );
                                      if (response.ok) {
                                        mutateMilestones();
                                        toast({
                                          title:
                                            "Milestone deleted successfully",
                                        });
                                      }
                                    } catch (error: any) {
                                      toast({
                                        title: "Error",
                                        description: error.message,
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete Milestone
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="p-8 border border-dashed rounded-lg text-center">
                      <GanttChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No milestones added yet.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create milestones to organize your project into phases
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Form Actions */}
              <div className="sticky bottom-0 bg-background border-t pt-6 pb-8 -mx-6 px-6">
                <div className="flex gap-4 max-w-5xl mx-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setOpen(false);
                      setEditingId(null);
                      setFormData({
                        client_id: "",
                        name: "",
                        description: "",
                        status: "prospective",
                        start_month: "",
                        start_year: selectedYear.toString(),
                        end_month: "",
                        end_year: selectedYear.toString(),
                        start_date: "",
                        end_date: "",
                        budget: "",
                        actual_cost: "",
                        revenue: "",
                        payments: [],
                        progress_notes: "",
                        selected_developers: [] as Array<{
                          developer_id: string;
                          name: string;
                          role: string;
                          amount: string;
                        }>,
                      });
                      setTempMilestones([]);
                      setPrevStartMonth("");
                      setPrevStartYear("");
                      setPrevEndMonth("");
                      setPrevEndYear("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" size="lg">
                    {editingId ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Update Project
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <MilestoneDialog />
        <TaskDialog />
      </div>
    );
  }

  // Default view - projects list
  return (
    <>
      <MilestoneDialog />
      <TaskDialog />
      <div className="space-y-4">
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({
              client_id: "",
              name: "",
              description: "",
              status: "prospective",
              start_month: "",
              start_year: selectedYear.toString(),
              end_month: "",
              end_year: selectedYear.toString(),
              start_date: "",
              end_date: "",
              budget: "",
              actual_cost: "",
              revenue: "",
              payments: [],
              progress_notes: "",
              selected_developers: [] as Array<{
                developer_id: string;
                name: string;
                role: string;
                amount: string;
              }>,
            });
            setPrevStartMonth("");
            setPrevStartYear("");
            setPrevEndMonth("");
            setPrevEndYear("");
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>

        {/* Project Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProjects.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeProjects.length} active, {completedProjects.length}{" "}
                completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                RM {totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Budget: RM {totalBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Profit
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                RM {totalProfit.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Margin: {profitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avg Project Value</CardTitle>
              <CardDescription>Per project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                RM{" "}
                {filteredProjects.length > 0
                  ? (totalRevenue / filteredProjects.length).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 },
                    )
                  : "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project List */}
        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>
              Detailed view of all projects and their progress
            </CardDescription>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="project-search">Search</Label>
                <Input
                  id="project-search"
                  value={projectFilters.search}
                  onChange={(e) =>
                    setProjectFilters({
                      ...projectFilters,
                      search: e.target.value,
                    })
                  }
                  placeholder="Name / client / description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Status</Label>
                <Select
                  value={projectFilters.status}
                  onValueChange={(value) =>
                    setProjectFilters({
                      ...projectFilters,
                      status: value as any,
                    })
                  }
                >
                  <SelectTrigger id="project-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="prospective">Prospective</SelectItem>
                    <SelectItem value="potential">Potential</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-client">Client</Label>
                <Select
                  value={projectFilters.client_id}
                  onValueChange={(value) =>
                    setProjectFilters({
                      ...projectFilters,
                      client_id: value,
                    })
                  }
                >
                  <SelectTrigger id="project-client">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 flex items-center justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setProjectFilters({
                      search: "",
                      status: "all",
                      client_id: "all",
                    })
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const budgetUsed = project.budget
                  ? (project.actual_cost / project.budget) * 100
                  : 0;
                const isOverBudget = budgetUsed > 100;
                const projectMargin =
                  project.revenue > 0
                    ? ((project.revenue - project.actual_cost) /
                        project.revenue) *
                      100
                    : 0;

                return (
                  <Card key={project.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">
                                {project.name}
                              </h3>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                              <div className="ml-auto flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(project)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(project.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {project.clientName && (
                              <p className="text-sm text-muted-foreground mb-2">
                                Client: {project.clientName}
                              </p>
                            )}
                            {project.description && (
                              <p className="text-sm text-muted-foreground">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Timeline
                            </div>
                            <div className="text-sm font-medium">
                              {formatDate(project.start_date)} -{" "}
                              {formatDate(project.end_date)}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Budget vs Actual
                            </div>
                            <div className="text-sm font-medium">
                              RM {(project.budget || 0).toLocaleString()} / RM{" "}
                              {project.actual_cost.toLocaleString()}
                              {isOverBudget && (
                                <AlertCircle className="inline h-3 w-3 ml-1 text-destructive" />
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Revenue & Margin
                            </div>
                            <div className="text-sm font-medium">
                              RM {project.revenue.toLocaleString()} (
                              {projectMargin.toFixed(1)}%)
                            </div>
                          </div>
                        </div>

                        <ProjectMilestoneProgress projectId={project.id} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function KPIManager({ toast }: { toast: any }) {
  const { data: kpis, error } = useSWR<KPI[]>("/api/kpis", fetcher);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    target_value: "",
    current_value: "",
    unit: "",
    period: "monthly" as
      | "daily"
      | "weekly"
      | "monthly"
      | "quarterly"
      | "yearly",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      category: formData.category,
      target_value: Number.parseFloat(formData.target_value),
      current_value: Number.parseFloat(formData.current_value),
      unit: formData.unit || null,
      period: formData.period,
    };

    try {
      const url = editingId ? `/api/kpis/${editingId}` : "/api/kpis";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      toast({ title: `KPI ${editingId ? "updated" : "created"} successfully` });
      mutate("/api/kpis");
      setOpen(false);
      setEditingId(null);
      setFormData({
        name: "",
        category: "",
        target_value: "",
        current_value: "",
        unit: "",
        period: "monthly",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (kpi: KPI) => {
    setEditingId(kpi.id);
    setFormData({
      name: kpi.name,
      category: kpi.category,
      target_value: kpi.target_value.toString(),
      current_value: kpi.current_value.toString(),
      unit: kpi.unit || "",
      period: kpi.period,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this KPI?")) return;
    try {
      const response = await fetch(`/api/kpis/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      toast({ title: "KPI deleted successfully" });
      mutate("/api/kpis");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (error) return <div className="text-destructive">Failed to load KPIs</div>;
  if (!kpis) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: "",
              category: "",
              target_value: "",
              current_value: "",
              unit: "",
              period: "monthly",
            });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add KPI
        </Button>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingId ? "Edit" : "Add"} KPI
            </DialogTitle>
            <DialogDescription className="text-base">
              Define key performance indicators to track business metrics
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>KPI Details</span>
              </div>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    KPI Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Monthly Revenue"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="Financial, Business, Delivery, Quality..."
                    className="h-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Targets & Values</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="target_value" className="text-sm font-medium">
                    Target Value *
                  </Label>
                  <Input
                    id="target_value"
                    type="number"
                    step="0.01"
                    value={formData.target_value}
                    onChange={(e) =>
                      setFormData({ ...formData, target_value: e.target.value })
                    }
                    placeholder="100000"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="current_value"
                    className="text-sm font-medium"
                  >
                    Current Value *
                  </Label>
                  <Input
                    id="current_value"
                    type="number"
                    step="0.01"
                    value={formData.current_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_value: e.target.value,
                      })
                    }
                    placeholder="88000"
                    className="h-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Measurement Settings</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-medium">
                    Unit
                  </Label>
                  <Input
                    id="unit"
                    placeholder="%, RM, count, days..."
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period" className="text-sm font-medium">
                    Period
                  </Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, period: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingId ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Update KPI
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create KPI
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {kpis.map((kpi) => {
          const progress = (kpi.current_value / kpi.target_value) * 100;
          return (
            <Card key={kpi.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">
                    {kpi.name}
                  </CardTitle>
                  <CardDescription>
                    {kpi.category} - {kpi.period}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(kpi)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(kpi.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      Current: {kpi.current_value}
                      {kpi.unit}
                    </span>
                    <span>
                      Target: {kpi.target_value}
                      {kpi.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {progress.toFixed(1)}% of target
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RiskManager({ toast }: { toast: any }) {
  const { data: risks, error } = useSWR<Risk[]>("/api/risks", fetcher);
  const { data: projects } = useSWR<Project[]>("/api/projects", fetcher);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [riskFilters, setRiskFilters] = useState({
    search: "",
    severity: "all" as "all" | "low" | "medium" | "high" | "critical",
    status: "all" as
      | "all"
      | "identified"
      | "mitigating"
      | "resolved"
      | "accepted",
    project_id: "all" as "all" | "none" | string,
  });
  const [formData, setFormData] = useState({
    project_id: "",
    title: "",
    description: "",
    category: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    probability: "medium" as "low" | "medium" | "high",
    impact: "",
    mitigation_plan: "",
    status: "identified" as
      | "identified"
      | "mitigating"
      | "resolved"
      | "accepted",
    owner: "",
    identified_date: "",
    target_resolution_date: "",
    estimated_financial_impact: "",
  });

  // Calculate risk score and level
  const calculateRiskScore = (
    severity: string,
    probability: string,
  ): number => {
    const severityValues: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    const probabilityValues: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
    };
    return (
      (severityValues[severity] || 2) * (probabilityValues[probability] || 2)
    );
  };

  const deriveRiskLevel = (score: number): "Low" | "Medium" | "High" => {
    if (score <= 3) return "Low";
    if (score <= 6) return "Medium";
    return "High";
  };

  const riskScore = calculateRiskScore(formData.severity, formData.probability);
  const riskLevel = deriveRiskLevel(riskScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      project_id:
        formData.project_id && formData.project_id !== "none"
          ? formData.project_id
          : null,
      title: formData.title,
      description: formData.description || null,
      category: formData.category || null,
      severity: formData.severity,
      probability: formData.probability,
      impact: formData.impact || null,
      mitigation_plan: formData.mitigation_plan || null,
      status: formData.status,
      owner: formData.owner || null,
      identified_date: formData.identified_date || null,
      target_resolution_date: formData.target_resolution_date || null,
      estimated_financial_impact: formData.estimated_financial_impact
        ? Number.parseFloat(formData.estimated_financial_impact)
        : null,
    };

    try {
      const url = editingId ? `/api/risks/${editingId}` : "/api/risks";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      toast({
        title: `Risk ${editingId ? "updated" : "created"} successfully`,
      });
      mutate("/api/risks");
      setOpen(false);
      setEditingId(null);
      setFormData({
        project_id: "none",
        title: "",
        description: "",
        category: "",
        severity: "medium",
        probability: "medium",
        impact: "",
        mitigation_plan: "",
        status: "identified",
        owner: "",
        identified_date: new Date().toISOString().split("T")[0],
        target_resolution_date: "",
        estimated_financial_impact: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (risk: Risk) => {
    setEditingId(risk.id);
    setFormData({
      project_id: risk.project_id || "none",
      title: risk.title,
      description: risk.description || "",
      category: risk.category || "",
      severity: risk.severity,
      probability: risk.probability,
      impact: risk.impact || "",
      mitigation_plan: risk.mitigation_plan || "",
      status: risk.status,
      owner: risk.owner || "",
      identified_date:
        risk.identified_date || new Date().toISOString().split("T")[0],
      target_resolution_date: risk.target_resolution_date || "",
      estimated_financial_impact:
        risk.estimated_financial_impact?.toString() || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this risk?")) return;
    try {
      const response = await fetch(`/api/risks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      toast({ title: "Risk deleted successfully" });
      mutate("/api/risks");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (error)
    return <div className="text-destructive">Failed to load risks</div>;
  if (!risks) return <div>Loading...</div>;

  const filteredRisks = risks.filter((r) => {
    if (riskFilters.severity !== "all" && r.severity !== riskFilters.severity)
      return false;
    if (riskFilters.status !== "all" && r.status !== riskFilters.status)
      return false;

    const projectId = (r as any).project_id as string | null | undefined;
    if (riskFilters.project_id !== "all") {
      if (riskFilters.project_id === "none") {
        if (projectId) return false;
      } else {
        if (!projectId || projectId !== riskFilters.project_id) return false;
      }
    }

    if (riskFilters.search) {
      const q = riskFilters.search.toLowerCase();
      const haystack = [
        r.title,
        r.description ?? "",
        r.category ?? "",
        r.owner ?? "",
        (r as any).impact ?? "",
        (r as any).mitigation_plan ?? "",
        (r as any).project?.name ?? "",
        (r as any).project?.client?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  // Calculate risk metrics
  const criticalRisks = filteredRisks.filter((r) => r.severity === "critical");
  const highRisks = filteredRisks.filter((r) => r.severity === "high");
  const activeRisks = filteredRisks.filter(
    (r) => r.status === "identified" || r.status === "mitigating",
  );
  const resolvedRisks = filteredRisks.filter((r) => r.status === "resolved");

  // Helper functions for styling
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-500";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-500";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500";
      case "mitigating":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500";
      case "identified":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-500";
      case "accepted":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500";
    }
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-green-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "low":
        return <Shield className="h-5 w-5 text-blue-600" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Group risks by category
  const risksByCategory = filteredRisks.reduce(
    (acc, risk) => {
      const category = risk.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(risk);
      return acc;
    },
    {} as Record<string, typeof risks>,
  );

  // Show full-page form when creating/editing
  if (open) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b backdrop-blur supports-backdrop-filter:bg-background/95">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setOpen(false);
                    setEditingId(null);
                    setFormData({
                      project_id: "none",
                      title: "",
                      description: "",
                      category: "",
                      severity: "medium",
                      probability: "medium",
                      impact: "",
                      mitigation_plan: "",
                      status: "identified",
                      owner: "",
                      identified_date: new Date().toISOString().split("T")[0],
                      target_resolution_date: "",
                      estimated_financial_impact: "",
                    });
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">
                    {editingId ? "Edit" : "Create"} Risk
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Identify, assess, and manage potential risks to your
                    business
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span>Risk Information</span>
              </div>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="project_id" className="text-sm font-medium">
                    Project (Optional)
                  </Label>
                  <Select
                    value={formData.project_id || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, project_id: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        No Project (General Risk)
                      </SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Risk Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Revenue Below RM50K Threshold"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="Describe the risk in detail..."
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category
                    </Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="Financial, Business, Delivery..."
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner" className="text-sm font-medium">
                      Owner
                    </Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="owner"
                        value={formData.owner}
                        onChange={(e) =>
                          setFormData({ ...formData, owner: e.target.value })
                        }
                        placeholder="CFO, Project Manager..."
                        className="h-10 pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>Risk Assessment</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="severity" className="text-sm font-medium">
                    Severity
                  </Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, severity: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probability" className="text-sm font-medium">
                    Probability
                  </Label>
                  <Select
                    value={formData.probability}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, probability: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="identified">Identified</SelectItem>
                      <SelectItem value="mitigating">Mitigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Auto-calculated Risk Score and Level */}
              <div className="grid grid-cols-2 gap-4 pl-6 pt-2">
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Risk Score (Auto-calculated)
                  </Label>
                  <div className="text-2xl font-bold">{riskScore}</div>
                  <p className="text-xs text-muted-foreground">
                    Severity × Probability
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Risk Level (Auto-derived)
                  </Label>
                  <div className="text-2xl font-bold">
                    <Badge
                      className={
                        riskLevel === "High"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-lg px-3 py-1"
                          : riskLevel === "Medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-lg px-3 py-1"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-lg px-3 py-1"
                      }
                    >
                      {riskLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on risk score
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Dates & Financial Impact</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pl-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="identified_date"
                    className="text-sm font-medium"
                  >
                    Identified Date
                  </Label>
                  <DatePicker
                    id="identified_date"
                    value={formData.identified_date || undefined}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        identified_date: date || "",
                      })
                    }
                    placeholder="Select identified date"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="target_resolution_date"
                    className="text-sm font-medium"
                  >
                    Target Resolution Date
                  </Label>
                  <DatePicker
                    id="target_resolution_date"
                    value={formData.target_resolution_date || undefined}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        target_resolution_date: date || "",
                      })
                    }
                    placeholder="Select target resolution date"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="estimated_financial_impact"
                    className="text-sm font-medium"
                  >
                    Estimated Financial Impact (RM)
                  </Label>
                  <Input
                    id="estimated_financial_impact"
                    type="number"
                    step="0.01"
                    value={formData.estimated_financial_impact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_financial_impact: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Impact & Mitigation</span>
              </div>
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="impact" className="text-sm font-medium">
                    Impact
                  </Label>
                  <Textarea
                    id="impact"
                    value={formData.impact}
                    onChange={(e) =>
                      setFormData({ ...formData, impact: e.target.value })
                    }
                    rows={2}
                    placeholder="Describe the potential impact if this risk materializes..."
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="mitigation_plan"
                    className="text-sm font-medium"
                  >
                    Mitigation Plan
                  </Label>
                  <Textarea
                    id="mitigation_plan"
                    value={formData.mitigation_plan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mitigation_plan: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Outline the steps to mitigate or manage this risk..."
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t sticky bottom-0 bg-background pb-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  setFormData({
                    project_id: "none",
                    title: "",
                    description: "",
                    category: "",
                    severity: "medium",
                    probability: "medium",
                    impact: "",
                    mitigation_plan: "",
                    status: "identified",
                    owner: "",
                    identified_date: new Date().toISOString().split("T")[0],
                    target_resolution_date: "",
                    estimated_financial_impact: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingId ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Update Risk
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Risk
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show risk list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Risk Management</h2>
          <p className="text-muted-foreground mt-1">
            Identify, assess, and manage potential risks
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({
              project_id: "none",
              title: "",
              description: "",
              category: "",
              severity: "medium",
              probability: "medium",
              impact: "",
              mitigation_plan: "",
              status: "identified",
              owner: "",
              identified_date: new Date().toISOString().split("T")[0],
              target_resolution_date: "",
              estimated_financial_impact: "",
            });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Risk
        </Button>
      </div>

      {/* Risk Filters */}
      <div className="border rounded-md p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="risk-search">Search</Label>
            <Input
              id="risk-search"
              value={riskFilters.search}
              onChange={(e) =>
                setRiskFilters({ ...riskFilters, search: e.target.value })
              }
              placeholder="Title / owner / project / impact"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk-severity">Severity</Label>
            <Select
              value={riskFilters.severity}
              onValueChange={(value) =>
                setRiskFilters({
                  ...riskFilters,
                  severity: value as any,
                })
              }
            >
              <SelectTrigger id="risk-severity" className="h-10">
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk-status">Status</Label>
            <Select
              value={riskFilters.status}
              onValueChange={(value) =>
                setRiskFilters({
                  ...riskFilters,
                  status: value as any,
                })
              }
            >
              <SelectTrigger id="risk-status" className="h-10">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="identified">Identified</SelectItem>
                <SelectItem value="mitigating">Mitigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk-project">Project</Label>
            <Select
              value={riskFilters.project_id}
              onValueChange={(value) =>
                setRiskFilters({
                  ...riskFilters,
                  project_id: value,
                })
              }
            >
              <SelectTrigger id="risk-project" className="h-10">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="none">General Risk (No Project)</SelectItem>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setRiskFilters({
                search: "",
                severity: "all",
                status: "all",
                project_id: "all",
              })
            }
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {filteredRisks.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No risks match your filters.
        </div>
      )}

      {/* Critical Risks Alert */}
      {criticalRisks.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">
                Critical Risks Requiring Immediate Attention
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalRisks.map((risk) => (
                <div key={risk.id} className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{risk.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {risk.description}
                    </p>
                  </div>
                  <Badge className={getStatusColor(risk.status)}>
                    {risk.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRisks.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeRisks.length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {criticalRisks.length}
            </div>
            <p className="text-xs text-muted-foreground">Highest priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {highRisks.length}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolvedRisks.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully mitigated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risks by Category */}
      <div className="space-y-6">
        {Object.entries(risksByCategory).map(([category, categoryRisks]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category} Risks</CardTitle>
              <CardDescription>
                {categoryRisks.length} risk
                {categoryRisks.length !== 1 ? "s" : ""} in this category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryRisks.map((risk) => (
                  <Card key={risk.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(risk.severity)}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">
                                  {risk.title}
                                </h4>
                                {risk.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {risk.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Badge
                                  className={getSeverityColor(risk.severity)}
                                >
                                  {risk.severity}
                                </Badge>
                                <Badge className={getStatusColor(risk.status)}>
                                  {risk.status}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(risk)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(risk.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">
                                    Probability:{" "}
                                  </span>
                                  <span
                                    className={`font-medium ${getProbabilityColor(
                                      risk.probability,
                                    )}`}
                                  >
                                    {risk.probability}
                                  </span>
                                </div>
                                {risk.owner && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      Owner:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {risk.owner}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {risk.impact && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">
                                    Impact
                                  </div>
                                  <p className="text-sm">{risk.impact}</p>
                                </div>
                              )}
                            </div>

                            {risk.mitigation_plan && (
                              <div className="space-y-1 pt-2 border-t">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Mitigation Plan
                                </div>
                                <p className="text-sm">
                                  {risk.mitigation_plan}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DeveloperManager({ toast }: { toast: any }) {
  const {
    data: developers,
    error,
    mutate,
  } = useSWR<Developer[]>("/api/developers", fetcher);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    hourly_rate: "",
    status: "active" as "active" | "inactive",
    create_user_account: false,
    user_password: "",
    user_role: "developer" as "admin" | "developer" | "general",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate user account creation requirements
      if (formData.create_user_account && !editingId) {
        if (!formData.email) {
          toast({
            title: "Error",
            description: "Email is required when creating a user account",
            variant: "destructive",
          });
          return;
        }
        if (!formData.user_password || formData.user_password.length < 6) {
          toast({
            title: "Error",
            description: "Password must be at least 6 characters long",
            variant: "destructive",
          });
          return;
        }
      }

      const data = {
        name: formData.name,
        role: formData.role,
        email: formData.email || null,
        phone: formData.phone || null,
        hourly_rate: formData.hourly_rate
          ? Number.parseFloat(formData.hourly_rate)
          : null,
        status: formData.status,
        // Include user account creation data if checkbox is checked
        create_user_account: formData.create_user_account && !editingId,
        user_password:
          formData.create_user_account && !editingId
            ? formData.user_password
            : undefined,
        user_role:
          formData.create_user_account && !editingId
            ? formData.user_role
            : undefined,
      };

      const url = editingId
        ? `/api/developers/${editingId}`
        : "/api/developers";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      const result = await response.json();

      toast({
        title: `Developer ${editingId ? "updated" : "created"} successfully`,
        description:
          formData.create_user_account && !editingId
            ? "User account has been created and linked to this developer"
            : undefined,
      });
      mutate();
      setOpen(false);
      setEditingId(null);
      setFormData({
        name: "",
        role: "",
        email: "",
        phone: "",
        hourly_rate: "",
        status: "active",
        create_user_account: false,
        user_password: "",
        user_role: "developer",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (developer: Developer) => {
    setEditingId(developer.id);
    setFormData({
      name: developer.name,
      role: developer.role,
      email: developer.email || "",
      phone: developer.phone || "",
      hourly_rate: developer.hourly_rate?.toString() || "",
      status: developer.status,
      create_user_account: false,
      user_password: "",
      user_role: "developer",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this developer?")) return;

    try {
      const response = await fetch(`/api/developers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast({
        title: "Developer deleted successfully",
      });
      mutate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (error) return <div>Error loading developers</div>;
  if (!developers) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Developer Management</h2>
          <p className="text-muted-foreground mt-1">
            Register and manage developers for project assignments
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: "",
              role: "",
              email: "",
              phone: "",
              hourly_rate: "",
              status: "active",
              create_user_account: false,
              user_password: "",
              user_role: "developer",
            });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Developer
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Developer</DialogTitle>
            <DialogDescription>
              Register a developer who can be assigned to projects
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="e.g., Senior Developer, Frontend Developer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="developer@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+60 12-345 6789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (RM)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User Account Section */}
            {!editingId && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create_user_account"
                    checked={formData.create_user_account}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        create_user_account: e.target.checked,
                        user_password: e.target.checked
                          ? formData.user_password
                          : "",
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label
                    htmlFor="create_user_account"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Create User Account
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Automatically create a user account for this developer to
                  access the system
                </p>

                {formData.create_user_account && (
                  <div className="pl-6 space-y-4 border-l-2 border-primary/20">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="user_email">
                          Account Email {formData.email ? "(pre-filled)" : "*"}
                        </Label>
                        <Input
                          id="user_email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="developer@example.com"
                          required={formData.create_user_account}
                        />
                        <p className="text-xs text-muted-foreground">
                          This email will be used for login
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user_password">Password *</Label>
                        <Input
                          id="user_password"
                          type="password"
                          value={formData.user_password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              user_password: e.target.value,
                            })
                          }
                          placeholder="Enter password"
                          required={formData.create_user_account}
                          minLength={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum 6 characters
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user_role">User Role *</Label>
                        <Select
                          value={formData.user_role}
                          onValueChange={(
                            value: "admin" | "developer" | "general",
                          ) => setFormData({ ...formData, user_role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Determines system access permissions
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  setFormData({
                    name: "",
                    role: "",
                    email: "",
                    phone: "",
                    hourly_rate: "",
                    status: "active",
                    create_user_account: false,
                    user_password: "",
                    user_role: "developer",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingId ? "Update" : "Create"} Developer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {developers.map((developer) => {
          // Check if developer has a linked user account (by checking if email exists)
          const hasUserAccount = !!developer.email;

          return (
            <Card key={developer.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">
                      {developer.name}
                    </CardTitle>
                    {hasUserAccount && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Account
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {developer.role}
                    {developer.email && ` • ${developer.email}`}
                    {developer.phone && ` • ${developer.phone}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      developer.status === "active" ? "default" : "secondary"
                    }
                  >
                    {developer.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(developer)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(developer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {developer.hourly_rate && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Hourly Rate:{" "}
                      </span>
                      <span className="font-semibold">
                        RM
                        {developer.hourly_rate.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  {hasUserAccount && developer.email && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span>User account linked ({developer.email})</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function UserManager({ toast }: { toast: any }) {
  const { data: users, error, mutate } = useSWR<User[]>("/api/users", fetcher);
  const {
    data: developers,
    mutate: mutateDevelopers,
  } = useSWR<Developer[]>("/api/developers", fetcher);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "general" as "admin" | "developer" | "general",
    phone: "",
    hourly_rate: "",
    developer_status: "active" as "active" | "inactive",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
      };

      // Only include password if it's provided (for updates) or if creating new user
      if (formData.password) {
        userData.password = formData.password;
      }

      const url = editingId
        ? `/api/users/${editingId}`
        : "/api/auth/create-user";
      const method = editingId ? "PUT" : "POST";

      // For new users, password is required
      if (!editingId && !formData.password) {
        toast({
          title: "Error",
          description: "Password is required for new users",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      // Sync linked Developer profile for task assignment (matched by email).
      if (formData.role !== "admin") {
        const emailLower = formData.email.toLowerCase();
        const linkedDeveloper = developers?.find(
          (d) => d.email && d.email.toLowerCase() === emailLower
        );

        const developerPayload = {
          name: formData.name,
          role: formData.role,
          email: emailLower,
          phone: formData.phone || null,
          hourly_rate: formData.hourly_rate
            ? Number.parseFloat(formData.hourly_rate)
            : null,
          status: formData.developer_status,
          create_user_account: false,
        };

        try {
          if (linkedDeveloper?.id) {
            const devRes = await fetch(
              `/api/developers/${linkedDeveloper.id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(developerPayload),
              }
            );
            if (!devRes.ok) {
              const errorData = await devRes
                .json()
                .catch(() => ({}));
              throw new Error(
                errorData.error || "Failed to update developer"
              );
            }
          } else {
            const devRes = await fetch(`/api/developers`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(developerPayload),
            });
            if (!devRes.ok) {
              const errorData = await devRes
                .json()
                .catch(() => ({}));
              throw new Error(
                errorData.error || "Failed to create developer"
              );
            }
          }

          await mutateDevelopers();
        } catch (devError: any) {
          toast({
            title: "Warning",
            description:
              devError?.message ||
              "User saved, but Developer profile could not be synced.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: `User ${editingId ? "updated" : "created"} successfully`,
      });
      mutate();
      setOpen(false);
      setEditingId(null);
      setFormData({
        email: "",
        password: "",
        name: "",
        role: "general",
        phone: "",
        hourly_rate: "",
        developer_status: "active",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    const linkedDeveloper = developers?.find(
      (d) => d.email && d.email.toLowerCase() === user.email.toLowerCase()
    );
    setFormData({
      email: user.email,
      password: "", // Don't pre-fill password
      name: user.name,
      role: user.role,
      phone: linkedDeveloper?.phone || "",
      hourly_rate: linkedDeveloper?.hourly_rate
        ? linkedDeveloper.hourly_rate.toString()
        : "",
      developer_status: linkedDeveloper?.status || "active",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast({
        title: "User deleted successfully",
      });
      mutate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (error) return <div>Error loading users</div>;
  if (!users || !developers) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and access roles
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({
              email: "",
              password: "",
              name: "",
              role: "general",
              phone: "",
              hourly_rate: "",
              developer_status: "active",
            });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} User</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update user information. Leave password blank to keep current password."
                : "Create a new user account with email and password"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="user@example.com"
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingId ? "(leave blank to keep current)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingId}
                  placeholder={editingId ? "Enter new password" : "Password"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "developer" | "general") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.role !== "admin" && (
              <div className="border-t pt-4 space-y-4">
                <div className="text-sm font-medium text-muted-foreground">
                  Developer Profile Fields
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+60 12-345 6789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (RM)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourly_rate: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="developer_status">Status</Label>
                    <Select
                      value={formData.developer_status}
                      onValueChange={(value: "active" | "inactive") =>
                        setFormData({
                          ...formData,
                          developer_status: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tasks assign using <span className="font-medium">Developer</span> profile matched by email.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  setFormData({
                    email: "",
                    password: "",
                    name: "",
                    role: "general",
                    phone: "",
                    hourly_rate: "",
                    developer_status: "active",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingId ? "Update" : "Create"} User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base font-medium">
                  {user.name}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={
                    user.role === "admin"
                      ? "default"
                      : user.role === "developer"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {user.role}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(user)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const dev = developers?.find(
                  (d) => d.email && d.email.toLowerCase() === user.email.toLowerCase()
                );
                if (!dev) {
                  return (
                    <div className="text-xs text-muted-foreground">
                      No Developer profile linked
                    </div>
                  );
                }
                return (
                  <div className="text-xs text-muted-foreground space-y-1 mb-2">
                    <div>
                      Developer Status:{" "}
                      <span className="font-medium">{dev.status}</span>
                    </div>
                    {dev.phone && (
                      <div>
                        Phone: <span className="font-medium">{dev.phone}</span>
                      </div>
                    )}
                    {dev.hourly_rate != null && (
                      <div>
                        Hourly:{" "}
                        <span className="font-medium">
                          RM {dev.hourly_rate.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="text-sm text-muted-foreground">
                Created: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TaskManager({ toast }: { toast: any }) {
  const { data: tasks, error, mutate } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: developers } = useSWR<Developer[]>("/api/developers", fetcher);
  const { data: users } = useSWR<User[]>("/api/users", fetcher);
  const { data: projects } = useSWR<Project[]>("/api/projects", fetcher);
  const [open, setOpen] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    developer_id: "",
    project_id: "",
    milestone_id: "",
    estimated_hours: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    status: "todo" as "todo" | "in-progress" | "done" | "blocked",
  });

  // Filter state
  const [filters, setFilters] = useState({
    status: "all" as "all" | "todo" | "in-progress" | "done" | "blocked",
    priority: "all" as "all" | "low" | "medium" | "high" | "urgent",
    developer_id: "all",
    project_id: "all",
    search: "",
  });

  // Filter tasks based on filter criteria
  const filteredTasks =
    tasks?.filter((task) => {
      if (filters.status !== "all" && task.status !== filters.status)
        return false;
      if (filters.priority !== "all" && task.priority !== filters.priority)
        return false;
      if (
        filters.developer_id !== "all" &&
        task.developer_id !== filters.developer_id
      )
        return false;
      if (
        filters.project_id !== "all" &&
        task.project_id !== filters.project_id
      )
        return false;
      // Search filter - search in title, description, and assigned developer name
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(searchLower);
        const descriptionMatch = task.description
          ?.toLowerCase()
          .includes(searchLower);
        const developerMatch =
          task.developer?.name?.toLowerCase().includes(searchLower) ||
          task.developer?.email?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descriptionMatch && !developerMatch) return false;
      }
      return true;
    }) || [];

  // Group filtered tasks by developer
  const tasksByDeveloper = filteredTasks.reduce(
    (acc, task) => {
      const devId = task.developer_id;
      if (!acc[devId]) {
        acc[devId] = {
          developer: task.developer || null,
          tasks: [],
        };
      }
      acc[devId].tasks.push(task);
      return acc;
    },
    {} as Record<string, { developer: Developer | null; tasks: Task[] }>,
  );

  const developerGroups = tasksByDeveloper
    ? Object.values(tasksByDeveloper).sort((a, b) => {
        const nameA = a.developer?.name || "Unassigned";
        const nameB = b.developer?.name || "Unassigned";
        return nameA.localeCompare(nameB);
      })
    : [];

  const generalUserEmails = useMemo(() => {
    const s = new Set<string>();
    for (const u of users ?? []) {
      if (u.role === "general" && u.email) s.add(u.email.toLowerCase());
    }
    return s;
  }, [users]);

  /** Active developers plus any developer row tied to a user with role "general" (e.g. inactive in roster). */
  const developerSelectOptions = useMemo(() => {
    if (!developers) return [];
    const base = developers.filter(
      (d) =>
        d.status === "active" ||
        (d.email != null &&
          d.email !== "" &&
          generalUserEmails.has(d.email.toLowerCase())),
    );
    const selId = formData.developer_id;
    if (!selId || base.some((d) => d.id === selId)) return base;
    const missing = developers.find((d) => d.id === selId);
    if (!missing) return base;
    return [...base, missing].sort((a, b) => a.name.localeCompare(b.name));
  }, [developers, generalUserEmails, formData.developer_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taskSubmitting) return;

    if (!formData.developer_id) {
      toast({
        title: "Error",
        description: "Please select a developer",
        variant: "destructive",
      });
      return;
    }

    setTaskSubmitting(true);
    try {
      const data = {
        title: formData.title,
        description: formData.description || null,
        developer_id: formData.developer_id,
        project_id: formData.project_id || null,
        milestone_id: formData.milestone_id || null,
        estimated_hours: formData.estimated_hours
          ? parseFloat(formData.estimated_hours)
          : null,
        due_date: formData.due_date || null,
        priority: formData.priority,
        status: formData.status,
      };

      const url = editingId ? `/api/tasks/${editingId}` : "/api/tasks";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save task");
      }

      toast({
        title: `Task ${editingId ? "updated" : "created"} successfully`,
      });
      mutate();
      setOpen(false);
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        developer_id: "",
        project_id: "",
        milestone_id: "",
        estimated_hours: "",
        due_date: "",
        priority: "medium",
        status: "todo",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description || "",
      developer_id: task.developer_id,
      project_id: task.project_id || "",
      milestone_id: "",
      estimated_hours: task.estimated_hours?.toString() || "",
      due_date: task.due_date || "",
      priority: task.priority,
      status: task.status,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete");
      }

      toast({
        title: "Task deleted successfully",
      });
      mutate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500";
      case "todo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-500";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500";
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (error) return <div>Error loading tasks</div>;
  if (!tasks) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Management</h2>
          <p className="text-muted-foreground mt-1">
            View all tasks, assign new tasks, and manage task details across all
            projects
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: "",
              description: "",
              developer_id: "",
              project_id: "",
              milestone_id: "",
              estimated_hours: "",
              due_date: "",
              priority: "medium",
              status: "todo",
            });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTasks.length}</div>
            {filters.status !== "all" ||
            filters.priority !== "all" ||
            filters.developer_id !== "all" ||
            filters.project_id !== "all" ||
            filters.search ? (
              <p className="text-xs text-muted-foreground mt-1">
                of {tasks.length} total
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTasks.filter((t) => t.status === "todo").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredTasks.filter((t) => t.status === "in-progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredTasks.filter((t) => t.status === "done").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
          <CardDescription>
            Search and filter tasks by status, priority, developer, or project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <Label htmlFor="search-tasks">Search Tasks</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-tasks"
                type="text"
                placeholder="Search by task title, description, or assigned user..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-10"
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setFilters({ ...filters, search: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value as any })
                }
              >
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-priority">Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters({ ...filters, priority: value as any })
                }
              >
                <SelectTrigger id="filter-priority">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-developer">Developer</Label>
              <Select
                value={filters.developer_id}
                onValueChange={(value) =>
                  setFilters({ ...filters, developer_id: value })
                }
              >
                <SelectTrigger id="filter-developer">
                  <SelectValue placeholder="All Developers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Developers</SelectItem>
                  {developers?.map((dev) => (
                    <SelectItem key={dev.id} value={dev.id}>
                      {dev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-project">Project</Label>
              <Select
                value={filters.project_id}
                onValueChange={(value) =>
                  setFilters({ ...filters, project_id: value })
                }
              >
                <SelectTrigger id="filter-project">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(filters.status !== "all" ||
            filters.priority !== "all" ||
            filters.developer_id !== "all" ||
            filters.project_id !== "all" ||
            filters.search) && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    status: "all",
                    priority: "all",
                    developer_id: "all",
                    project_id: "all",
                    search: "",
                  })
                }
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              <div className="flex flex-wrap gap-2">
                {filters.status !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {filters.status}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, status: "all" })}
                    />
                  </Badge>
                )}
                {filters.priority !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Priority: {filters.priority}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setFilters({ ...filters, priority: "all" })
                      }
                    />
                  </Badge>
                )}
                {filters.developer_id !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Developer:{" "}
                    {
                      developers?.find((d) => d.id === filters.developer_id)
                        ?.name
                    }
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setFilters({ ...filters, developer_id: "all" })
                      }
                    />
                  </Badge>
                )}
                {filters.project_id !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Project:{" "}
                    {projects?.find((p) => p.id === filters.project_id)?.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setFilters({ ...filters, project_id: "all" })
                      }
                    />
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {filters.search}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, search: "" })}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Grouped by Developer */}
      <div className="space-y-6">
        {developerGroups.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No tasks found. Click "Add Task" to create one.
              </p>
            </CardContent>
          </Card>
        ) : (
          developerGroups.map((group) => (
            <Card key={group.developer?.id || "unassigned"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  {group.developer?.name || "Unassigned"}
                  {group.developer?.email && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({group.developer.email})
                    </span>
                  )}
                  <Badge variant="outline" className="ml-2">
                    {group.tasks.length}{" "}
                    {group.tasks.length === 1 ? "task" : "tasks"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border rounded-lg bg-card space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{task.title}</h4>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status === "todo"
                                ? "Todo"
                                : task.status === "in-progress"
                                  ? "In Progress"
                                  : task.status === "done"
                                    ? "Done"
                                    : "Blocked"}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>
                          )}
                          {task.project && (
                            <p className="text-xs text-muted-foreground">
                              Project: {task.project.name}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-4 pt-3 border-t text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Estimated Hours
                          </div>
                          <div className="font-medium">
                            {task.estimated_hours
                              ? formatDuration(task.estimated_hours)
                              : "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Actual Hours
                          </div>
                          <div className="font-medium">
                            {formatDuration(task.actual_hours)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Due Date
                          </div>
                          <div className="font-medium">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : "No due date"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Progress
                          </div>
                          <div className="font-medium">
                            {task.estimated_hours
                              ? `${Math.min(
                                  (task.actual_hours / task.estimated_hours) *
                                    100,
                                  100,
                                ).toFixed(0)}%`
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Task Dialog */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setTaskSubmitting(false);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update task details and assignment"
                : "Assign a new task to a developer"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-busy={taskSubmitting}
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Enter task title"
                disabled={taskSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Enter task description"
                disabled={taskSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="developer_id">Developer *</Label>
                <Select
                  value={formData.developer_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, developer_id: value })
                  }
                  disabled={taskSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select developer" />
                  </SelectTrigger>
                  <SelectContent>
                    {developerSelectOptions.map((developer) => (
                      <SelectItem key={developer.id} value={developer.id}>
                        {developer.name} - {developer.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_id">Project (Optional)</Label>
                <Select
                  value={formData.project_id || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      project_id: value === "none" ? "" : value,
                    })
                  }
                  disabled={taskSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority: value })
                  }
                  disabled={taskSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                  disabled={taskSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  disabled={taskSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_hours: e.target.value })
                }
                placeholder="e.g., 8.5"
                disabled={taskSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={taskSubmitting}
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={taskSubmitting}>
                {taskSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingId ? "Saving…" : "Creating…"}
                  </>
                ) : editingId ? (
                  "Update Task"
                ) : (
                  "Create Task"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <AdminPageContent />
    </Suspense>
  );
}
