import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper function to calculate risk score (Severity × Probability)
function calculateRiskScore(severity: string, probability: string): number {
  const severityValues: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  }
  const probabilityValues: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
  }
  return (severityValues[severity] || 2) * (probabilityValues[probability] || 2)
}

// Helper function to derive risk level from score
function deriveRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score <= 3) return "Low"
  if (score <= 6) return "Medium"
  return "High"
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      project_id, 
      title, 
      description, 
      category, 
      severity, 
      probability, 
      impact, 
      mitigation_plan, 
      status, 
      owner,
      identified_date,
      target_resolution_date,
      estimated_financial_impact
    } = body

    // Get current risk to calculate new score if severity/probability changed
    const currentRisk = await (prisma.risk.findUnique as any)({ where: { id } })
    const finalSeverity = severity !== undefined ? severity : currentRisk?.severity || "medium"
    const finalProbability = probability !== undefined ? probability : currentRisk?.probability || "medium"
    
    // Recalculate risk score and level if severity or probability changed
    const riskScore = calculateRiskScore(finalSeverity, finalProbability)
    const riskLevel = deriveRiskLevel(riskScore)

    const risk = await (prisma.risk.update as any)({
      where: { id },
      data: {
        projectId: project_id !== undefined ? (project_id || null) : undefined,
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        severity: severity !== undefined ? severity : undefined,
        probability: probability !== undefined ? probability : undefined,
        riskScore: (severity !== undefined || probability !== undefined) ? riskScore : undefined,
        riskLevel: (severity !== undefined || probability !== undefined) ? riskLevel : undefined,
        impact: impact !== undefined ? impact : undefined,
        mitigationPlan: mitigation_plan !== undefined ? mitigation_plan : undefined,
        status: status !== undefined ? status : undefined,
        owner: owner !== undefined ? owner : undefined,
        identifiedDate: identified_date !== undefined ? (identified_date ? new Date(identified_date) : null) : undefined,
        targetResolutionDate: target_resolution_date !== undefined ? (target_resolution_date ? new Date(target_resolution_date) : null) : undefined,
        estimatedFinancialImpact: estimated_financial_impact !== undefined ? (estimated_financial_impact ? estimated_financial_impact : null) : undefined,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: risk.id,
      project_id: (risk as any).projectId,
      title: risk.title,
      description: risk.description,
      category: risk.category,
      severity: risk.severity,
      probability: risk.probability,
      risk_score: (risk as any).riskScore ?? riskScore,
      risk_level: (risk as any).riskLevel ?? riskLevel,
      impact: risk.impact,
      mitigation_plan: risk.mitigationPlan,
      status: risk.status,
      owner: risk.owner,
      identified_date: (risk as any).identifiedDate ? (risk as any).identifiedDate.toISOString().split("T")[0] : null,
      target_resolution_date: (risk as any).targetResolutionDate ? (risk as any).targetResolutionDate.toISOString().split("T")[0] : null,
      estimated_financial_impact: (risk as any).estimatedFinancialImpact ? Number((risk as any).estimatedFinancialImpact) : null,
      created_at: risk.createdAt.toISOString(),
      updated_at: risk.updatedAt.toISOString(),
      project: (risk as any).project
        ? {
            id: (risk as any).project.id,
            name: (risk as any).project.name,
            client: (risk as any).project.client
              ? {
                  id: (risk as any).project.client.id,
                  name: (risk as any).project.client.name,
                }
              : null,
          }
        : null,
    })
  } catch (error: any) {
    console.error("Error updating risk:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update risk" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.risk.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting risk:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete risk" }, { status: 500 })
  }
}

