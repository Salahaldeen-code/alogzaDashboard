import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Calculate actual revenue for a given month based on projects
 * Actual for month M = 
 *   - SUM(project.revenue) for completed projects with end_date in month M
 *   - SUM(project.amountPaid) for in-progress projects with payment_date in month M
 */
async function calculateActualRevenueForMonth(year: number, month: number): Promise<number> {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  // Get completed projects - use project price (revenue) when completed
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

  // Get in-progress projects - use amount paid when payment_date is in this month
  // Note: Using type assertion until Prisma client is regenerated
  // Handle case where database columns don't exist yet
  let inProgressRevenue = 0
  try {
    const inProgressProjects = await (prisma.project.findMany as any)({
      where: {
        status: "in-progress",
        paymentDate: {
          gte: monthStart,
          lte: monthEnd,
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
    // If columns don't exist yet (P2022 = column not found), return 0 for in-progress revenue
    // This allows the app to work until database is updated
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

export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { 
          error: "Database not configured",
          message: "Please set DATABASE_URL in your .env file. See .env.example for reference."
        },
        { status: 503 }
      )
    }

    // Check for month query parameter
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get("month")

    let revenueTargets
    if (monthParam) {
      // Find specific month (format: YYYY-MM)
      const [year, month] = monthParam.split("-").map(Number)
      const monthDate = new Date(year, month - 1, 1)
      
      const target = await prisma.revenueTarget.findFirst({
        where: {
          month: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      })

      if (target) {
        // Calculate actual revenue from completed projects
        const calculatedActual = await calculateActualRevenueForMonth(year, month)
        
        // Update the database if calculated value differs (optional - can be done on-demand)
        // For now, we'll return the calculated value
        
        return NextResponse.json({
          id: target.id,
          month: target.month.toISOString().split("T")[0],
          target_amount: Number(target.targetAmount),
          actual_amount: calculatedActual, // Use calculated value
          created_at: target.createdAt.toISOString(),
          updated_at: target.updatedAt.toISOString(),
        })
      } else {
        return NextResponse.json(null)
      }
    } else {
      revenueTargets = await prisma.revenueTarget.findMany({
        orderBy: {
          month: "desc",
        },
      })
    }

    // Convert Decimal to number for JSON serialization and calculate actual revenue
    const formatted = await Promise.all(
      revenueTargets.map(async (target) => {
        const monthDate = new Date(target.month)
        const year = monthDate.getFullYear()
        const month = monthDate.getMonth() + 1
        
        // Calculate actual revenue from completed projects for this month
        const calculatedActual = await calculateActualRevenueForMonth(year, month)
        
        return {
      id: target.id,
      month: target.month.toISOString().split("T")[0],
      target_amount: Number(target.targetAmount),
          actual_amount: calculatedActual, // Use calculated value
      created_at: target.createdAt.toISOString(),
      updated_at: target.updatedAt.toISOString(),
        }
      })
    )

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Error fetching revenue targets:", error)
    
    // Handle common Prisma errors
    if (error.code === "P1001") {
      return NextResponse.json(
        { 
          error: "Database connection failed",
          message: "Cannot reach the database. Please check your DATABASE_URL and ensure the database is running."
        },
        { status: 503 }
      )
    }
    
    if (error.code === "P2025" || error.message?.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "Database tables not found",
          message: "Please run 'npm run prisma:migrate' or 'npm run prisma:push' to create the database tables."
        },
        { status: 503 }
      )
    }

    const errorMessage = error?.message || "Unknown error"
    const errorCode = error?.code || "UNKNOWN"
    return NextResponse.json(
      { 
        error: "Failed to fetch revenue targets",
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, target_amount, actual_amount } = body

    // Parse month to calculate actual revenue from projects
    const monthDate = new Date(month)
    const year = monthDate.getFullYear()
    const monthNum = monthDate.getMonth() + 1
    
    // Calculate actual revenue from completed projects (ignore manual actual_amount if provided)
    const calculatedActual = await calculateActualRevenueForMonth(year, monthNum)

    // Use upsert to update if exists, create if not
    // Note: We store the calculated actual_amount, but it will be recalculated on GET
    const revenueTarget = await prisma.revenueTarget.upsert({
      where: {
        month: new Date(month),
      },
      update: {
        targetAmount: target_amount,
        actualAmount: calculatedActual, // Use calculated value
      },
      create: {
        month: new Date(month),
        targetAmount: target_amount,
        actualAmount: calculatedActual, // Use calculated value
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
    console.error("Error creating/updating revenue target:", error)
    return NextResponse.json({ 
      error: "Failed to create/update revenue target",
      details: error.message 
    }, { status: 500 })
  }
}

