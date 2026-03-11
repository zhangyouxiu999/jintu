import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import { AttendanceService } from "@/services/attendanceService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await dbConnect();
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    const result = await AttendanceService.getDailyAttendance(code, date);

    if (!result) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ err: error }, "Daily Attendance API Error");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await dbConnect();
    const { code } = await params;
    const {
      action,
      student_id,
      period,
      status,
      date: customDate,
      student_ids,
    } = await request.json();

    const classCode = code;
    const date = customDate || new Date().toISOString().split("T")[0];

    const result = await AttendanceService.updateAttendance({
      classCode,
      action,
      student_id,
      period,
      status,
      date,
      student_ids,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof Error && error.message === "Invalid action") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    logger.error({ err: error }, "Daily Attendance API Error");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

