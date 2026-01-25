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

export async function GET() {
  try {
    const risks = await (prisma.risk.findMany as any)({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    })

    const formatted = risks.map((risk: any) => {
      // Calculate risk score and level if not already set
      const riskScore = risk.riskScore ?? calculateRiskScore(risk.severity, risk.probability)
      const riskLevel = risk.riskLevel ?? deriveRiskLevel(riskScore)
      
      return {
        id: risk.id,
        project_id: risk.projectId,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        severity: risk.severity,
        probability: risk.probability,
        risk_score: riskScore,
        risk_level: riskLevel,
        impact: risk.impact,
        mitigation_plan: risk.mitigationPlan,
        status: risk.status,
        owner: risk.owner,
        identified_date: risk.identifiedDate ? risk.identifiedDate.toISOString().split("T")[0] : null,
        target_resolution_date: risk.targetResolutionDate ? risk.targetResolutionDate.toISOString().split("T")[0] : null,
        estimated_financial_impact: risk.estimatedFinancialImpact ? Number(risk.estimatedFinancialImpact) : null,
        created_at: risk.createdAt.toISOString(),
        updated_at: risk.updatedAt.toISOString(),
      project: risk.project
        ? {
            id: risk.project.id,
            name: risk.project.name,
            client: risk.project.client
              ? {
                  id: risk.project.client.id,
                  name: risk.project.client.name,
                }
              : null,
          }
        : null,
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching risks:", error)
    return NextResponse.json({ error: "Failed to fetch risks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Calculate risk score and level
    const finalSeverity = severity || "medium"
    const finalProbability = probability || "medium"
    const riskScore = calculateRiskScore(finalSeverity, finalProbability)
    const riskLevel = deriveRiskLevel(riskScore)

    const risk = await (prisma.risk.create as any)({
      data: {
        projectId: project_id || null,
        title,
        description: description || null,
        category: category || null,
        severity: finalSeverity,
        probability: finalProbability,
        riskScore,
        riskLevel,
        impact: impact || null,
        mitigationPlan: mitigation_plan || null,
        status: status || "identified",
        owner: owner || null,
        identifiedDate: identified_date ? new Date(identified_date) : null,
        targetResolutionDate: target_resolution_date ? new Date(target_resolution_date) : null,
        estimatedFinancialImpact: estimated_financial_impact ? estimated_financial_impact : null,
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
      project: risk.project
        ? {
            id: risk.project.id,
            name: risk.project.name,
            client: risk.project.client
              ? {
                  id: risk.project.client.id,
                  name: risk.project.client.name,
                }
              : null,
          }
        : null,
    })
  } catch (error) {
    console.error("Error creating risk:", error)
    return NextResponse.json({ error: "Failed to create risk" }, { status: 500 })
  }
}

