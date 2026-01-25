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

/**
 * Recalculate and update revenue target for a specific month
 */
async function updateRevenueTargetForMonth(year: number, month: number) {
  try {
    const monthDate = new Date(year, month - 1, 1)
    const calculatedActual = await calculateActualRevenueForMonth(year, month)

    await prisma.revenueTarget.updateMany({
      where: {
        month: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      data: {
        actualAmount: calculatedActual,
      },
    })
  } catch (error) {
    // Silently fail - revenue will be recalculated on GET anyway
    console.error("Error updating revenue target:", error)
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: true,
      },
    })

    const formatted = projects.map((project) => ({
      id: project.id,
      client_id: project.clientId,
      name: project.name,
      description: project.description,
      status: project.status,
      progress_notes: (project as any).progressNotes || null,
      start_date: project.startDate ? project.startDate.toISOString().split("T")[0] : null,
      end_date: project.endDate ? project.endDate.toISOString().split("T")[0] : null,
      budget: project.budget ? Number(project.budget) : null,
      actual_cost: Number(project.actualCost),
      revenue: Number(project.revenue),
      amount_paid: Number((project as any).amountPaid || 0),
      payment_date: (project as any).paymentDate ? (project as any).paymentDate.toISOString().split("T")[0] : null,
      created_at: project.createdAt.toISOString(),
      updated_at: project.updatedAt.toISOString(),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_id, name, description, status, progress_notes, start_date, end_date, budget, actual_cost, revenue, amount_paid, payment_date } = body

    const project = await prisma.project.create({
      data: {
        clientId: client_id,
        name,
        description: description || null,
        status: status || "planning",
        progressNotes: progress_notes || null,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        budget: budget ? budget : null,
        actualCost: actual_cost || 0,
        revenue: revenue || 0,
        amountPaid: amount_paid || 0,
        paymentDate: payment_date ? new Date(payment_date) : null,
      } as any,
    })

    // Recalculate revenue target if project affects monthly revenue
    const monthsToUpdate = new Set<{ year: number; month: number }>()
    
    if (project.status === "completed" && project.endDate) {
      const endDate = new Date(project.endDate)
      monthsToUpdate.add({ year: endDate.getFullYear(), month: endDate.getMonth() + 1 })
    }
    
    if (project.status === "in-progress" && (project as any).paymentDate) {
      const paymentDate = new Date((project as any).paymentDate)
      monthsToUpdate.add({ year: paymentDate.getFullYear(), month: paymentDate.getMonth() + 1 })
    }

    for (const { year, month } of monthsToUpdate) {
      await updateRevenueTargetForMonth(year, month)
    }

    return NextResponse.json({
      id: project.id,
      client_id: project.clientId,
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.startDate ? project.startDate.toISOString().split("T")[0] : null,
      end_date: project.endDate ? project.endDate.toISOString().split("T")[0] : null,
      budget: project.budget ? Number(project.budget) : null,
      actual_cost: Number(project.actualCost),
      revenue: Number(project.revenue),
      amount_paid: Number((project as any).amountPaid || 0),
      payment_date: (project as any).paymentDate ? (project as any).paymentDate.toISOString().split("T")[0] : null,
      created_at: project.createdAt.toISOString(),
      updated_at: project.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Error creating project:", error)
    if (error.code === "P2003") {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}

