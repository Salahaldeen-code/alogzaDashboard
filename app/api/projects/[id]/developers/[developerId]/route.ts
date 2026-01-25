import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; developerId: string }> }
) {
  try {
    const { developerId } = await params;
    const body = await request.json();
    const { name, role, amount } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (amount !== undefined) updateData.amount = amount;

    const developer = await (prisma as any).projectDeveloper.update({
      where: { id: developerId },
      data: updateData,
    });

    const formatted = {
      id: developer.id,
      project_id: developer.projectId,
      name: developer.name,
      role: developer.role,
      amount: Number(developer.amount),
      created_at: developer.createdAt.toISOString(),
      updated_at: developer.updatedAt.toISOString(),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error updating developer:", error);
    return NextResponse.json(
      { error: "Failed to update developer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; developerId: string }> }
) {
  try {
    const { developerId } = await params;

    await (prisma as any).projectDeveloper.delete({
      where: { id: developerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting developer:", error);
    return NextResponse.json(
      { error: "Failed to delete developer" },
      { status: 500 }
    );
  }
}

