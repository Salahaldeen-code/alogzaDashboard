import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// This is a utility route to create initial users
// In production, you should protect this route or remove it
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const finalRole = role || "general";

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: finalRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Ensure "general" users (and "developer" users) have a matching Developer profile,
    // so they can sign in and view tasks on the main dashboard.
    if (
      (finalRole === "general" || finalRole === "developer") &&
      user.email
    ) {
      const existingDeveloper = await prisma.developer.findFirst({
        where: {
          email: user.email.toLowerCase(),
        },
      });

      if (!existingDeveloper) {
        await prisma.developer.create({
          data: {
            name: user.name,
            role: finalRole,
            email: user.email.toLowerCase(),
            status: "active",
          },
        });
      }
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user", details: error.message },
      { status: 500 }
    );
  }
}

