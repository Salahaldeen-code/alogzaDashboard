import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all milestones for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const milestones = await (prisma as any).milestone.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
      include: {
        tasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const formatted = milestones.map((milestone: any) => {
      const tasks = milestone.tasks || [];
      const completedTasks = tasks.filter(
        (t: any) => t.status === "done"
      ).length;
      const totalTasks = tasks.length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Auto-update milestone status based on tasks
      let autoStatus = milestone.status;
      if (totalTasks > 0) {
        if (completedTasks === totalTasks) {
          autoStatus = "completed";
        } else if (completedTasks > 0) {
          autoStatus = "in-progress";
        } else {
          autoStatus = "not-started";
        }
      }

      return {
        id: milestone.id,
        project_id: milestone.projectId,
        title: milestone.title,
        description: milestone.description,
        start_date: milestone.startDate?.toISOString().split("T")[0] || null,
        due_date: milestone.dueDate?.toISOString().split("T")[0] || null,
        status: autoStatus,
        order: milestone.order,
        progress,
        task_count: totalTasks,
        completed_task_count: completedTasks,
        created_at: milestone.createdAt.toISOString(),
        updated_at: milestone.updatedAt.toISOString(),
        tasks: tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          developer_id: task.developerId,
          milestone_id: task.milestoneId,
          estimated_hours: task.estimatedHours
            ? Number(task.estimatedHours)
            : null,
          actual_hours: Number(task.actualHours),
          due_date: task.dueDate?.toISOString().split("T")[0] || null,
          priority: task.priority,
          created_at: task.createdAt.toISOString(),
          updated_at: task.updatedAt.toISOString(),
        })),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error fetching milestones:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Failed to fetch milestones", 
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST create a new milestone
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, start_date, due_date, status, order } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Get the max order for this project
    const maxOrder = await (prisma as any).milestone.findFirst({
      where: { projectId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const milestone = await (prisma as any).milestone.create({
      data: {
        projectId: id,
        title,
        description: description || null,
        startDate: start_date ? new Date(start_date) : null,
        dueDate: due_date ? new Date(due_date) : null,
        status: status || "not-started",
        order: order !== undefined ? order : (maxOrder?.order || 0) + 1,
      },
      include: {
        tasks: true,
      },
    });

    const formatted = {
      id: milestone.id,
      project_id: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      start_date: milestone.startDate?.toISOString().split("T")[0] || null,
      due_date: milestone.dueDate?.toISOString().split("T")[0] || null,
      status: milestone.status,
      order: milestone.order,
      progress: 0,
      task_count: 0,
      completed_task_count: 0,
      created_at: milestone.createdAt.toISOString(),
      updated_at: milestone.updatedAt.toISOString(),
      tasks: [],
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error: any) {
    console.error("Error creating milestone:", error);
    return NextResponse.json(
      { error: "Failed to create milestone", details: error.message },
      { status: 500 }
    );
  }
}

