import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoGenerateRisksFromTasks } from "@/lib/risk-generator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get("developer_id");

    const where: any = {};
    if (developerId) {
      where.developerId = developerId;
    }

    const tasks = await (prisma as any).task.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = tasks.map((task: any) => ({
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      status,
      developer_id,
      project_id,
      estimated_hours,
      due_date,
      priority,
    } = body;

    const task = await (prisma as any).task.create({
      data: {
        title,
        description: description || null,
        status: status || "todo",
        developerId: developer_id,
        projectId: project_id || null,
        estimatedHours: estimated_hours ? parseFloat(estimated_hours) : null,
        actualHours: 0,
        dueDate: due_date ? new Date(due_date) : null,
        priority: priority || "medium",
      },
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

    // Auto-generate/update risks from task deadlines after task creation
    try {
      await autoGenerateRisksFromTasks();
    } catch (riskError) {
      // Don't fail the task creation if risk generation fails
      console.error("Failed to auto-generate risks after task creation:", riskError);
    }

    return NextResponse.json(formatted, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task", details: error.message },
      { status: 500 }
    );
  }
}

