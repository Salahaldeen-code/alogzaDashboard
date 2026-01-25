"use client";

import { useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  AlertTriangle,
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  Wallet,
  Users,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Activity,
  PieChart,
  Zap,
  Shield,
  Building2,
} from "lucide-react";
import type { Project, RevenueTarget, Risk, Client } from "@/lib/types";
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COLORS = {
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#8b5cf6",
};

export default function KPIDashboard() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Fetch all data
  const { data: projects = [] } = useSWR<Project[]>("/api/projects", fetcher);
  const { data: revenueTargets = [] } = useSWR<RevenueTarget[]>(
    "/api/revenue-targets",
    fetcher
  );
  const { data: yearTargets = [] } = useSWR<any[]>(
    "/api/year-targets",
    fetcher
  );
  const { data: risks = [] } = useSWR<Risk[]>("/api/risks", fetcher);
  const { data: clients = [] } = useSWR<Client[]>("/api/clients", fetcher);

  // Calculate Revenue Metrics
  const revenueMetrics = useMemo(() => {
    const currentYearTargets = revenueTargets.filter((rt) => {
      const monthDate = new Date(rt.month);
      return monthDate.getFullYear() === selectedYear;
    });

    const totalTarget = currentYearTargets.reduce(
      (sum, rt) => sum + (rt.target_amount || 0),
      0
    );
    const totalActual = currentYearTargets.reduce(
      (sum, rt) => sum + (rt.actual_amount || 0),
      0
    );

    const yearTarget = yearTargets.find((yt) => yt.year === selectedYear);
    const yearTargetMin = yearTarget?.minimum_amount || 0;
    const yearTargetMax = yearTarget?.maximum_amount || 0;

    // Calculate actual from projects (in-progress and completed) for the selected year
    // Sum revenue from completed projects (end_date in selected year) and amount_paid from in-progress projects (payment_date in selected year)
    const yearActualFromProjects = projects
      .filter((p) => {
        if (p.status === "completed" && p.end_date) {
          const endDate = new Date(p.end_date);
          return endDate.getFullYear() === selectedYear;
        } else if (p.status === "in-progress" && (p as any).payment_date) {
          const paymentDate = new Date((p as any).payment_date);
          return paymentDate.getFullYear() === selectedYear;
        }
        return false;
      })
      .reduce((sum, p) => {
        if (p.status === "completed") {
          return sum + (p.revenue || 0);
        } else if (p.status === "in-progress") {
          return sum + ((p as any).amount_paid || 0);
        }
        return sum;
      }, 0);

    const yearActual = yearActualFromProjects;

    // Total revenue from all completed projects
    const totalRevenue = projects
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.revenue || 0), 0);

    // Total payments received
    const totalPaid = projects.reduce(
      (sum, p) => sum + (p.amount_paid || 0),
      0
    );

    // Calculate monthly revenue for chart
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthTarget = currentYearTargets.find((rt) => {
        const rtDate = new Date(rt.month);
        return rtDate.getMonth() + 1 === month;
      });
      return {
        month: new Date(selectedYear, i, 1).toLocaleDateString("en-US", {
          month: "short",
        }),
        target: monthTarget?.target_amount || 0,
        actual: monthTarget?.actual_amount || 0,
      };
    });

    return {
      totalRevenue,
      totalPaid,
      totalTarget,
      totalActual,
      yearTargetMin,
      yearTargetMax,
      yearActual,
      achievementRate: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
      yearProgress: yearTargetMax > 0 ? (yearActual / yearTargetMax) * 100 : 0,
      monthlyRevenue,
    };
  }, [projects, revenueTargets, yearTargets, selectedYear]);

  // Calculate Project Health Metrics
  const projectHealth = useMemo(() => {
    const totalProjects = projects.length;
    const byStatus = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completed = byStatus.completed || 0;
    const inProgress = byStatus["in-progress"] || 0;
    const onHold = byStatus["on-hold"] || 0;
    const cancelled = byStatus.cancelled || 0;
    const planning = byStatus.planning || 0;
    const pending = byStatus.pending || 0;
    const prospective = byStatus.prospective || 0;
    const potential = byStatus.potential || 0;

    const activeProjects = completed + inProgress;
    const completionRate =
      totalProjects > 0 ? (completed / totalProjects) * 100 : 0;

    // Recent projects (last 5)
    const recentProjects = [...projects]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    // Project status distribution for pie chart
    const statusData = [
      { name: "Completed", value: completed, color: COLORS.green },
      { name: "In Progress", value: inProgress, color: COLORS.blue },
      { name: "Planning", value: planning, color: COLORS.purple },
      { name: "On Hold", value: onHold, color: COLORS.yellow },
      { name: "Pending", value: pending, color: COLORS.yellow },
      { name: "Prospective", value: prospective, color: "#94a3b8" },
      { name: "Cancelled", value: cancelled, color: COLORS.red },
    ].filter((item) => item.value > 0);

    return {
      totalProjects,
      completed,
      inProgress,
      onHold,
      cancelled,
      planning,
      pending,
      prospective,
      potential,
      activeProjects,
      completionRate,
      recentProjects,
      statusData,
    };
  }, [projects]);

  // Calculate Risk Metrics
  const riskMetrics = useMemo(() => {
    const totalRisks = risks.length;
    const openRisks = risks.filter(
      (r) => r.status !== "resolved" && r.status !== "accepted"
    );

    const criticalRisks = openRisks.filter((r) => r.severity === "critical");
    const highRisks = openRisks.filter((r) => r.severity === "high");

    const financialExposure = openRisks.reduce(
      (sum, r) => sum + (r.estimated_financial_impact || 0),
      0
    );

    // Recent risks (last 5)
    const recentRisks = [...risks]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    return {
      totalRisks,
      openRisks: openRisks.length,
      criticalRisks: criticalRisks.length,
      highRisks: highRisks.length,
      financialExposure,
      recentRisks,
    };
  }, [risks]);

  // Calculate Client Metrics
  const clientMetrics = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === "active").length;
    const totalLifetimeValue = clients.reduce(
      (sum, c) => sum + (c.lifetime_value || 0),
      0
    );

    // Top clients by lifetime value
    const topClients = [...clients]
      .sort((a, b) => (b.lifetime_value || 0) - (a.lifetime_value || 0))
      .slice(0, 5);

    return {
      totalClients: clients.length,
      activeClients,
      totalLifetimeValue,
      topClients,
    };
  }, [clients]);

  // Calculate Quarterly Progress
  const quarterlyProgress = useMemo(() => {
    const currentDate = new Date();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
    const isCurrentYear = selectedYear === currentDate.getFullYear();

    // Get year target for quarter calculations
    const yearTarget = yearTargets.find((yt) => yt.year === selectedYear);
    const yearTargetMin = yearTarget?.minimum_amount || 0;
    const yearTargetMax = yearTarget?.maximum_amount || 0;

    const quarters = [1, 2, 3, 4].map((q) => {
      const quarterStartMonth = (q - 1) * 3 + 1;
      const quarterEndMonth = q * 3;
      
      // Calculate quarter date range
      const quarterStart = new Date(selectedYear, quarterStartMonth - 1, 1);
      const quarterEnd = new Date(selectedYear, quarterEndMonth, 0, 23, 59, 59, 999);
      
      // Calculate quarter actual from projects (like Q1 card)
      // Completed projects - use revenue when end_date is in this quarter
      const completedQuarterRevenue = projects
        .filter((p) => {
          if (p.status === "completed" && p.end_date) {
            const endDate = new Date(p.end_date);
            return endDate >= quarterStart && endDate <= quarterEnd;
          }
          return false;
        })
        .reduce((sum, p) => sum + (p.revenue || 0), 0);

      // In-progress projects - use amount_paid when payment_date is in this quarter
      const inProgressQuarterRevenue = projects
        .filter((p) => {
          if (p.status === "in-progress" && (p as any).payment_date) {
            const paymentDate = new Date((p as any).payment_date);
            return paymentDate >= quarterStart && paymentDate <= quarterEnd;
          }
          return false;
        })
        .reduce((sum, p) => sum + ((p as any).amount_paid || 0), 0);

      const quarterActual = completedQuarterRevenue + inProgressQuarterRevenue;
      
      // Get quarter targets from year target (divide by 4)
      const quarterTargetMin = yearTargetMin / 4;
      const quarterTargetMax = yearTargetMax / 4;
      
      // Use maximum target for progress calculation
      const quarterTarget = quarterTargetMax;

      return {
        quarter: q,
        target: quarterTarget,
        actual: quarterActual,
        progress: quarterTarget > 0 ? (quarterActual / quarterTarget) * 100 : 0,
        isCurrent: isCurrentYear && q === currentQuarter,
      };
    });

    return quarters;
  }, [projects, yearTargets, selectedYear]);

  const currentDate = new Date();
  const greeting =
    currentDate.getHours() < 12
      ? "Good Morning"
      : currentDate.getHours() < 18
      ? "Good Afternoon"
      : "Good Evening";

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {greeting}! 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Here's your company overview for {selectedYear}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Year:</label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
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
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            onClick={() => router.push("/admin?tab=revenue")}
          >
            <Target className="h-4 w-4 mr-2" />
            Manage Targets
          </Button>
        </div>
      </div>

      {/* Circular Progress Graphs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          // Calculate monthly target and actual
          const currentDate = new Date();
          const isCurrentYear = selectedYear === currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;

          // For current year, show current month. For past years, show last month. For future years, show first month.
          let monthToShow = currentMonth;
          if (!isCurrentYear && selectedYear < currentDate.getFullYear()) {
            monthToShow = 12; // Show December for past years
          } else if (
            !isCurrentYear &&
            selectedYear > currentDate.getFullYear()
          ) {
            monthToShow = 1; // Show January for future years
          }

          const monthTarget = revenueTargets.find((rt) => {
            const rtDate = new Date(rt.month);
            return (
              rtDate.getFullYear() === selectedYear &&
              rtDate.getMonth() + 1 === monthToShow
            );
          });
          const monthlyTarget = monthTarget?.target_amount || 0;
          const monthlyActual = monthTarget?.actual_amount || 0;
          const monthlyProgress =
            monthlyTarget > 0 ? (monthlyActual / monthlyTarget) * 100 : 0;

          // Calculate current quarter target and actual
          const currentQuarter = Math.floor((monthToShow - 1) / 3) + 1;
          const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
          const quarterEndMonth = currentQuarter * 3;
          
          // Calculate quarter actual from projects (like year target)
          const quarterStart = new Date(selectedYear, quarterStartMonth - 1, 1);
          const quarterEnd = new Date(selectedYear, quarterEndMonth, 0, 23, 59, 59, 999);
          
          // Completed projects - use revenue when end_date is in this quarter
          const completedQuarterRevenue = projects
            .filter((p) => {
              if (p.status === "completed" && p.end_date) {
                const endDate = new Date(p.end_date);
                return endDate >= quarterStart && endDate <= quarterEnd;
              }
              return false;
            })
            .reduce((sum, p) => sum + (p.revenue || 0), 0);

          // In-progress projects - use amount_paid when payment_date is in this quarter
          const inProgressQuarterRevenue = projects
            .filter((p) => {
              if (p.status === "in-progress" && (p as any).payment_date) {
                const paymentDate = new Date((p as any).payment_date);
                return paymentDate >= quarterStart && paymentDate <= quarterEnd;
              }
              return false;
            })
            .reduce((sum, p) => sum + ((p as any).amount_paid || 0), 0);

          const quarterActual = completedQuarterRevenue + inProgressQuarterRevenue;
          
          // Get quarter targets from year target
          const yearTarget = yearTargets.find((yt) => yt.year === selectedYear);
          const quarterTargetMin = yearTarget ? (yearTarget.minimum_amount / 4) : 0;
          const quarterTargetMax = yearTarget ? (yearTarget.maximum_amount / 4) : 0;
          
          const quarterProgressMin =
            quarterTargetMin > 0 ? (quarterActual / quarterTargetMin) * 100 : 0;
          const quarterProgressMax =
            quarterTargetMax > 0 ? (quarterActual / quarterTargetMax) * 100 : 0;

          // Calculate year targets (reuse yearTarget from above)
          const yearTargetMin = yearTarget?.minimum_amount || 0;
          const yearTargetMax = yearTarget?.maximum_amount || 0;

          // Calculate actual from projects (in-progress and completed) for the selected year
          // Sum all monthly actuals from projects: completed projects use revenue, in-progress use amount_paid
          const yearActualFromProjects = Array.from(
            { length: 12 },
            (_, monthIndex) => {
              const month = monthIndex + 1;
              const monthStart = new Date(selectedYear, monthIndex, 1);
              const monthEnd = new Date(
                selectedYear,
                monthIndex + 1,
                0,
                23,
                59,
                59,
                999
              );

              // Completed projects - use revenue when end_date is in this month
              const completedRevenue = projects
                .filter((p) => {
                  if (p.status === "completed" && p.end_date) {
                    const endDate = new Date(p.end_date);
                    return endDate >= monthStart && endDate <= monthEnd;
                  }
                  return false;
                })
                .reduce((sum, p) => sum + (p.revenue || 0), 0);

              // In-progress projects - use amount_paid when payment_date is in this month
              const inProgressRevenue = projects
                .filter((p) => {
                  if (p.status === "in-progress" && (p as any).payment_date) {
                    const paymentDate = new Date((p as any).payment_date);
                    return paymentDate >= monthStart && paymentDate <= monthEnd;
                  }
                  return false;
                })
                .reduce((sum, p) => sum + ((p as any).amount_paid || 0), 0);

              return completedRevenue + inProgressRevenue;
            }
          ).reduce((sum, monthActual) => sum + monthActual, 0);

          const yearActual = yearActualFromProjects;
          const yearMinProgress =
            yearTargetMin > 0 ? (yearActual / yearTargetMin) * 100 : 0;
          const yearMaxProgress =
            yearTargetMax > 0 ? (yearActual / yearTargetMax) * 100 : 0;

          const CircularProgressCard = ({
            title,
            percentage,
            targetAmount,
            actualAmount,
          }: {
            title: string;
            percentage: number;
            targetAmount: number;
            actualAmount: number;
          }) => {
            const size = 160;
            const strokeWidth = 12;
            const radius = (size - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            const offset =
              circumference - (Math.min(percentage, 100) / 100) * circumference;

            const getColor = () => {
              if (percentage >= 90) return COLORS.green;
              if (percentage >= 70) return COLORS.yellow;
              return COLORS.red;
            };

            const color = getColor();

            return (
              <Card className="border-2 group relative">
                <CardHeader className="pb-3">
                  <CardTitle className="text-center text-base font-semibold">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div
                    className="relative cursor-pointer"
                    style={{ width: size, height: size }}
                    title={`Actual: RM ${actualAmount.toLocaleString()}`}
                  >
                    <svg
                      width={size}
                      height={size}
                      className="transform -rotate-90"
                    >
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-muted opacity-20"
                      />
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {percentage.toFixed(2)}%
                      </span>
                    </div>
                    {/* Hover tooltip */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-background border border-border rounded-lg shadow-lg px-3 py-2 text-sm font-medium z-10">
                        Actual: RM {actualAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-center space-y-1 w-full">
                    <div className="text-lg font-bold">
                      RM {targetAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      RM {actualAmount.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          };

           // Q1 Card with navigation between minimum and target
           const Q1CardWithNavigation = () => {
             const [activeView, setActiveView] = useState<"minimum" | "target">("target");
             
             const currentPercentage = activeView === "minimum" ? quarterProgressMin : quarterProgressMax;
             const currentTarget = activeView === "minimum" ? quarterTargetMin : quarterTargetMax;
             
             return (
               <Card className="border-2 group relative">
                 <CardHeader className="pb-3">
                   <CardTitle className="text-center text-base font-semibold">
                     Q{currentQuarter} Target {selectedYear}
                   </CardTitle>
                   <div className="flex justify-center gap-2 mt-2">
                     <Button
                       variant={activeView === "minimum" ? "default" : "outline"}
                       size="sm"
                       onClick={() => setActiveView("minimum")}
                       className="h-7 text-xs"
                     >
                       Minimum
                     </Button>
                     <Button
                       variant={activeView === "target" ? "default" : "outline"}
                       size="sm"
                       onClick={() => setActiveView("target")}
                       className="h-7 text-xs"
                     >
                       Target
                     </Button>
                   </div>
                 </CardHeader>
                 <CardContent className="flex flex-col items-center gap-4">
                   <div
                     className="relative cursor-pointer"
                     style={{ width: 160, height: 160 }}
                     title={`Actual: RM ${quarterActual.toLocaleString()}`}
                   >
                     <svg
                       width={160}
                       height={160}
                       className="transform -rotate-90"
                     >
                       <circle
                         cx={80}
                         cy={80}
                         r={74}
                         fill="none"
                         stroke="currentColor"
                         strokeWidth={12}
                         className="text-muted opacity-20"
                       />
                       <circle
                         cx={80}
                         cy={80}
                         r={74}
                         fill="none"
                         stroke={
                           currentPercentage >= 90
                             ? COLORS.green
                             : currentPercentage >= 70
                             ? COLORS.yellow
                             : COLORS.red
                         }
                         strokeWidth={12}
                         strokeDasharray={2 * Math.PI * 74}
                         strokeDashoffset={
                           2 * Math.PI * 74 -
                           (Math.min(currentPercentage, 100) / 100) * 2 * Math.PI * 74
                         }
                         strokeLinecap="round"
                         className="transition-all duration-500 ease-out"
                       />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-2xl font-bold">
                         {currentPercentage.toFixed(2)}%
                       </span>
                     </div>
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       <div className="bg-background border border-border rounded-lg shadow-lg px-3 py-2 text-sm font-medium z-10">
                         Actual: RM {quarterActual.toLocaleString()}
                       </div>
                     </div>
                   </div>
                   <div className="text-center space-y-1 w-full">
                     <div className="text-lg font-bold">
                       RM {currentTarget.toLocaleString()}
                     </div>
                     <div className="text-sm text-muted-foreground">
                       RM {quarterActual.toLocaleString()}
                     </div>
                   </div>
                 </CardContent>
               </Card>
             );
           };

           return (
             <>
               <CircularProgressCard
                 title={`Month Target ${new Date(
                   selectedYear,
                   monthToShow - 1,
                   1
                 ).toLocaleDateString("en-US", {
                   month: "long",
                 })}`}
                 percentage={monthlyProgress}
                 targetAmount={monthlyTarget}
                 actualAmount={monthlyActual}
               />
               <Q1CardWithNavigation />
               <CircularProgressCard
                 title={`Minimum Target ${selectedYear}`}
                 percentage={yearMinProgress}
                 targetAmount={yearTargetMin}
                 actualAmount={yearActual}
               />
               <CircularProgressCard
                 title={`Target ${selectedYear}`}
                 percentage={yearMaxProgress}
                 targetAmount={yearTargetMax}
                 actualAmount={yearActual}
               />
             </>
           );
        })()}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Year Target Progress
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {revenueMetrics.yearProgress.toFixed(1)}%
            </div>
            <Progress value={revenueMetrics.yearProgress} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-2">
              RM{revenueMetrics.yearActual.toLocaleString()} of RM
              {revenueMetrics.yearTargetMax.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              RM
              {revenueMetrics.totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              From {projectHealth.completed} completed projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {projectHealth.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {projectHealth.inProgress} in progress, {projectHealth.completed}{" "}
              completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Risks</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {riskMetrics.openRisks}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {riskMetrics.criticalRisks} critical, {riskMetrics.highRisks} high
              priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Revenue Trend
                </CardTitle>
                <CardDescription>
                  Target vs Actual revenue for {selectedYear}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueMetrics.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "Target") {
                      return [`RM${value.toLocaleString()}`, "Target"];
                    } else if (name === "Actual") {
                      return [`RM${value.toLocaleString()}`, "Actual"];
                    }
                    return [`RM${value.toLocaleString()}`, name];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Target"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Actual"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Project Status Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of all projects by status
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={projectHealth.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectHealth.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Quarterly Progress
          </CardTitle>
          <CardDescription>
            Track your progress toward quarterly targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quarterlyProgress.map((q) => (
              <div
                key={q.quarter}
                className={`p-4 border-2 rounded-lg ${
                  q.isCurrent ? "bg-primary/5 border-primary" : "bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Q{q.quarter}</span>
                  {q.isCurrent && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold mb-2">
                  {q.progress.toFixed(1)}%
                </div>
                <Progress value={q.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  RM{q.actual.toLocaleString()} / RM{q.target.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row - Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Projects
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin?tab=projects")}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectHealth.recentProjects.length > 0 ? (
                projectHealth.recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin?tab=projects`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{project.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            project.status === "completed"
                              ? "default"
                              : project.status === "in-progress"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {project.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          RM{project.revenue?.toLocaleString() || "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No projects yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Risk Alerts
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin?tab=risks")}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskMetrics.recentRisks.length > 0 ? (
                riskMetrics.recentRisks.slice(0, 5).map((risk) => (
                  <div
                    key={risk.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin?tab=risks`)}
                  >
                    <div
                      className={`h-2 w-2 rounded-full mt-2 ${
                        risk.severity === "critical"
                          ? "bg-red-500"
                          : risk.severity === "high"
                          ? "bg-orange-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{risk.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            risk.severity === "critical"
                              ? "border-red-500 text-red-600"
                              : risk.severity === "high"
                              ? "border-orange-500 text-orange-600"
                              : "border-yellow-500 text-yellow-600"
                          }`}
                        >
                          {risk.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {risk.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No risks identified
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Clients</p>
                    <p className="text-xs text-muted-foreground">
                      {clientMetrics.activeClients} active
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {clientMetrics.totalClients}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Total Paid</p>
                    <p className="text-xs text-muted-foreground">
                      Payments received
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  RM{revenueMetrics.totalPaid.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Completion Rate</p>
                    <p className="text-xs text-muted-foreground">
                      Projects completed
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {projectHealth.completionRate.toFixed(1)}%
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Lifetime Value</p>
                    <p className="text-xs text-muted-foreground">All clients</p>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  RM{clientMetrics.totalLifetimeValue.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to important sections quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => router.push("/admin?tab=revenue")}
            >
              <Target className="h-5 w-5 mb-2" />
              <span>Revenue Targets</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => router.push("/admin?tab=projects")}
            >
              <Briefcase className="h-5 w-5 mb-2" />
              <span>Projects</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => router.push("/admin?tab=risks")}
            >
              <AlertTriangle className="h-5 w-5 mb-2" />
              <span>Risks</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => router.push("/admin?tab=financials")}
            >
              <DollarSign className="h-5 w-5 mb-2" />
              <span>Financials</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
