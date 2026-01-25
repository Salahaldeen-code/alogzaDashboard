import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "developer" | "general";
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return null;
    }

    // In a real app, you'd store sessions in a database
    // For simplicity, we'll decode the session from the cookie
    // In production, use a proper session store
    const decoded = Buffer.from(sessionId, "base64").toString("utf-8");
    const sessionData = JSON.parse(decoded);

    // Verify the session is still valid by checking the user exists
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "developer" | "general",
    };
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string, userData: SessionUser) {
  const cookieStore = await cookies();
  const sessionData = {
    userId,
    ...userData,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const sessionString = JSON.stringify(sessionData);
  const sessionId = Buffer.from(sessionString).toString("base64");

  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session_id");
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

