import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const developer = await (prisma as any).developer.findUnique({
      where: { id },
    });

    if (!developer) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    const formatted = {
      id: developer.id,
      name: developer.name,
      role: developer.role,
      email: developer.email,
      phone: developer.phone,
      hourly_rate: developer.hourlyRate ? Number(developer.hourlyRate) : null,
      status: developer.status,
      created_at: developer.createdAt.toISOString(),
      updated_at: developer.updatedAt.toISOString(),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching developer:", error);
    return NextResponse.json(
      { error: "Failed to fetch developer" },
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
    const { name, role, email, phone, hourly_rate, status } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (hourly_rate !== undefined) updateData.hourlyRate = hourly_rate || null;
    if (status !== undefined) updateData.status = status;

    const developer = await (prisma as any).developer.update({
      where: { id },
      data: updateData,
    });

    const formatted = {
      id: developer.id,
      name: developer.name,
      role: developer.role,
      email: developer.email,
      phone: developer.phone,
      hourly_rate: developer.hourlyRate ? Number(developer.hourlyRate) : null,
      status: developer.status,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await (prisma as any).developer.delete({
      where: { id },
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

