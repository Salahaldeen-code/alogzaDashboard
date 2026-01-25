import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProjectsPage() {
  // Get current user session
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // If user is admin, show all projects
  type ProjectWithClient = Awaited<ReturnType<typeof prisma.project.findMany<{
    include: { client: { select: { id: true; name: true } } }
  }>>>;
  let projects: ProjectWithClient;
  if (session.role === "admin") {
    projects = await prisma.project.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });
  } else {
    // For non-admin users, find the developer record by email
    const developer = await prisma.developer.findFirst({
      where: {
        email: session.email,
      },
    });

    if (!developer) {
      // If no developer record found, show no projects
      projects = [] as ProjectWithClient;
    } else {
      // Find projects where the developer is assigned
      // Either via ProjectDeveloper or via Tasks
      const projectDeveloperAssignments =
        await prisma.projectDeveloper.findMany({
          where: {
            developerId: developer.id,
          },
          select: {
            projectId: true,
          },
        });

      const taskAssignments = await prisma.task.findMany({
        where: {
          developerId: developer.id,
        },
        select: {
          projectId: true,
        },
        distinct: ["projectId"],
      });

      // Get unique project IDs
      const projectIds = [
        ...new Set([
          ...projectDeveloperAssignments.map((pd) => pd.projectId),
          ...taskAssignments
            .map((t) => t.projectId)
            .filter((id): id is string => id !== null),
        ]),
      ];

      if (projectIds.length === 0) {
        projects = [] as ProjectWithClient;
      } else {
        projects = await prisma.project.findMany({
          where: {
            id: {
              in: projectIds,
            },
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startDate: "desc",
          },
        });
      }
    }
  }

  const projectsData = projects.map((p) => ({
    id: p.id,
    client_id: p.clientId,
    name: p.name,
    description: p.description,
    status: p.status,
    start_date: p.startDate?.toISOString().split("T")[0] || null,
    end_date: p.endDate?.toISOString().split("T")[0] || null,
    budget: p.budget ? Number(p.budget) : null,
    actual_cost: Number(p.actualCost),
    revenue: Number(p.revenue),
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    clients: p.client,
  }));

  const activeProjects = projectsData.filter((p) => p.status === "in-progress");
  const completedProjects = projectsData.filter(
    (p) => p.status === "completed"
  );

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Project Management
        </h1>
        <p className="text-muted-foreground">
          Track project progress, budgets, and revenue
        </p>
      </div>

      {/* Project Summary */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsData.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects.length} active, {completedProjects.length}{" "}
              completed
            </p>
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
        </CardHeader>
        <CardContent>
          {projectsData.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No projects assigned
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {session.role === "admin"
                  ? "Create a new project to get started"
                  : "You don't have any projects assigned yet. Contact your administrator."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectsData.map((project) => {
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold hover:text-primary">
                                  {project.name}
                                </h3>
                                <Badge
                                  className={getStatusColor(project.status)}
                                >
                                  {project.status}
                                </Badge>
                              </div>
                              {project.clients && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Client: {project.clients.name}
                                </p>
                              )}
                              {project.description && (
                                <p className="text-sm text-muted-foreground">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-1">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                Timeline
                              </div>
                              <div className="text-sm font-medium">
                                {formatDate(project.start_date)} -{" "}
                                {formatDate(project.end_date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
