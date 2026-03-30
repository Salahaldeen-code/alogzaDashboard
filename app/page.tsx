"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  Timer,
  Target,
  TrendingUp,
  FolderKanban,
  Loader2,
} from "lucide-react";
import type { Task, Developer, Project } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { UrgentRisksNotification } from "@/components/urgent-risks-notification";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DeveloperDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    estimated_hours: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });
  const [trackingTaskId, setTrackingTaskId] = useState<string | null>(null);
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("0h 0m");
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (!trackingStartTime) {
      setElapsedTime("0h 0m");
      return;
    }

    const interval = setInterval(() => {
      const elapsed =
        (new Date().getTime() - trackingStartTime.getTime()) / (1000 * 60 * 60);
      setElapsedTime(formatDuration(elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [trackingStartTime]);

  // Fetch current user session
  const { data: sessionData } = useSWR("/api/auth/session", fetcher);

  // Fetch developers to find current user's developer record
  const { data: developers = [] } = useSWR<Developer[]>(
    "/api/developers",
    fetcher
  );
  const currentDeveloper = developers.find(
    (d) => d.email === sessionData?.user?.email
  );

  // Fetch all tasks for the logged-in user's developer record
  const { data: tasks = [], error, mutate: mutateTasks } = useSWR<Task[]>(
    currentDeveloper?.id
      ? `/api/tasks?developer_id=${currentDeveloper.id}`
      : null,
    fetcher
  );

  // Fetch projects for reference
  const { data: projects = [] } = useSWR<Project[]>("/api/projects", fetcher);

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.project_id || "unassigned";
    const projectName = task.project?.name || "Unassigned";
    if (!acc[projectId]) {
      acc[projectId] = {
        projectId,
        projectName,
        tasks: [],
      };
    }
    acc[projectId].tasks.push(task);
    return acc;
  }, {} as Record<string, { projectId: string | null; projectName: string; tasks: Task[] }>);

  const projectGroups = Object.values(tasksByProject);

  // Calculate statistics
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "done").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    totalEstimated: tasks.reduce(
      (sum, t) => sum + (t.estimated_hours || 0),
      0
    ),
    totalActual: tasks.reduce((sum, t) => sum + t.actual_hours, 0),
  };

  const handleStartTracking = async (taskId: string) => {
    // Verify this is the user's task
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.developer_id !== currentDeveloper?.id) {
      toast({
        title: "Error",
        description: "You can only track your own tasks",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in-progress",
          start_time: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start tracking");
      }

      setTrackingTaskId(taskId);
      setTrackingStartTime(new Date());
      mutateTasks();
      toast({ title: "Started tracking time" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStopTracking = async (taskId: string) => {
    if (!trackingStartTime) return;

    // Verify this is the user's task
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.developer_id !== currentDeveloper?.id) {
      toast({
        title: "Error",
        description: "You can only track your own tasks",
        variant: "destructive",
      });
      return;
    }

    try {
      const elapsedHours =
        (new Date().getTime() - trackingStartTime.getTime()) / (1000 * 60 * 60);
      const newActualHours = (task?.actual_hours || 0) + elapsedHours;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          end_time: new Date().toISOString(),
          actual_hours: newActualHours,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to stop tracking");
      }

      setTrackingTaskId(null);
      setTrackingStartTime(null);
      mutateTasks();
      toast({ title: "Stopped tracking time" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Verify this is the user's task
    const task = tasks.find((t) => t.id === taskId);
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
        throw new Error(errorData.error || "Failed to update status");
      }

      mutateTasks();
      toast({ title: "Task status updated successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taskSubmitting) return;

    if (!currentDeveloper) {
      toast({
        title: "Error",
        description: "Developer record not found. Please contact an administrator.",
        variant: "destructive",
      });
      return;
    }

    setTaskSubmitting(true);
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const method = editingTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          developer_id: currentDeveloper.id,
          project_id: formData.project_id || null,
          estimated_hours: formData.estimated_hours
            ? parseFloat(formData.estimated_hours)
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save task");
      }

      toast({
        title: `Task ${editingTask ? "updated" : "created"} successfully`,
      });
      mutateTasks();
      setOpen(false);
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        project_id: "",
        estimated_hours: "",
        due_date: "",
        priority: "medium",
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

  const getElapsedTime = () => {
    if (!trackingStartTime) return "0h 0m";
    const elapsed =
      (new Date().getTime() - trackingStartTime.getTime()) / (1000 * 60 * 60);
    return formatDuration(elapsed);
  };

  // Clear invalid/expired session and redirect to login
  useEffect(() => {
    if (sessionData !== undefined && sessionData.user === null) {
      fetch("/api/auth/logout", { method: "POST" }).finally(() => {
        router.push("/login");
      });
    }
  }, [sessionData, router]);

  // Redirect admin users to admin panel
  useEffect(() => {
    if (sessionData?.user?.role === "admin") {
      router.push("/admin");
    }
  }, [sessionData?.user, router]);

  // Show loading state while fetching session
  if (sessionData === undefined) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Invalid or expired session — logout + redirect (useEffect above)
  if (!sessionData.user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-muted-foreground">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Show redirect message for admin users
  if (sessionData.user.role === "admin") {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-muted-foreground">
            Redirecting to admin panel...
          </p>
        </div>
      </div>
    );
  }

  // Show message if user doesn't have a developer record
  if (!currentDeveloper) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            No Developer Record Found
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Your account ({sessionData.user.email}) is not associated with a developer record.
            Please contact an administrator to set up your developer profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UrgentRisksNotification />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Tasks Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your tasks, manage your time, and monitor your progress across all projects
          </p>
          {currentDeveloper && (
            <p className="text-sm text-muted-foreground mt-1">
              Logged in as: {currentDeveloper.name} ({currentDeveloper.role})
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {currentDeveloper && (
            <Button
              onClick={() => {
                setEditingTask(null);
                setFormData({
                  title: "",
                  description: "",
                  project_id: "",
                  estimated_hours: "",
                  due_date: "",
                  priority: "medium",
                });
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {currentDeveloper && (
        <>
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tasks
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All tasks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">To Do</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todo}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Progress
                </CardTitle>
                <Play className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.inProgress}
                </div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </div>
                <p className="text-xs text-muted-foreground">Done</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blocked</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.blocked}
                </div>
                <p className="text-xs text-muted-foreground">Issues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(stats.totalEstimated)}
                </div>
                <p className="text-xs text-muted-foreground">Total hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actual</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(stats.totalActual)}
                </div>
                <p className="text-xs text-muted-foreground">Time spent</p>
              </CardContent>
            </Card>
          </div>

          {/* Time Tracking Banner */}
          {trackingTaskId && (
            <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <Pause className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Tracking Time</p>
                      <p className="text-2xl font-bold">{elapsedTime}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleStopTracking(trackingTaskId)}
                    variant="destructive"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Tracking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks List - Grouped by Project */}
          <div className="space-y-6">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No tasks assigned. Click "Add Task" to create one.
                  </p>
                </CardContent>
              </Card>
            ) : (
              projectGroups.map((group) => (
                <Card key={group.projectId || "unassigned"}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5" />
                      {group.projectName}
                      <Badge variant="outline" className="ml-2">
                        {group.tasks.length} {group.tasks.length === 1 ? "task" : "tasks"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {group.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-4 border rounded-lg bg-card"
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              {task.title}
                            </h3>
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
                        </div>
                        <div className="flex gap-2">
                          {task.status !== "done" &&
                            task.status !== "blocked" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (trackingTaskId === task.id) {
                                    handleStopTracking(task.id);
                                  } else {
                                    if (trackingTaskId) {
                                      handleStopTracking(trackingTaskId);
                                    }
                                    handleStartTracking(task.id);
                                  }
                                }}
                                className={
                                  trackingTaskId === task.id
                                    ? "bg-blue-500 text-white"
                                    : ""
                                }
                              >
                                {trackingTaskId === task.id ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Stop
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start
                                  </>
                                )}
                              </Button>
                            )}
                          <Select
                            value={task.status}
                            onValueChange={(value) =>
                              handleStatusChange(task.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="done">
                                Done
                              </SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTask(task);
                              setFormData({
                                title: task.title,
                                description: task.description || "",
                                project_id: task.project_id || "",
                                estimated_hours:
                                  task.estimated_hours?.toString() || "",
                                due_date: task.due_date || "",
                                priority: task.priority,
                              });
                              setOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Estimated Hours
                          </div>
                          <div className="text-sm font-medium">
                            {task.estimated_hours
                              ? formatDuration(task.estimated_hours)
                              : "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Actual Hours
                          </div>
                          <div className="text-sm font-medium">
                            {formatDuration(task.actual_hours)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Due Date
                          </div>
                          <div className="text-sm font-medium">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : "No due date"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Progress
                          </div>
                          <div className="text-sm font-medium">
                            {task.estimated_hours
                              ? `${Math.min(
                                  (task.actual_hours / task.estimated_hours) *
                                    100,
                                  100
                                ).toFixed(0)}%`
                              : "N/A"}
                          </div>
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
        </>
      )}

      {/* Add/Edit Task Dialog */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setTaskSubmitting(false);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            <DialogDescription>
              {editingTask
                ? "Update task details and information"
                : "Assign a new task to the selected developer"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority: value })
                  }
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimated_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimated_hours: e.target.value,
                    })
                  }
                />
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
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={taskSubmitting}
                onClick={() => {
                  setOpen(false);
                  setEditingTask(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={taskSubmitting}>
                {taskSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingTask ? "Saving…" : "Creating…"}
                  </>
                ) : editingTask ? (
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
