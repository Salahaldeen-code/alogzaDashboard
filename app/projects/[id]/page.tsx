"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  ArrowLeft,
  FolderKanban,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  GanttChart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  // Fetch project details
  const { data: project, error: projectError } = useSWR(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher
  );

  // Fetch milestones with tasks
  const { data: milestones, mutate: mutateMilestones } = useSWR(
    projectId ? `/api/projects/${projectId}/milestones` : null,
    fetcher
  );

  // Fetch current user session
  const { data: sessionData } = useSWR("/api/auth/session", fetcher);
  const currentUser = sessionData?.user;

  // Find developer record for current user
  const { data: developers } = useSWR("/api/developers", fetcher);
  const currentDeveloper = developers?.find(
    (d: any) => d.email === currentUser?.email
  );

  // Get user's tasks
  const userTasks =
    milestones
      ?.flatMap((milestone: any) => milestone.tasks || [])
      .filter((task: any) => task.developer_id === currentDeveloper?.id) || [];

  // Check if user has access to this project
  const { data: projectDevelopers } = useSWR(
    projectId ? `/api/projects/${projectId}/developers` : null,
    fetcher
  );

  // Check if user has access (admin or assigned developer)
  // Allow access while data is loading, then check properly
  const hasAccess =
    !currentUser || // Still loading
    currentUser?.role === "admin" ||
    (currentDeveloper &&
      projectDevelopers &&
      (projectDevelopers.some(
        (pd: any) => pd.developer_id === currentDeveloper.id
      ) ||
        userTasks.length > 0));

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    // Verify this is the user's task
    const task = milestones
      ?.flatMap((milestone: any) => milestone.tasks || [])
      .find((t: any) => t.id === taskId);

    if (!task) {
      toast({
        title: "Error",
        description: "Task not found",
        variant: "destructive",
      });
      return;
    }

    if (task.developer_id !== currentDeveloper?.id) {
      toast({
        title: "Error",
        description: "You can only update your own tasks",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update task");
      }

      toast({
        title: "Task status updated successfully",
      });
      mutateMilestones();
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

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500";
      case "blocked":
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

  if (projectError) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-lg font-medium text-destructive">
            Failed to load project
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Check access after project is loaded and user data is available
  if (
    currentUser &&
    currentDeveloper !== undefined &&
    projectDevelopers !== undefined &&
    !hasAccess
  ) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-lg font-medium text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            You don't have access to this project.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const budgetUsed = project.budget
    ? (project.actual_cost / project.budget) * 100
    : 0;
  const isOverBudget = budgetUsed > 100;
  const projectMargin =
    project.revenue > 0
      ? ((project.revenue - project.actual_cost) / project.revenue) * 100
      : 0;

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/projects")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>Start: {formatDate(project.start_date)}</div>
              <div>End: {formatDate(project.end_date)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>
                RM {(project.budget || 0).toLocaleString()} / RM{" "}
                {project.actual_cost.toLocaleString()}
              </div>
              {isOverBudget && (
                <div className="text-destructive text-xs mt-1">
                  Over budget by{" "}
                  {(
                    ((budgetUsed - 100) * (project.budget || 0)) /
                    100
                  ).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>RM {project.revenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                Margin: {projectMargin.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks Section */}
      {currentDeveloper && userTasks.length > 0 && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              My Tasks ({userTasks.length})
            </CardTitle>
            <CardDescription>
              Tasks assigned to you in this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userTasks.map((task: any) => {
                const milestone = milestones?.find((m: any) =>
                  m.tasks?.some((t: any) => t.id === task.id)
                );
                return (
                  <div
                    key={task.id}
                    className="p-4 border rounded-lg bg-primary/5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status === "todo"
                              ? "Todo"
                              : task.status === "in-progress"
                              ? "In Progress"
                              : task.status === "done"
                              ? "Done"
                              : "Blocked"}
                          </Badge>
                          {task.priority && (
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {task.description}
                          </p>
                        )}
                        {milestone && (
                          <p className="text-xs text-muted-foreground">
                            Milestone: {milestone.title}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {task.due_date && (
                            <span>Due: {formatDate(task.due_date)}</span>
                          )}
                          {task.estimated_hours && (
                            <span>Est: {task.estimated_hours}h</span>
                          )}
                          {task.actual_hours > 0 && (
                            <span>Actual: {task.actual_hours}h</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Select
                          value={task.status}
                          onValueChange={(value) =>
                            handleTaskStatusUpdate(task.id, value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">Todo</SelectItem>
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones & Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GanttChart className="h-5 w-5" />
            Milestones & Tasks
          </CardTitle>
          <CardDescription>
            All project milestones and their associated tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {milestones && milestones.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {milestones.map((milestone: any) => (
                <AccordionItem key={milestone.id} value={milestone.id}>
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
                                Start: {formatDate(milestone.start_date)}
                              </span>
                            )}
                            {milestone.due_date && (
                              <span>Due: {formatDate(milestone.due_date)}</span>
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
                    <div className="space-y-3 pt-4">
                      {milestone.tasks && milestone.tasks.length > 0 ? (
                        milestone.tasks.map((task: any) => {
                          const isMyTask =
                            task.developer_id === currentDeveloper?.id;
                          return (
                            <div
                              key={task.id}
                              className={`p-4 border rounded-lg ${
                                isMyTask ? "bg-primary/5 border-primary/20" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium">
                                      {task.title}
                                    </h4>
                                    {isMyTask && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        My Task
                                      </Badge>
                                    )}
                                    <Badge
                                      className={getTaskStatusColor(
                                        task.status
                                      )}
                                    >
                                      {task.status === "todo"
                                        ? "Todo"
                                        : task.status === "in-progress"
                                        ? "In Progress"
                                        : task.status === "done"
                                        ? "Done"
                                        : "Blocked"}
                                    </Badge>
                                    {task.priority && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {task.priority}
                                      </Badge>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    {task.due_date && (
                                      <span>
                                        Due: {formatDate(task.due_date)}
                                      </span>
                                    )}
                                    {task.estimated_hours && (
                                      <span>Est: {task.estimated_hours}h</span>
                                    )}
                                    {task.actual_hours > 0 && (
                                      <span>Actual: {task.actual_hours}h</span>
                                    )}
                                  </div>
                                </div>
                                {isMyTask && (
                                  <div className="ml-4">
                                    <Select
                                      value={task.status}
                                      onValueChange={(value) =>
                                        handleTaskStatusUpdate(task.id, value)
                                      }
                                    >
                                      <SelectTrigger className="w-40">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="todo">
                                          Todo
                                        </SelectItem>
                                        <SelectItem value="in-progress">
                                          In Progress
                                        </SelectItem>
                                        <SelectItem value="done">
                                          Done
                                        </SelectItem>
                                        <SelectItem value="blocked">
                                          Blocked
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 border border-dashed rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">
                            No tasks in this milestone
                          </p>
                        </div>
                      )}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
