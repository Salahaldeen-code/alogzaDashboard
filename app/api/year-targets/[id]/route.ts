import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Calculate actual revenue for a given year based on projects
 */
async function calculateActualRevenueForYear(year: number): Promise<number> {
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

  // Get completed projects - use project revenue when completed
  const completedProjects = await prisma.project.findMany({
    where: {
      status: "completed",
      endDate: {
        gte: yearStart,
        lte: yearEnd,
      },
      revenue: {
        gt: 0,
      },
    },
    select: {
      revenue: true,
    },
  })

  // Get in-progress projects - use amount paid when payment_date is in this year
  let inProgressRevenue = 0
  try {
    const inProgressProjects = await (prisma.project.findMany as any)({
      where: {
        status: "in-progress",
        paymentDate: {
          gte: yearStart,
          lte: yearEnd,
        },
        amountPaid: {
          gt: 0,
        },
      },
      select: {
        amountPaid: true,
      },
    })

    inProgressRevenue = inProgressProjects.reduce(
      (sum: number, project: any) => sum + Number(project.amountPaid || 0),
      0
    )
  } catch (error: any) {
    // If columns don't exist yet, return 0 for in-progress revenue
    if (error.code === "P2022") {
      console.warn("Payment columns not yet in database, skipping in-progress revenue calculation")
      inProgressRevenue = 0
    } else {
      throw error
    }
  }

  const completedRevenue = completedProjects.reduce(
    (sum, project) => sum + Number(project.revenue || 0),
    0
  )

  return completedRevenue + inProgressRevenue
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { year, minimum_amount, actual_amount, maximum_amount } = body

    // Don't allow updating actual_amount - it's calculated from payments
    const updateData: any = {}
    if (year !== undefined) updateData.year = year
    if (minimum_amount !== undefined) updateData.minimumAmount = minimum_amount
    if (maximum_amount !== undefined) updateData.maximumAmount = maximum_amount
    // actualAmount is NOT updated - it's calculated from payments

    const yearTarget = await prisma.yearTarget.update({
      where: { id },
      data: updateData,
    })

    // Calculate actual amount from payments
    const calculatedActual = await calculateActualRevenueForYear(yearTarget.year)

    return NextResponse.json({
      id: yearTarget.id,
      year: yearTarget.year,
      minimum_amount: Number(yearTarget.minimumAmount),
      actual_amount: calculatedActual, // Return calculated value
      maximum_amount: Number(yearTarget.maximumAmount),
      created_at: yearTarget.createdAt.toISOString(),
      updated_at: yearTarget.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Error updating year target:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Year target not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update year target" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.yearTarget.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting year target:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Year target not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete year target" }, { status: 500 })
  }
}

