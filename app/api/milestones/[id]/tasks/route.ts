import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all tasks for a milestone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasks = await (prisma as any).task.findMany({
      where: { milestoneId: id },
      orderBy: { createdAt: "asc" },
    });

    const formatted = tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      developer_id: task.developerId,
      milestone_id: task.milestoneId,
      project_id: task.projectId,
      estimated_hours: task.estimatedHours ? Number(task.estimatedHours) : null,
      actual_hours: Number(task.actualHours),
      due_date: task.dueDate?.toISOString().split("T")[0] || null,
      priority: task.priority,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}

// POST create a new task in a milestone
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: milestoneId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      developer_id,
      priority,
      due_date,
      estimated_hours,
      project_id,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!developer_id) {
      return NextResponse.json(
        { error: "Developer is required" },
        { status: 400 }
      );
    }

    // Get milestone to validate and get project_id
    const milestone = await (prisma as any).milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Validate due date is not earlier than milestone start date
    if (due_date && milestone.startDate) {
      const taskDueDate = new Date(due_date);
      const milestoneStartDate = new Date(milestone.startDate);
      if (taskDueDate < milestoneStartDate) {
        return NextResponse.json(
          {
            error:
              "Task due date cannot be earlier than milestone start date",
          },
          { status: 400 }
        );
      }
    }

    const task = await (prisma as any).task.create({
      data: {
        title,
        description: description || null,
        status: "todo",
        developerId: developer_id,
        projectId: project_id || milestone.projectId,
        milestoneId: milestoneId,
        priority: priority || "medium",
        dueDate: due_date ? new Date(due_date) : null,
        estimatedHours: estimated_hours
          ? Number.parseFloat(estimated_hours.toString())
          : null,
        actualHours: 0,
      },
    });

    // Update milestone status if needed
    const allTasks = await (prisma as any).task.findMany({
      where: { milestoneId },
    });
    const completedTasks = allTasks.filter((t: any) => t.status === "done");
    if (allTasks.length > 0 && completedTasks.length === allTasks.length) {
      await (prisma as any).milestone.update({
        where: { id: milestoneId },
        data: { status: "completed" },
      });
    } else if (allTasks.length > 0 && completedTasks.length > 0) {
      await (prisma as any).milestone.update({
        where: { id: milestoneId },
        data: { status: "in-progress" },
      });
    }

    const formatted = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      developer_id: task.developerId,
      milestone_id: task.milestoneId,
      project_id: task.projectId,
      estimated_hours: task.estimatedHours ? Number(task.estimatedHours) : null,
      actual_hours: Number(task.actualHours),
      due_date: task.dueDate?.toISOString().split("T")[0] || null,
      priority: task.priority,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task", details: error.message },
      { status: 500 }
    );
  }
}

