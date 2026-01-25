import { NextRequest, NextResponse } from "next/server";
import { autoGenerateRisksFromTasks } from "@/lib/risk-generator";

export async function POST(request: NextRequest) {
  try {
    const result = await autoGenerateRisksFromTasks();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error auto-generating risks:", error);
    return NextResponse.json(
      { error: "Failed to auto-generate risks", details: error.message },
      { status: 500 }
    );
  }
}

