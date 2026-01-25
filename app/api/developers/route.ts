import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const developers = await (prisma as any).developer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = developers.map((dev: any) => ({
      id: dev.id,
      name: dev.name,
      role: dev.role,
      email: dev.email,
      phone: dev.phone,
      hourly_rate: dev.hourlyRate ? Number(dev.hourlyRate) : null,
      status: dev.status,
      created_at: dev.createdAt.toISOString(),
      updated_at: dev.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching developers:", error);
    return NextResponse.json(
      { error: "Failed to fetch developers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      role,
      email,
      phone,
      hourly_rate,
      status,
      create_user_account,
      user_password,
      user_role,
    } = body;

    // Validate user account creation requirements
    if (create_user_account) {
      if (!email) {
        return NextResponse.json(
          { error: "Email is required when creating a user account" },
          { status: 400 }
        );
      }
      if (!user_password || user_password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }

      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Create developer
    const developer = await (prisma as any).developer.create({
      data: {
        name,
        role,
        email: email || null,
        phone: phone || null,
        hourlyRate: hourly_rate || null,
        status: status || "active",
      },
    });

    // Create user account if requested
    let userAccount = null;
    if (create_user_account && email && user_password) {
      try {
        const hashedPassword = await hashPassword(user_password);
        userAccount = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            role: user_role || "developer",
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });
      } catch (userError: any) {
        // If user creation fails, we should ideally rollback developer creation
        // For now, we'll log the error and continue
        console.error("Error creating user account:", userError);
        // Optionally delete the developer if user creation fails
        // await (prisma as any).developer.delete({ where: { id: developer.id } });
        // return NextResponse.json(
        //   { error: "Failed to create user account", details: userError.message },
        //   { status: 500 }
        // );
      }
    }

    const formatted = {
      id: developer.id,
      name: developer.name,
      role: developer.role,
      email: developer.email,
      phone: developer.phone,
      hourly_rate: developer.hourlyRate ? Number(developer.hourlyRate) : null,
      status: developer.status,
      created_at: developer.createdAt.toISOString(),
      updated_at: developer.updatedAt.toISOString(),
      user_account_created: !!userAccount,
      user_account: userAccount,
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error: any) {
    console.error("Error creating developer:", error);
    
    // Handle unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A developer with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create developer", details: error.message },
      { status: 500 }
    );
  }
}
