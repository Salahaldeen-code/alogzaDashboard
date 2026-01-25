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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
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
      client: project.client,
    });
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { client_id, name, description, status, progress_notes, start_date, end_date, budget, actual_cost, revenue, amount_paid, payment_date } = body

    // Get the old project to check if status, end_date, or payment_date changed
    const oldProject = await prisma.project.findUnique({
      where: { id },
      select: { status: true, endDate: true, paymentDate: true } as any,
    })

    // Build update data object, only including fields that are being updated
    const updateData: any = {}
    
    if (client_id !== undefined) updateData.clientId = client_id
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (status !== undefined) updateData.status = status
    if (progress_notes !== undefined) updateData.progressNotes = progress_notes || null
    if (start_date !== undefined) updateData.startDate = start_date ? new Date(start_date) : null
    if (end_date !== undefined) updateData.endDate = end_date ? new Date(end_date) : null
    if (budget !== undefined) updateData.budget = budget
    if (actual_cost !== undefined) updateData.actualCost = actual_cost
    if (revenue !== undefined) updateData.revenue = revenue
    if (amount_paid !== undefined) updateData.amountPaid = amount_paid
    if (payment_date !== undefined) updateData.paymentDate = payment_date ? new Date(payment_date) : null

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    // Recalculate revenue targets if status, end_date, or payment_date changed
    // Check both old and new dates to update both months if needed
    const monthsToUpdate = new Set<{ year: number; month: number }>()

    // Check completed projects (end_date)
    if ((oldProject as any)?.endDate && (oldProject as any).status === "completed") {
      const oldDate = new Date((oldProject as any).endDate)
      monthsToUpdate.add({ year: oldDate.getFullYear(), month: oldDate.getMonth() + 1 })
    }

    if (project.endDate && project.status === "completed") {
      const newDate = new Date(project.endDate)
      monthsToUpdate.add({ year: newDate.getFullYear(), month: newDate.getMonth() + 1 })
    }

    // Check in-progress projects (payment_date)
    if (oldProject && (oldProject as any).paymentDate && (oldProject as any).status === "in-progress") {
      const oldDate = new Date((oldProject as any).paymentDate)
      monthsToUpdate.add({ year: oldDate.getFullYear(), month: oldDate.getMonth() + 1 })
    }

    if ((project as any).paymentDate && project.status === "in-progress") {
      const newDate = new Date((project as any).paymentDate)
      monthsToUpdate.add({ year: newDate.getFullYear(), month: newDate.getMonth() + 1 })
    }

    // Update revenue targets for affected months
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
    console.error("Error updating project:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get project before deleting to recalculate revenue
    const project = await prisma.project.findUnique({
      where: { id },
      select: { status: true, endDate: true, paymentDate: true } as any,
    })

    await prisma.project.delete({
      where: { id },
    })

    // Recalculate revenue target if deleted project affected monthly revenue
    // Get the project before deletion to check its status and dates
    const projectBeforeDelete = await prisma.project.findUnique({
      where: { id },
      select: { status: true, endDate: true, paymentDate: true } as any,
    })
    
    const monthsToUpdate = new Set<{ year: number; month: number }>()
    
    if ((projectBeforeDelete as any)?.status === "completed" && (projectBeforeDelete as any)?.endDate) {
      const endDate = new Date((projectBeforeDelete as any).endDate)
      monthsToUpdate.add({ year: endDate.getFullYear(), month: endDate.getMonth() + 1 })
    }
    
    if ((projectBeforeDelete as any)?.status === "in-progress" && (projectBeforeDelete as any)?.paymentDate) {
      const paymentDate = new Date((projectBeforeDelete as any).paymentDate)
      monthsToUpdate.add({ year: paymentDate.getFullYear(), month: paymentDate.getMonth() + 1 })
    }

    for (const { year, month } of monthsToUpdate) {
      await updateRevenueTargetForMonth(year, month)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting project:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}

