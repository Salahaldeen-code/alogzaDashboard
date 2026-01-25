import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        projects: true,
      },
    })

    const formatted = clients.map((client) => ({
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
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, industry, contact_person, email, phone, status, lifetime_value } = body

    const client = await prisma.client.create({
      data: {
        name,
        industry: industry || null,
        contactPerson: contact_person || null,
        email: email || null,
        phone: phone || null,
        status: status || "active",
        lifetimeValue: lifetime_value || 0,
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
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}

