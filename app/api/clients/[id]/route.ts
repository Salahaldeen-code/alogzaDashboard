import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, industry, contact_person, email, phone, status, lifetime_value } = body

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        industry: industry !== undefined ? industry : undefined,
        contactPerson: contact_person !== undefined ? contact_person : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        status: status !== undefined ? status : undefined,
        lifetimeValue: lifetime_value !== undefined ? lifetime_value : undefined,
      },
    })

    return NextResponse.json({
      id: client.id,
      name: client.name,
      industry: client.industry,
      contact_person: client.contactPerson,
      email: client.email,
      phone: client.phone,
      status: client.status,
      lifetime_value: Number(client.lifetimeValue),
      created_at: client.createdAt.toISOString(),
      updated_at: client.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Error updating client:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting client:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}

