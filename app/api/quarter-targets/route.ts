import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get("year")

    let whereClause: any = {}
    if (yearParam) {
      whereClause.year = Number.parseInt(yearParam)
    }

    const quarterTargets = await (prisma as any).quarterTarget.findMany({
      where: whereClause,
      orderBy: [
        { year: "desc" },
        { quarter: "asc" },
      ],
    })

    const formatted = quarterTargets.map((target: any) => ({
      id: target.id,
      year: target.year,
      quarter: target.quarter,
      minimum_amount: Number(target.minimumAmount),
      maximum_amount: Number(target.maximumAmount),
      actual_amount: Number(target.actualAmount),
      created_at: target.createdAt.toISOString(),
      updated_at: target.updatedAt.toISOString(),
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Error fetching quarter targets:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch quarter targets",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, quarter, minimum_amount, maximum_amount, actual_amount } = body

    const quarterTarget = await (prisma as any).quarterTarget.upsert({
      where: {
        year_quarter: {
          year: year,
          quarter: quarter,
        },
      } as any,
      update: {
        minimumAmount: minimum_amount,
        maximumAmount: maximum_amount,
        actualAmount: actual_amount || 0,
      },
      create: {
        year: year,
        quarter: quarter,
        minimumAmount: minimum_amount,
        maximumAmount: maximum_amount,
        actualAmount: actual_amount || 0,
      },
    })

    return NextResponse.json({
      id: quarterTarget.id,
      year: quarterTarget.year,
      quarter: quarterTarget.quarter,
      minimum_amount: Number(quarterTarget.minimumAmount),
      maximum_amount: Number(quarterTarget.maximumAmount),
      actual_amount: Number(quarterTarget.actualAmount),
      created_at: quarterTarget.createdAt.toISOString(),
      updated_at: quarterTarget.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Error creating/updating quarter target:", error)
    return NextResponse.json({ 
      error: "Failed to create/update quarter target",
      details: error.message 
    }, { status: 500 })
  }
}

