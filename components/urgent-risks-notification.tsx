"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  X,
  ExternalLink,
  ListTodo,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UrgentRisksNotification() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [risks, setRisks] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if notification has been shown in this session
    const notificationShown = sessionStorage.getItem("urgentRisksNotificationShown");
    
    // Check if user just logged in (check for login timestamp)
    const loginTime = sessionStorage.getItem("loginTime");
    const currentTime = Date.now();
    const justLoggedIn = loginTime && (currentTime - parseInt(loginTime)) < 10000; // Within 10 seconds
    
    // Fetch urgent risks and tasks
    const fetchUrgentItems = async () => {
      try {
        const response = await fetch("/api/risks/urgent");
        if (response.ok) {
          const data = await response.json();
          setRisks(data.risks || []);
          setTasks(data.tasks || []);

          // Show notification if:
          // 1. There are urgent items
          // 2. Either it hasn't been shown OR user just logged in
          if (
            (data.risks?.length > 0 || data.tasks?.length > 0) &&
            (!notificationShown || justLoggedIn)
          ) {
            setOpen(true);
            sessionStorage.setItem("urgentRisksNotificationShown", "true");
          }
        }
      } catch (error) {
        console.error("Failed to fetch urgent risks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUrgentItems();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-500";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-500";
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

  const handleViewRisks = () => {
    setOpen(false);
    router.push("/risks");
  };

  const handleViewTasks = () => {
    setOpen(false);
    router.push("/");
  };

  const handleViewTask = (taskId: string, projectId: string | null) => {
    setOpen(false);
    if (projectId) {
      router.push(`/projects/${projectId}`);
    } else {
      router.push("/");
    }
  };

  const handleViewRisk = (riskId: string) => {
    setOpen(false);
    router.push("/risks");
    // Scroll to risk after navigation (will be handled by risks page)
    setTimeout(() => {
      const element = document.getElementById(`risk-${riskId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 500);
  };

  if (loading || (!risks.length && !tasks.length)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <DialogTitle className="text-xl font-bold">
              Urgent Risks & Task Deadlines
            </DialogTitle>
          </div>
          <DialogDescription>
            You have {risks.length} urgent risk{risks.length !== 1 ? "s" : ""} and{" "}
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} with approaching deadlines
            that require your attention.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Urgent Risks Section */}
          {risks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Urgent Risks ({risks.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewRisks}
                >
                  View All Risks
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <div className="space-y-2">
                {risks.slice(0, 5).map((risk) => (
                  <Card key={risk.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{risk.title}</h4>
                            <Badge className={getSeverityColor(risk.severity)}>
                              {risk.severity}
                            </Badge>
                            {risk.category && (
                              <Badge variant="outline" className="text-xs">
                                {risk.category}
                              </Badge>
                            )}
                          </div>
                          {risk.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {risk.description}
                            </p>
                          )}
                          {risk.project && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Project: {risk.project.name}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRisk(risk.id)}
                          className="ml-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {risks.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    + {risks.length - 5} more risk{risks.length - 5 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Urgent Tasks Section */}
          {tasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Tasks with Approaching Deadlines ({tasks.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewTasks}
                >
                  View My Tasks
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <div className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <Card
                    key={task.id}
                    className={`border-l-4 ${
                      task.is_overdue
                        ? "border-l-red-500"
                        : "border-l-blue-500"
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{task.title}</h4>
                            {task.is_overdue ? (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500">
                                OVERDUE
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500">
                                Due Soon
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {task.status}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {formatDate(task.due_date)}
                            </span>
                            {task.days_until_due !== null && (
                              <span
                                className={
                                  task.is_overdue
                                    ? "text-red-600 font-medium"
                                    : "text-blue-600 font-medium"
                                }
                              >
                                {task.is_overdue
                                  ? `${Math.abs(task.days_until_due)} day(s) overdue`
                                  : `Due in ${task.days_until_due} day(s)`}
                              </span>
                            )}
                          </div>
                          {task.project && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Project: {task.project.name}
                            </p>
                          )}
                        </div>
                        {task.project?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTask(task.id, task.project.id)}
                            className="ml-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {tasks.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    + {tasks.length - 5} more task{tasks.length - 5 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Dismiss
          </Button>
          <Button onClick={handleViewRisks}>
            <ListTodo className="h-4 w-4 mr-2" />
            View All Risks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

