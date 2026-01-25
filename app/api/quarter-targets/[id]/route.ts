import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quarterTarget = await (prisma as any).quarterTarget.findUnique({
      where: { id },
    })

    if (!quarterTarget) {
      return NextResponse.json(
        { error: "Quarter target not found" },
        { status: 404 }
      )
    }

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
    console.error("Error fetching quarter target:", error)
    return NextResponse.json(
      { error: "Failed to fetch quarter target", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const { minimum_amount, maximum_amount, actual_amount } = body

    const quarterTarget = await (prisma as any).quarterTarget.update({
      where: { id },
      data: {
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
    console.error("Error updating quarter target:", error)
    return NextResponse.json(
      { error: "Failed to update quarter target", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await (prisma as any).quarterTarget.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Quarter target deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting quarter target:", error)
    return NextResponse.json(
      { error: "Failed to delete quarter target", details: error.message },
      { status: 500 }
    )
  }
}

