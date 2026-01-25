import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { autoGenerateRisksFromTasks } from "@/lib/risk-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await (prisma as any).task.findUnique({
      where: { id },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const formatted = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      developer_id: task.developerId,
      project_id: task.projectId,
      estimated_hours: task.estimatedHours ? Number(task.estimatedHours) : null,
      actual_hours: Number(task.actualHours),
      start_time: task.startTime?.toISOString() || null,
      end_time: task.endTime?.toISOString() || null,
      due_date: task.dueDate?.toISOString().split("T")[0] || null,
      priority: task.priority,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
      developer: task.developer
        ? {
            id: task.developer.id,
            name: task.developer.name,
            role: task.developer.role,
          }
        : null,
      project: task.project
        ? {
            id: task.project.id,
            name: task.project.name,
          }
        : null,
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      status,
      developer_id,
      project_id,
      estimated_hours,
      actual_hours,
      start_time,
      end_time,
      due_date,
      priority,
    } = body;

    // Get current session for permission checks
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current task to check permissions and milestone
    const currentTask = await (prisma as any).task.findUnique({
      where: { id },
      include: {
        developer: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!currentTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Permission check: Only allow users to update their own tasks unless they're admin
    // Find developer record for current user
    const currentDeveloper = session.email
      ? await (prisma as any).developer.findFirst({
          where: { email: session.email },
        })
      : null;

    const isTaskOwner = currentDeveloper && currentTask.developerId === currentDeveloper.id;
    const isAdmin = session.role === "admin";

    if (!isAdmin && !isTaskOwner) {
      return NextResponse.json(
        { error: "You can only update your own tasks" },
        { status: 403 }
      );
    }

    // Admins can change developer_id, but regular users cannot
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;
    if (isAdmin && developer_id !== undefined) updateData.developerId = developer_id;
    if (isAdmin && project_id !== undefined) updateData.projectId = project_id || null;
    if (estimated_hours !== undefined)
      updateData.estimatedHours = estimated_hours
        ? parseFloat(estimated_hours)
        : null;
    if (actual_hours !== undefined)
      updateData.actualHours = parseFloat(actual_hours);
    if (start_time !== undefined)
      updateData.startTime = start_time ? new Date(start_time) : null;
    if (end_time !== undefined)
      updateData.endTime = end_time ? new Date(end_time) : null;
    if (due_date !== undefined) {
      if (due_date && due_date.trim() !== "") {
        // Ensure it's a valid date string, convert to Date object
        updateData.dueDate = new Date(due_date);
      } else {
        updateData.dueDate = null;
      }
    }
    if (priority !== undefined) updateData.priority = priority;

    const task = await (prisma as any).task.update({
      where: { id },
      data: updateData,
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update milestone status if task status changed and milestone exists
    if (status !== undefined && currentTask?.milestoneId) {
      const allTasks = await (prisma as any).task.findMany({
        where: { milestoneId: currentTask.milestoneId },
      });
      const completedTasks = allTasks.filter((t: any) => t.status === "done");
      const totalTasks = allTasks.length;

      if (totalTasks > 0) {
        let newMilestoneStatus = "not-started";
        if (completedTasks.length === totalTasks) {
          newMilestoneStatus = "completed";
        } else if (completedTasks.length > 0) {
          newMilestoneStatus = "in-progress";
        }

        await (prisma as any).milestone.update({
          where: { id: currentTask.milestoneId },
          data: { status: newMilestoneStatus },
        });
      }
    }

    const formatted = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      developer_id: task.developerId,
      project_id: task.projectId,
      estimated_hours: task.estimatedHours ? Number(task.estimatedHours) : null,
      actual_hours: Number(task.actualHours),
      start_time: task.startTime?.toISOString() || null,
      end_time: task.endTime?.toISOString() || null,
      due_date: task.dueDate?.toISOString().split("T")[0] || null,
      priority: task.priority,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
      developer: task.developer
        ? {
            id: task.developer.id,
            name: task.developer.name,
            role: task.developer.role,
          }
        : null,
      project: task.project
        ? {
            id: task.project.id,
            name: task.project.name,
          }
        : null,
    };

    // Auto-generate/update risks from task deadlines after task update
    try {
      await autoGenerateRisksFromTasks();
    } catch (riskError) {
      // Don't fail the task update if risk generation fails
      console.error("Failed to auto-generate risks after task update:", riskError);
    }

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current session for permission checks
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current task to check permissions
    const currentTask = await (prisma as any).task.findUnique({
      where: { id },
      include: {
        developer: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!currentTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Permission check: Only allow admins to delete tasks
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete tasks" },
        { status: 403 }
      );
    }

    await (prisma as any).task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task", details: error.message },
      { status: 500 }
    );
  }
}

