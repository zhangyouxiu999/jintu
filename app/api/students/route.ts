import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import Student from "@/models/Student";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const data = await request.json();

    if (!data.student_id) {
      data.student_id = `S${Date.now()}`;
    }

    if (!data.category_id) {
      return NextResponse.json(
        { error: "category_id is required" },
        { status: 400 }
      );
    }

    const student = await Student.create(data);
    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    logger.error({ err: error }, "Create Student API Error");
    if (error.code === 11000) {
      return NextResponse.json({ error: "学号已存在" }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const students = await Student.find({}).sort({ created_at: -1 });
    return NextResponse.json(students);
  } catch (err: any) {
    logger.error({ err }, "Fetch Students Error");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
