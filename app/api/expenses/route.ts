import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    
    if (startDate && endDate) {
      where.spentAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const expenses = await (prisma as any).expense.findMany({
      where,
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        spentAt: "desc",
      },
    });

    const formatted = expenses.map((expense: any) => ({
      id: expense.id,
      project_id: expense.projectId,
      category: expense.category,
      amount: Number(expense.amount),
      spent_at: expense.spentAt.toISOString().split("T")[0],
      vendor: expense.vendor,
      note: expense.note,
      created_at: expense.createdAt.toISOString(),
      updated_at: expense.updatedAt.toISOString(),
      project: expense.project
        ? {
            id: expense.project.id,
            name: expense.project.name,
            client: expense.project.client
              ? {
                  id: expense.project.client.id,
                  name: expense.project.client.name,
                }
              : null,
          }
        : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, category, amount, spent_at, vendor, note } = body;

    const expense = await (prisma as any).expense.create({
      data: {
        projectId: project_id || null,
        category,
        amount,
        spentAt: new Date(spent_at),
        vendor: vendor || null,
        note: note || null,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    const formatted = {
      id: expense.id,
      project_id: expense.projectId,
      category: expense.category,
      amount: Number(expense.amount),
      spent_at: expense.spentAt.toISOString().split("T")[0],
      vendor: expense.vendor,
      note: expense.note,
      created_at: expense.createdAt.toISOString(),
      updated_at: expense.updatedAt.toISOString(),
      project: expense.project
        ? {
            id: expense.project.id,
            name: expense.project.name,
            client: expense.project.client
              ? {
                  id: expense.project.client.id,
                  name: expense.project.client.name,
                }
              : null,
          }
        : null,
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

