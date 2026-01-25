import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET a single milestone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const milestone = await (prisma as any).milestone.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    const tasks = milestone.tasks || [];
    const completedTasks = tasks.filter((t: any) => t.status === "done").length;
    const totalTasks = tasks.length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const formatted = {
      id: milestone.id,
      project_id: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      start_date: milestone.startDate?.toISOString().split("T")[0] || null,
      due_date: milestone.dueDate?.toISOString().split("T")[0] || null,
      status: milestone.status,
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
        estimated_hours: task.estimatedHours ? Number(task.estimatedHours) : null,
        actual_hours: Number(task.actualHours),
        due_date: task.dueDate?.toISOString().split("T")[0] || null,
        priority: task.priority,
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error fetching milestone:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestone", details: error.message },
      { status: 500 }
    );
  }
}

// PUT update a milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, start_date, due_date, status, order } = body;

    if (title !== undefined && !title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (start_date !== undefined)
      updateData.startDate = start_date ? new Date(start_date) : null;
    if (due_date !== undefined)
      updateData.dueDate = due_date ? new Date(due_date) : null;
    if (status !== undefined) updateData.status = status;
    if (order !== undefined) updateData.order = order;

    const milestone = await (prisma as any).milestone.update({
      where: { id },
      data: updateData,
      include: {
        tasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const tasks = milestone.tasks || [];
    const completedTasks = tasks.filter((t: any) => t.status === "done").length;
    const totalTasks = tasks.length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Auto-update status if all tasks are done
    let finalStatus = milestone.status;
    if (totalTasks > 0 && completedTasks === totalTasks) {
      finalStatus = "completed";
      // Update in database if different
      if (finalStatus !== milestone.status) {
        await (prisma as any).milestone.update({
          where: { id },
          data: { status: finalStatus },
        });
      }
    }

    const formatted = {
      id: milestone.id,
      project_id: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      start_date: milestone.startDate?.toISOString().split("T")[0] || null,
      due_date: milestone.dueDate?.toISOString().split("T")[0] || null,
      status: finalStatus,
      order: milestone.order,
      progress,
      task_count: totalTasks,
      completed_task_count: completedTasks,
      created_at: milestone.createdAt.toISOString(),
      updated_at: milestone.updatedAt.toISOString(),
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: "Failed to update milestone", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE a milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if milestone has tasks
    const milestone = await (prisma as any).milestone.findUnique({
      where: { id },
      include: {
        tasks: true,
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Tasks will be set to null milestoneId due to onDelete: SetNull
    await (prisma as any).milestone.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Milestone deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json(
      { error: "Failed to delete milestone", details: error.message },
      { status: 500 }
    );
  }
}

