import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const expense = await (prisma as any).expense.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

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

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
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
    const { project_id, category, amount, spent_at, vendor, note } = body;

    // Build update data object, only including fields that are being updated
    const updateData: any = {};

    if (project_id !== undefined) updateData.projectId = project_id || null;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (spent_at !== undefined) updateData.spentAt = new Date(spent_at);
    if (vendor !== undefined) updateData.vendor = vendor || null;
    if (note !== undefined) updateData.note = note || null;

    const expense = await (prisma as any).expense.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
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

    await (prisma as any).expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}

