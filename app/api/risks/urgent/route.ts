import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ risks: [], tasks: [] });
    }

    // Find developer record for current user
    const developer = session.email
      ? await (prisma as any).developer.findFirst({
          where: { email: session.email },
        })
      : null;

    const now = new Date();
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Get all urgent risks (high/critical severity or task deadline risks)
    // Show all high/critical risks to everyone, and task deadline risks are relevant to all
    const urgentRisks = await (prisma as any).risk.findMany({
      where: {
        OR: [
          {
            severity: {
              in: ["high", "critical"],
            },
            status: {
              not: "resolved",
            },
          },
          {
            category: "Task Deadline",
            status: {
              not: "resolved",
            },
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { severity: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Get tasks with due dates <= 1 day for current user
    // For admins, show all urgent tasks. For others, show only their tasks
    let urgentTasks: any[] = [];
    const tasksWhere: any = {
      dueDate: {
        lte: oneDayFromNow,
      },
      status: {
        not: "done",
      },
    };

    if (session.role !== "admin") {
      if (developer) {
        tasksWhere.developerId = developer.id;
      } else {
        // No developer record, no tasks to show
        urgentTasks = [];
      }
    }

    if (session.role === "admin" || developer) {
      urgentTasks = await (prisma as any).task.findMany({
        where: tasksWhere,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      });
    }

    // Format risks
    const formattedRisks = urgentRisks.map((risk: any) => ({
      id: risk.id,
      title: risk.title,
      description: risk.description,
      severity: risk.severity,
      category: risk.category,
      status: risk.status,
      project: risk.project
        ? {
            id: risk.project.id,
            name: risk.project.name,
          }
        : null,
    }));

    // Format tasks
    const formattedTasks = urgentTasks.map((task: any) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const daysUntilDue = dueDate
        ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        due_date: task.dueDate?.toISOString().split("T")[0] || null,
        days_until_due: daysUntilDue,
        is_overdue: isOverdue,
        project: task.project
          ? {
              id: task.project.id,
              name: task.project.name,
            }
          : null,
      };
    });

    return NextResponse.json({
      risks: formattedRisks,
      tasks: formattedTasks,
    });
  } catch (error: any) {
    console.error("Error fetching urgent risks:", error);
    return NextResponse.json(
      { error: "Failed to fetch urgent risks", details: error.message },
      { status: 500 }
    );
  }
}

