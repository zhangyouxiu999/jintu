import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import { ExamService } from "@/services/examService";

export async function GET() {
  try {
    await dbConnect();
    const examsWithStats = await ExamService.listExamsWithStats();
    return NextResponse.json(examsWithStats);
  } catch (error: any) {
    logger.error({ err: error }, "List exams API error");
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required fields: name" },
        { status: 400 }
      );
    }

    const exam = await ExamService.createExam(body);
    return NextResponse.json(exam);
  } catch (error: any) {
    logger.error({ err: error }, "Create exam API error");
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
