import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "developer" | "general",
    };

    // Fallback: make sure role="general" (and "developer") users have a Developer profile.
    // This allows them to sign in and see their tasks dashboard.
    if ((user.role === "general" || user.role === "developer") && user.email) {
      const emailLower = user.email.toLowerCase();
      const existingDeveloper = await prisma.developer.findFirst({
        where: { email: emailLower },
      });

      if (!existingDeveloper) {
        await prisma.developer.create({
          data: {
            name: user.name,
            role: user.role,
            email: emailLower,
            status: "active",
          },
        });
      }
    }

    await createSession(user.id, sessionUser);

    return NextResponse.json({
      user: sessionUser,
      message: "Login successful",
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to login", details: error.message },
      { status: 500 }
    );
  }
}

