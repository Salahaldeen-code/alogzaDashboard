import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Calculate actual revenue for a given month based on completed projects
 * Actual for month M = SUM(project.revenue) for projects with:
 * - status = "completed"
 * - end_date is in month M
 */
async function calculateActualRevenueForMonth(year: number, month: number): Promise<number> {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  const completedProjects = await prisma.project.findMany({
    where: {
      status: "completed",
      endDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      revenue: {
        gt: 0,
      },
    },
    select: {
      revenue: true,
    },
  })

  const totalRevenue = completedProjects.reduce(
    (sum, project) => sum + Number(project.revenue || 0),
    0
  )

  return totalRevenue
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { month, target_amount } = body

    // Get the current revenue target to determine the month
    const currentTarget = await prisma.revenueTarget.findUnique({
      where: { id },
    })

    if (!currentTarget) {
      return NextResponse.json({ error: "Revenue target not found" }, { status: 404 })
    }

    // Determine which month to calculate for
    const monthDate = month ? new Date(month) : currentTarget.month
    const year = monthDate.getFullYear()
    const monthNum = monthDate.getMonth() + 1

    // Calculate actual revenue from completed projects
    const calculatedActual = await calculateActualRevenueForMonth(year, monthNum)

    const revenueTarget = await prisma.revenueTarget.update({
      where: { id },
      data: {
        month: month ? new Date(month) : undefined,
        targetAmount: target_amount !== undefined ? target_amount : undefined,
        actualAmount: calculatedActual, // Always use calculated value
      },
    })

    return NextResponse.json({
      id: revenueTarget.id,
      month: revenueTarget.month.toISOString().split("T")[0],
      target_amount: Number(revenueTarget.targetAmount),
      actual_amount: calculatedActual, // Return calculated value
      created_at: revenueTarget.createdAt.toISOString(),
      updated_at: revenueTarget.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Error updating revenue target:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Revenue target not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update revenue target" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.revenueTarget.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting revenue target:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Revenue target not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete revenue target" }, { status: 500 })
  }
}

