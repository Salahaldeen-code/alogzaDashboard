import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    return NextResponse.json({ user: session });
  } catch (error: any) {
    return NextResponse.json({ user: null });
  }
}

