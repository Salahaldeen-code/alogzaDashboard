import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const developers = await (prisma as any).projectDeveloper.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });

    const formatted = developers.map((dev: any) => ({
      id: dev.id,
      project_id: dev.projectId,
      developer_id: dev.developerId,
      name: dev.name,
      role: dev.role,
      amount: Number(dev.amount),
      created_at: dev.createdAt.toISOString(),
      updated_at: dev.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching developers:", error);
    return NextResponse.json(
      { error: "Failed to fetch developers" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, amount, developer_id } = body;

    const developer = await (prisma as any).projectDeveloper.create({
      data: {
        projectId: id,
        developerId: developer_id || null,
        name,
        role,
        amount,
      },
    });

    const formatted = {
      id: developer.id,
      project_id: developer.projectId,
      developer_id: developer.developerId,
      name: developer.name,
      role: developer.role,
      amount: Number(developer.amount),
      created_at: developer.createdAt.toISOString(),
      updated_at: developer.updatedAt.toISOString(),
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error("Error creating developer:", error);
    return NextResponse.json(
      { error: "Failed to create developer" },
      { status: 500 }
    );
  }
}

