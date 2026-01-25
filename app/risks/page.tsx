import { prisma } from "@/lib/prisma";
import { autoGenerateRisksFromTasks } from "@/lib/risk-generator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Shield, CheckCircle } from "lucide-react";
import { RiskAutoRefresh } from "@/components/risk-auto-refresh";

export default async function RisksPage() {
  // Auto-generate risks from tasks with approaching deadlines
  try {
    await autoGenerateRisksFromTasks();
  } catch (error) {
    // Silently fail if auto-generation doesn't work
    console.error("Failed to auto-generate risks:", error);
  }

  const risks = await prisma.risk.findMany({
    orderBy: {
      severity: "desc",
    },
  });

  const risksData = risks.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    severity: r.severity,
    probability: r.probability,
    impact: r.impact,
    mitigation_plan: r.mitigationPlan,
    status: r.status,
    owner: r.owner,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }));

  const criticalRisks = risksData.filter((r) => r.severity === "critical");
  const highRisks = risksData.filter((r) => r.severity === "high");
  const activeRisks = risksData.filter(
    (r) => r.status === "identified" || r.status === "mitigating"
  );
  const resolvedRisks = risksData.filter((r) => r.status === "resolved");

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
  const risksByCategory = risksData.reduce((acc, risk) => {
    const category = risk.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(risk);
    return acc;
  }, {} as Record<string, typeof risksData>);

  return (
    <div className="space-y-6">
      <RiskAutoRefresh />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Risk Monitoring System
        </h1>
        <p className="text-muted-foreground">
          Identify, track, and mitigate business risks. Risks are automatically generated from tasks with approaching deadlines.
        </p>
      </div>

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
            <div className="text-2xl font-bold">{risksData.length}</div>
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
            <CheckCircle className="h-4 w-4 text-green-600" />
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
                                      risk.probability
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
