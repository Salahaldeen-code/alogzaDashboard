import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Calculate actual revenue for a given year based on projects
 * Actual for year Y = 
 *   - SUM(project.revenue) for completed projects with end_date in year Y
 *   - SUM(project.amountPaid) for in-progress projects with payment_date in year Y
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

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { 
          error: "Database not configured",
          message: "Please set DATABASE_URL in your .env file."
        },
        { status: 503 }
      )
    }

    const yearTargets = await prisma.yearTarget.findMany({
      orderBy: {
        year: "desc",
      },
    })

    // Calculate actual amounts from payments for each year
    const formatted = await Promise.all(
      yearTargets.map(async (target) => {
        const calculatedActual = await calculateActualRevenueForYear(target.year)
        return {
          id: target.id,
          year: target.year,
          minimum_amount: Number(target.minimumAmount),
          actual_amount: calculatedActual, // Use calculated value from payments
          maximum_amount: Number(target.maximumAmount),
          created_at: target.createdAt.toISOString(),
          updated_at: target.updatedAt.toISOString(),
        }
      })
    )

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Error fetching year targets:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json(
      { 
        error: "Failed to fetch year targets",
        details: error.message,
        code: error.code,
        meta: error.meta
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, minimum_amount, target_amount } = body

    // Use target_amount if provided, otherwise fall back to minimum_amount
    const targetAmount = target_amount || minimum_amount

    // Check if year target already exists
    const existingTarget = await prisma.yearTarget.findUnique({
      where: { year: year },
    })

    // Calculate actual amount from payments
    const calculatedActual = await calculateActualRevenueForYear(year)

    const yearTarget = await prisma.yearTarget.upsert({
      where: {
        year: year,
      },
      update: {
        minimumAmount: minimum_amount,
        // Don't update actualAmount - it's calculated from payments
        maximumAmount: targetAmount, // Store target in maximumAmount field
      },
      create: {
        year: year,
        minimumAmount: minimum_amount,
        actualAmount: calculatedActual, // Calculate from payments on creation
        maximumAmount: targetAmount, // Store target in maximumAmount field
      },
    })

    // Note: Monthly targets are now set manually by admin
    // The suggested average per month is: targetAmount / 12

    // Return calculated actual amount (not stored value)
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
    console.error("Error creating/updating year target:", error)
    return NextResponse.json({ 
      error: "Failed to create/update year target",
      details: error.message 
    }, { status: 500 })
  }
}

