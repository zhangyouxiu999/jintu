import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import {
  AttendanceHistoryService,
  HistoryQueryRange,
} from "@/services/attendanceHistoryService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await dbConnect();
    const { code } = await params;
    const searchParams = request.nextUrl.searchParams;

    const range: HistoryQueryRange = {
      month: searchParams.get("month"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    };

    const result = await AttendanceHistoryService.getHistory(code, range);

    if (!result) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "History API Error");
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await dbConnect();
    const { code } = await params;
    const body = await request.json();
    const { date, period, student_id, status } = body;

    if (!date || period === undefined || !student_id || status === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await AttendanceHistoryService.updateRecord({
      code,
      date,
      period,
      student_id,
      status,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "History Update API Error");
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await dbConnect();
    const { code } = await params;
    const searchParams = request.nextUrl.searchParams;

    const range: HistoryQueryRange = {
      month: searchParams.get("month"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    };

    const result = await AttendanceHistoryService.deleteRange(code, range);

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "History Delete API Error");
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
