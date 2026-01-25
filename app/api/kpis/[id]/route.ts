import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, category, target_value, current_value, unit, period } = body

    const kpi = await prisma.kpi.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        category: category !== undefined ? category : undefined,
        targetValue: target_value !== undefined ? target_value : undefined,
        currentValue: current_value !== undefined ? current_value : undefined,
        unit: unit !== undefined ? unit : undefined,
        period: period !== undefined ? period : undefined,
      },
    })

    return NextResponse.json({
      id: kpi.id,
      name: kpi.name,
      category: kpi.category,
      target_value: Number(kpi.targetValue),
      current_value: Number(kpi.currentValue),
      unit: kpi.unit,
      period: kpi.period,
      created_at: kpi.createdAt.toISOString(),
      updated_at: kpi.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Error updating KPI:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update KPI" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.kpi.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting KPI:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete KPI" }, { status: 500 })
  }
}

