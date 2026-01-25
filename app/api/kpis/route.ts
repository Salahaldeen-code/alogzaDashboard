import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const kpis = await prisma.kpi.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    const formatted = kpis.map((kpi) => ({
      id: kpi.id,
      name: kpi.name,
      category: kpi.category,
      target_value: Number(kpi.targetValue),
      current_value: Number(kpi.currentValue),
      unit: kpi.unit,
      period: kpi.period,
      created_at: kpi.createdAt.toISOString(),
      updated_at: kpi.updatedAt.toISOString(),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching KPIs:", error)
    return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, target_value, current_value, unit, period } = body

    const kpi = await prisma.kpi.create({
      data: {
        name,
        category,
        targetValue: target_value,
        currentValue: current_value || 0,
        unit: unit || null,
        period: period || "monthly",
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
  } catch (error) {
    console.error("Error creating KPI:", error)
    return NextResponse.json({ error: "Failed to create KPI" }, { status: 500 })
  }
}

