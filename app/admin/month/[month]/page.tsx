"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Users,
  Target,
  Plus,
  Edit,
  Eye,
} from "lucide-react";
import type { Client, Project, Risk } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MonthDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const monthParam = params.month as string; // Format: YYYY-MM

  // Parse month parameter first
  const [year, month] = monthParam.split("-").map(Number);
  const firstDayOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;

  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] =
    useState<Project | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    date: "",
    note: "",
  });

  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [riskFormData, setRiskFormData] = useState({
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
    identified_date: firstDayOfMonth,
    target_resolution_date: "",
    estimated_financial_impact: "",
  });
  const monthDate = new Date(year, month - 1, 1);
  const monthName = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // Fetch revenue target for this month
  const { data: revenueTargetData, error: revenueError } = useSWR<any>(
    monthParam ? `/api/revenue-targets?month=${monthParam}` : null,
    fetcher
  );

  // Handle single object or array response
  const revenueTarget = Array.isArray(revenueTargetData)
    ? revenueTargetData[0]
    : revenueTargetData;

  // Fetch all clients
  const { data: clientsData, error: clientsError } = useSWR<Client[]>(
    "/api/clients",
    fetcher
  );

  // Fetch all projects
  const { data: projectsData, error: projectsError } = useSWR<Project[]>(
    "/api/projects",
    fetcher
  );

  // Ensure clients and projects are arrays (handle error responses)
  const clients = Array.isArray(clientsData) ? clientsData : [];
  const projects = Array.isArray(projectsData) ? projectsData : [];

  // Fetch all risks
  const { data: risksData, error: risksError } = useSWR<Risk[]>(
    "/api/risks",
    fetcher
  );

  // Ensure risks is an array (handle error responses)
  const risks = Array.isArray(risksData) ? risksData : [];

  // Filter projects that overlap with this month
  const monthProjects = projects.filter((project) => {
    if (!project.start_date || !project.end_date) return false;
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);

    // Check if project overlaps with this month
    return (
      (startDate <= monthEnd && endDate >= monthStart) ||
      (startDate >= monthStart && startDate <= monthEnd) ||
      (endDate >= monthStart && endDate <= monthEnd)
    );
  });

  // Fetch developers for all projects in this month
  const projectIds = monthProjects.map((p) => p.id);
  const developerUrls = projectIds.map(
    (id) => `/api/projects/${id}/developers`
  );

  // Fetch all project developers
  const { data: allProjectDevelopers } = useSWR<any[]>(
    projectIds.length > 0 ? developerUrls : null,
    (urls: string[]) =>
      Promise.all(urls.map((url) => fetcher(url).catch(() => [])))
  );

  // Group developers by project ID
  const developersByProject = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    if (allProjectDevelopers && Array.isArray(allProjectDevelopers)) {
      allProjectDevelopers.forEach((devs: any[], index: number) => {
        if (devs && Array.isArray(devs) && projectIds[index]) {
          grouped[projectIds[index]] = devs;
        }
      });
    }
    return grouped;
  }, [allProjectDevelopers, projectIds]);

  // Calculate payments received in this month
  // Only count payments where payment_date is in this month
  const paymentsThisMonth = projects.filter((project) => {
    if (!project.payment_date) return false;
    const paymentDate = new Date(project.payment_date);
    return paymentDate >= monthStart && paymentDate <= monthEnd;
  });

  const totalPaymentsThisMonth = paymentsThisMonth.reduce(
    (sum, project) => sum + Number(project.amount_paid || 0),
    0
  );

  // Calculate actual revenue (only from payments in this month, not project prices)
  const actualAmount = totalPaymentsThisMonth;

  // Calculate progress
  const targetAmount = revenueTarget
    ? Number(revenueTarget.target_amount || 0)
    : 0;
  const remaining = Math.max(0, targetAmount - actualAmount);
  const progress = targetAmount > 0 ? (actualAmount / targetAmount) * 100 : 0;

  // Filter risks identified in this month (use identified_date if available, otherwise created_at)
  const monthRisks = risks.filter((risk) => {
    let riskDate: Date;

    if (risk.identified_date) {
      // identified_date is in format "YYYY-MM-DD", parse it properly
      const [year, month, day] = risk.identified_date.split("-").map(Number);
      riskDate = new Date(year, month - 1, day);
    } else {
      // Fall back to created_at (full ISO string)
      riskDate = new Date(risk.created_at);
    }

    // Compare dates (ignore time for date-only comparisons)
    const riskYear = riskDate.getFullYear();
    const riskMonth = riskDate.getMonth();
    const targetYear = monthStart.getFullYear();
    const targetMonth = monthStart.getMonth();

    return riskYear === targetYear && riskMonth === targetMonth;
  });

  // Calculate month risk metrics
  const monthRiskMetrics = useMemo(() => {
    const openRisks = monthRisks.filter(
      (r) => r.status !== "resolved" && r.status !== "accepted"
    ).length;
    const highRiskLevel = monthRisks.filter(
      (r) => r.risk_level === "High"
    ).length;
    const financialExposure = monthRisks
      .filter((r) => r.status !== "resolved" && r.status !== "accepted")
      .reduce((sum, r) => sum + (r.estimated_financial_impact || 0), 0);

    return {
      openRisks,
      highRiskLevel,
      financialExposure,
    };
  }, [monthRisks]);

  // Get unique clients from month projects
  const monthClients = clients.filter((client) =>
    monthProjects.some((project) => project.client_id === client.id)
  );

  // Calculate client stats
  const clientStats = monthClients.map((client) => {
    const clientProjects = monthProjects.filter(
      (p) => p.client_id === client.id
    );
    const expectedRevenue = clientProjects.reduce(
      (sum, p) => sum + Number(p.revenue || 0),
      0
    );
    const paidThisMonth = clientProjects
      .filter((p) => {
        if (!p.payment_date) return false;
        const paymentDate = new Date(p.payment_date);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      })
      .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    const totalPaid = clientProjects.reduce(
      (sum, p) => sum + Number(p.amount_paid || 0),
      0
    );
    const outstanding = expectedRevenue - totalPaid;

    return {
      client,
      expectedRevenue,
      paidThisMonth,
      outstanding,
    };
  });

  // Calculate pipeline breakdown by individual status (for Pipeline Summary)
  const pipelineByStatus = monthProjects.reduce((acc, project) => {
    const status = project.status || "pending";
    if (!acc[status]) {
      acc[status] = { count: 0, total: 0 };
    }
    acc[status].count += 1;
    acc[status].total += Number(project.revenue || 0);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Status order for Pipeline Summary
  const pipelineStatusOrder = [
    "pending",
    "planning",
    "on-hold",
    "prospective",
    "potential",
    "in-progress",
    "completed",
  ];

  // Calculate status analysis by business buckets (counts + prices)
  const statusAnalysisBuckets = {
    pipeline: {
      label: "Pipeline",
      statuses: ["prospective", "potential", "pending", "planning"],
      count: 0,
      total: 0,
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
    active: {
      label: "Active",
      statuses: ["in-progress"],
      count: 0,
      total: 0,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    blocked: {
      label: "Blocked",
      statuses: ["on-hold"],
      count: 0,
      total: 0,
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    done: {
      label: "Done",
      statuses: ["completed"],
      count: 0,
      total: 0,
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    lost: {
      label: "Lost",
      statuses: ["cancelled"],
      count: 0,
      total: 0,
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
  };

  // Calculate counts and totals for status analysis buckets
  monthProjects.forEach((project) => {
    const status = project.status || "pending";
    const projectPrice = Number(project.revenue || 0);
    for (const [key, bucket] of Object.entries(statusAnalysisBuckets)) {
      if (bucket.statuses.includes(status)) {
        statusAnalysisBuckets[
          key as keyof typeof statusAnalysisBuckets
        ].count += 1;
        statusAnalysisBuckets[
          key as keyof typeof statusAnalysisBuckets
        ].total += projectPrice;
        break;
      }
    }
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: "Planning",
      pending: "Pending",
      "on-hold": "On Hold",
      "in-progress": "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      prospective: "Prospective",
      potential: "Potential",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "in-progress":
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "on-hold":
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      planning:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      pending: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      colors[status] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{monthName}</h1>
            <p className="text-muted-foreground">Month Overview & Details</p>
          </div>
        </div>

      {/* Status Analysis - At the Top */}
      <Card>
        <CardHeader>
          <CardTitle>Status Analysis</CardTitle>
          <CardDescription>
            Project counts and expected revenue by business status buckets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(statusAnalysisBuckets).map(([key, bucket]) => (
              <div
                key={key}
                className="p-4 border rounded-lg text-center hover:bg-accent transition-colors"
              >
                <Badge className={`${bucket.color} mb-3`}>{bucket.label}</Badge>
                <p className="text-3xl font-bold mt-2">{bucket.count}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  project{bucket.count !== 1 ? "s" : ""}
                </p>
                <div className="pt-2 border-t">
                  <p className="text-lg font-semibold">
                    RM
                    {bucket.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expected Revenue
                  </p>
      </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Actual vs Target */}
      {revenueTarget ? (
        <Card>
          <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
              <CardTitle>Actual vs Target</CardTitle>
              </div>
            <CardDescription>
              Actual revenue from payments received this month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
                <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-xl font-semibold">
                    RM{targetAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                <p className="text-sm text-muted-foreground">Actual</p>
                <p className="text-xl font-semibold text-green-600">
                    RM{actualAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                  <p
                  className={`text-xl font-semibold ${
                      remaining > 0 ? "text-orange-600" : "text-green-600"
                    }`}
                  >
                    RM{remaining.toLocaleString()}
                  </p>
                </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-xl font-semibold">{progress.toFixed(1)}%</p>
              </div>
            </div>
            <Progress value={progress} className="h-3" />
            {remaining > 0 ? (
              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Need to achieve RM{remaining.toLocaleString()} more to hit
                  target
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  Target achieved
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Revenue Target Set</CardTitle>
            <CardDescription>
              Set a revenue target for this month in the Revenue Targets section
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Section 2: Pipeline Summary - Expected Revenue */}
      <div className="border-t pt-6">
        <h2 className="text-2xl font-semibold mb-4">Pipeline Details</h2>
      </div>

      {/* Clients Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
            <CardTitle>Clients ({monthClients.length})</CardTitle>
            </div>
            <CardDescription>
            Clients with projects overlapping this month
            </CardDescription>
          </CardHeader>
          <CardContent>
          {monthClients.length > 0 ? (
            <div className="space-y-4">
              {clientStats.map(
                ({ client, expectedRevenue, paidThisMonth, outstanding }) => (
                  <div
                    key={client.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        {client.industry && (
                          <p className="text-sm text-muted-foreground">
                            {client.industry}
                          </p>
                        )}
                        {client.contact_person && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Contact: {client.contact_person}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          Expected Revenue
                        </p>
                        <p className="font-semibold">
                          RM{expectedRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paid This Month</p>
                        <p className="font-semibold text-green-600">
                          RM{paidThisMonth.toLocaleString()}
                        </p>
                    </div>
                      <div>
                        <p className="text-muted-foreground">Outstanding</p>
                        <p className="font-semibold text-orange-600">
                          RM{outstanding.toLocaleString()}
                        </p>
                  </div>
                    </div>
                  </div>
                )
              )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No clients with projects in this month
              </p>
            )}
          </CardContent>
        </Card>

      {/* Projects Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle>Projects ({monthProjects.length})</CardTitle>
            </div>
          <CardDescription>Projects active during this month</CardDescription>
          </CardHeader>
          <CardContent>
          {monthProjects.length > 0 ? (
            <div className="space-y-4">
                {monthProjects.map((project) => {
                const projectClient = clients.find(
                    (c) => c.id === project.client_id
                  );
                const projectPrice = Number(project.revenue || 0);
                const totalPaid = Number(project.amount_paid || 0);
                const remaining = projectPrice - totalPaid;
                const hasPaymentThisMonth =
                  project.payment_date &&
                  new Date(project.payment_date) >= monthStart &&
                  new Date(project.payment_date) <= monthEnd;
                const paidThisMonth = hasPaymentThisMonth
                  ? Number(project.amount_paid || 0)
                  : 0;

                  return (
                    <div
                      key={project.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                          <p className="font-medium">{project.name}</p>
                          {projectClient && (
                            <p className="text-sm text-muted-foreground">
                              {projectClient.name}
                            </p>
                          )}
                        </div>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                      </div>

                    {project.start_date && project.end_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <Calendar className="h-3 w-3" />
                        {new Date(
                          project.start_date
                        ).toLocaleDateString()} –{" "}
                        {new Date(project.end_date).toLocaleDateString()}
                      </div>
                    )}

                    {/* Progress Notes for Early-Stage Projects */}
                    {project.status !== "completed" &&
                      project.status !== "in-progress" &&
                      (project as any).progress_notes && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">
                            Progress Status:
                          </p>
                          <div className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-line">
                            {(project as any).progress_notes}
                          </div>
                        </div>
                      )}

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                        <p className="text-muted-foreground">Project Price</p>
                          <p className="font-semibold">
                          RM{projectPrice.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-semibold">
                            RM{Number(project.budget || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg text-sm">
                      <div>
                        <p className="text-muted-foreground">Paid This Month</p>
                        <p className="font-semibold text-green-600">
                          RM{paidThisMonth.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Paid</p>
                        <p className="font-semibold">
                          RM{totalPaid.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-semibold text-orange-600">
                          RM{remaining.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Developers Section */}
                    {developersByProject[project.id] &&
                      developersByProject[project.id].length > 0 && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Assigned Developers
                            </p>
                          </div>
                          <div className="space-y-1">
                            {developersByProject[project.id].map((dev: any) => (
                              <div
                                key={dev.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {dev.name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    - {dev.role}
                                  </span>
                                </div>
                                {dev.amount && Number(dev.amount) > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    RM
                                    {Number(dev.amount).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to admin page and store project ID for editing
                          sessionStorage.setItem("editProjectId", project.id);
                          router.push("/admin?tab=projects");
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View / Edit
                      </Button>
                      {(project.status === "in-progress" ||
                        project.status === "completed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProjectForPayment(project);
                            setPaymentFormData({
                              amount: "",
                              date: new Date().toISOString().split("T")[0],
                              note: "",
                            });
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Payment
                        </Button>
                      )}
                    </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects active in this month
              </p>
            )}
          </CardContent>
        </Card>

      {/* Section 2a: Pipeline Summary - Expected Revenue by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Summary (Expected Revenue)</CardTitle>
          <CardDescription>
            Expected revenue breakdown by project status (Project Price)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipelineStatusOrder.map((status) => {
              const stats = pipelineByStatus[status];
              if (!stats || stats.count === 0) return null;

              return (
                <div
                  key={status}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(status)}>
                      {getStatusLabel(status)}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {stats.count} project{stats.count !== 1 ? "s" : ""}
                      </p>
      </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      RM
                      {stats.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expected Revenue
                    </p>
                  </div>
                </div>
              );
            })}
            {Object.keys(pipelineByStatus).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects in pipeline for this month
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle>
                  Risks ({monthRisks.length})
                  {risks.length > 0 && monthRisks.length === 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({risks.length} total risks in system)
                    </span>
                  )}
                </CardTitle>
          </div>
              <CardDescription className="mt-1">
                Risks identified during this month (based on identified date or
                creation date)
          </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setRiskFormData({
                  title: "",
                  description: "",
                  category: "",
                  severity: "medium",
                  probability: "medium",
                  impact: "",
                  mitigation_plan: "",
                  status: "identified",
                  owner: "",
                  identified_date: firstDayOfMonth,
                  target_resolution_date: "",
                  estimated_financial_impact: "",
                });
                setRiskDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Risk
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Risk Summary Metrics */}
          {monthRisks.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {monthRiskMetrics.openRisks}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Open Risks
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {monthRiskMetrics.highRiskLevel}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  High Risk Level
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  RM
                  {monthRiskMetrics.financialExposure.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Financial Exposure
                </div>
              </div>
            </div>
          )}
          {monthRisks.length > 0 ? (
            <div className="space-y-3">
              {monthRisks.map((risk) => (
                <div
                  key={risk.id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{risk.title}</p>
                      {(risk as any).project && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Project: {(risk as any).project.name}
                          {(risk as any).project.client && (
                            <span className="ml-1">
                              ({((risk as any).project.client as any).name})
                            </span>
                          )}
                        </p>
                      )}
                      {risk.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {risk.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {risk.risk_level && (
                        <Badge
                          className={
                            risk.risk_level === "High"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : risk.risk_level === "Medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }
                        >
                          {risk.risk_level} (Score: {risk.risk_score ?? "N/A"})
                        </Badge>
                      )}
                      <Badge
                        className={
                          risk.severity === "critical"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : risk.severity === "high"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : risk.severity === "medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }
                      >
                        {risk.severity}
                      </Badge>
                      <Select
                        value={risk.status}
                        onValueChange={async (newStatus: any) => {
                          try {
                            const response = await fetch(
                              `/api/risks/${risk.id}`,
                              {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  status: newStatus,
                                }),
                              }
                            );

                            if (!response.ok)
                              throw new Error("Failed to update risk status");

                            toast({
                              title: "Risk status updated successfully",
                            });
                            mutate("/api/risks");
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-7 text-xs">
                          <SelectValue>
                            <Badge
                              className={
                          risk.status === "resolved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : risk.status === "mitigating"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : risk.status === "accepted"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              }
                            >
                              {risk.status === "identified"
                                ? "Not Defined"
                                : risk.status === "mitigating"
                                ? "In Progress"
                                : risk.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="identified">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-500" />
                              Not Defined
                    </div>
                          </SelectItem>
                          <SelectItem value="mitigating">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              In Progress
                  </div>
                          </SelectItem>
                          <SelectItem value="resolved">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Resolved
                            </div>
                          </SelectItem>
                          <SelectItem value="accepted">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-purple-500" />
                              Accepted
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    {risk.category && (
                      <div>
                        <span className="text-muted-foreground">
                          Category:{" "}
                        </span>
                        <span className="font-medium">{risk.category}</span>
                      </div>
                    )}
                    {risk.owner && (
                      <div>
                        <span className="text-muted-foreground">Owner: </span>
                        <span className="font-medium">{risk.owner}</span>
                      </div>
                    )}
                    {risk.identified_date && (
                      <div>
                        <span className="text-muted-foreground">
                          Identified:{" "}
                        </span>
                        <span className="font-medium">
                          {new Date(risk.identified_date).toLocaleDateString()}
                        </span>
                  </div>
                    )}
                    {risk.target_resolution_date && (
                      <div>
                        <span className="text-muted-foreground">
                          Target Resolution:{" "}
                        </span>
                        <span className="font-medium">
                          {new Date(
                            risk.target_resolution_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {risk.estimated_financial_impact && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 rounded text-sm">
                      <p className="font-medium text-red-900 dark:text-red-200">
                        Estimated Financial Impact: RM
                        {risk.estimated_financial_impact.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>
                  )}
                  {risk.mitigation_plan && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-200">
                        Mitigation Plan:
                      </p>
                      <p className="text-blue-800 dark:text-blue-300 mt-1">
                        {risk.mitigation_plan}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to admin page and store risk ID for editing
                        sessionStorage.setItem("editRiskId", risk.id);
                        router.push("/admin?tab=risks");
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View / Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
              No risks identified for this month
            </p>
              <Button
                variant="outline"
                onClick={() => {
                  // Set identified_date to the first day of the current month being viewed
                  const firstDayOfMonth = `${year}-${String(month).padStart(
                    2,
                    "0"
                  )}-01`;
                  setRiskFormData({
                    title: "",
                    description: "",
                    category: "",
                    severity: "medium",
                    probability: "medium",
                    impact: "",
                    mitigation_plan: "",
                    status: "identified",
                    owner: "",
                    identified_date: firstDayOfMonth,
                    target_resolution_date: "",
                    estimated_financial_impact: "",
                  });
                  setRiskDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Risk
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Record a payment for{" "}
              {selectedProjectForPayment?.name || "this project"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedProjectForPayment) return;

              try {
                // Get current project data
                const currentAmountPaid = Number(
                  selectedProjectForPayment.amount_paid || 0
                );
                const newAmountPaid =
                  currentAmountPaid +
                  Number.parseFloat(paymentFormData.amount || "0");

                // Update project with new payment
                const response = await fetch(
                  `/api/projects/${selectedProjectForPayment.id}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amount_paid: newAmountPaid,
                      payment_date: paymentFormData.date || null,
                    }),
                  }
                );

                if (!response.ok) throw new Error("Failed to add payment");

                toast({
                  title: "Payment added successfully",
                });
                mutate("/api/projects");
                mutate(`/api/revenue-targets?month=${monthParam}`);
                setPaymentDialogOpen(false);
                setPaymentFormData({ amount: "", date: "", note: "" });
                setSelectedProjectForPayment(null);
              } catch (error: any) {
                toast({
                  title: "Error",
                  description: error.message,
                  variant: "destructive",
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount (RM)</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentFormData.amount}
                onChange={(e) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    amount: e.target.value,
                  })
                }
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentFormData.date}
                onChange={(e) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    date: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-note">Note (Optional)</Label>
              <Textarea
                id="payment-note"
                value={paymentFormData.note}
                onChange={(e) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    note: e.target.value,
                  })
                }
                placeholder="Payment reference, invoice #, etc."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPaymentDialogOpen(false);
                  setPaymentFormData({ amount: "", date: "", note: "" });
                  setSelectedProjectForPayment(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Payment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Risk Dialog */}
      <Dialog open={riskDialogOpen} onOpenChange={setRiskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Risk</DialogTitle>
            <DialogDescription>
              Identify a new risk for this month
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch("/api/risks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: riskFormData.title,
                    description: riskFormData.description || null,
                    category: riskFormData.category || null,
                    severity: riskFormData.severity,
                    probability: riskFormData.probability,
                    impact: riskFormData.impact || null,
                    mitigation_plan: riskFormData.mitigation_plan || null,
                    status: riskFormData.status,
                    owner: riskFormData.owner || null,
                    identified_date: riskFormData.identified_date || null,
                    target_resolution_date:
                      riskFormData.target_resolution_date || null,
                    estimated_financial_impact:
                      riskFormData.estimated_financial_impact
                        ? Number.parseFloat(
                            riskFormData.estimated_financial_impact
                          )
                        : null,
                  }),
                });

                if (!response.ok) throw new Error("Failed to create risk");

                toast({
                  title: "Risk created successfully",
                });
                mutate("/api/risks");
                setRiskDialogOpen(false);
                setRiskFormData({
                  title: "",
                  description: "",
                  category: "",
                  severity: "medium",
                  probability: "medium",
                  impact: "",
                  mitigation_plan: "",
                  status: "identified",
                  owner: "",
                  identified_date: firstDayOfMonth,
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
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="risk-title">Title *</Label>
              <Input
                id="risk-title"
                value={riskFormData.title}
                onChange={(e) =>
                  setRiskFormData({ ...riskFormData, title: e.target.value })
                }
                placeholder="Risk title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-description">Description</Label>
              <Textarea
                id="risk-description"
                value={riskFormData.description}
                onChange={(e) =>
                  setRiskFormData({
                    ...riskFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the risk"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk-category">Category</Label>
                <Input
                  id="risk-category"
                  value={riskFormData.category}
                  onChange={(e) =>
                    setRiskFormData({
                      ...riskFormData,
                      category: e.target.value,
                    })
                  }
                  placeholder="Technical, Business, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-owner">Owner</Label>
                <Input
                  id="risk-owner"
                  value={riskFormData.owner}
                  onChange={(e) =>
                    setRiskFormData({
                      ...riskFormData,
                      owner: e.target.value,
                    })
                  }
                  placeholder="Person responsible"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk-severity">Severity *</Label>
                <Select
                  value={riskFormData.severity}
                  onValueChange={(value: any) =>
                    setRiskFormData({
                      ...riskFormData,
                      severity: value,
                    })
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="risk-probability">Probability *</Label>
                <Select
                  value={riskFormData.probability}
                  onValueChange={(value: any) =>
                    setRiskFormData({
                      ...riskFormData,
                      probability: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-impact">Impact</Label>
              <Input
                id="risk-impact"
                value={riskFormData.impact}
                onChange={(e) =>
                  setRiskFormData({ ...riskFormData, impact: e.target.value })
                }
                placeholder="Potential impact description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-mitigation">Mitigation Plan</Label>
              <Textarea
                id="risk-mitigation"
                value={riskFormData.mitigation_plan}
                onChange={(e) =>
                  setRiskFormData({
                    ...riskFormData,
                    mitigation_plan: e.target.value,
                  })
                }
                placeholder="Steps to mitigate this risk"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-status">Status *</Label>
              <Select
                value={riskFormData.status}
                onValueChange={(value: any) =>
                  setRiskFormData({ ...riskFormData, status: value })
                }
              >
                <SelectTrigger>
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
            {/* Auto-calculated Risk Score and Level */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Risk Score (Auto-calculated)
                </Label>
                <div className="text-2xl font-bold">
                  {(() => {
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
                      (severityValues[riskFormData.severity] || 2) *
                      (probabilityValues[riskFormData.probability] || 2)
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Severity × Probability
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Risk Level (Auto-derived)
                </Label>
                <div className="text-2xl font-bold">
                  <Badge
                    className={(() => {
                      const score =
                        (riskFormData.severity === "low"
                          ? 1
                          : riskFormData.severity === "medium"
                          ? 2
                          : riskFormData.severity === "high"
                          ? 3
                          : 4) *
                        (riskFormData.probability === "low"
                          ? 1
                          : riskFormData.probability === "medium"
                          ? 2
                          : 3);
                      const level =
                        score <= 3 ? "Low" : score <= 6 ? "Medium" : "High";
                      return level === "High"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-lg px-3 py-1"
                        : level === "Medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-lg px-3 py-1"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-lg px-3 py-1";
                    })()}
                  >
                    {(() => {
                      const score =
                        (riskFormData.severity === "low"
                          ? 1
                          : riskFormData.severity === "medium"
                          ? 2
                          : riskFormData.severity === "high"
                          ? 3
                          : 4) *
                        (riskFormData.probability === "low"
                          ? 1
                          : riskFormData.probability === "medium"
                          ? 2
                          : 3);
                      return score <= 3
                        ? "Low"
                        : score <= 6
                        ? "Medium"
                        : "High";
                    })()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on risk score
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk-identified-date">Identified Date</Label>
                <Input
                  id="risk-identified-date"
                  type="date"
                  value={riskFormData.identified_date}
                  onChange={(e) =>
                    setRiskFormData({
                      ...riskFormData,
                      identified_date: e.target.value,
                    })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-target-resolution-date">
                  Target Resolution Date
                </Label>
                <Input
                  id="risk-target-resolution-date"
                  type="date"
                  value={riskFormData.target_resolution_date}
                  onChange={(e) =>
                    setRiskFormData({
                      ...riskFormData,
                      target_resolution_date: e.target.value,
                    })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-financial-impact">
                  Estimated Financial Impact (RM)
                </Label>
                <Input
                  id="risk-financial-impact"
                  type="number"
                  step="0.01"
                  value={riskFormData.estimated_financial_impact}
                  onChange={(e) =>
                    setRiskFormData({
                      ...riskFormData,
                      estimated_financial_impact: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRiskDialogOpen(false);
                  setRiskFormData({
                    title: "",
                    description: "",
                    category: "",
                    severity: "medium",
                    probability: "medium",
                    impact: "",
                    mitigation_plan: "",
                    status: "identified",
                    owner: "",
                    identified_date: firstDayOfMonth,
                    target_resolution_date: "",
                    estimated_financial_impact: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Risk</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
