import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import { GradeService } from "@/services/gradeService";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const exam_id = searchParams.get("exam_id");

    if (!exam_id) {
      return NextResponse.json(
        { error: "exam_id is required" },
        { status: 400 }
      );
    }

    const grades = await GradeService.getGradesByExam(exam_id);
    return NextResponse.json(grades);
  } catch (error: any) {
    logger.error({ err: error }, "Get grades API error");
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { exam_id, grades } = body;

    if (!exam_id || !grades || !Array.isArray(grades)) {
      return NextResponse.json(
        { error: "exam_id and grades array are required" },
        { status: 400 }
      );
    }

    const result = await GradeService.saveGrades({ exam_id, grades });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Save grades API error");
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
