import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import Class from "@/models/Class";

export async function GET() {
  try {
    await dbConnect();
    const classes = await Class.find({}).sort({ name: 1 });
    return NextResponse.json(classes);
  } catch (error) {
    logger.error({ err: error }, "Fetch Classes Error");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { name, teacher } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "班级名称不能为空" },
        { status: 400 }
      );
    }

    const generateRandomSuffix = () =>
      Math.random().toString(36).substring(2, 8).toLowerCase();

    let code = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const randomSuffix = generateRandomSuffix();
      const finalCode = `class-${randomSuffix}`;

      const existing = await Class.findOne({ code: finalCode });
      if (!existing) {
        code = finalCode;
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      code = `class-${Math.random()
        .toString(36)
        .substring(2, 12)
        .toLowerCase()}`;
    }

    const newClass = await Class.create({
      code,
      name,
      teacher: teacher || "",
      major_categories: [],
      student_order: [],
      created_at: new Date(),
      updated_at: new Date(),
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    logger.error({ err: error }, "Create Class Error");
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
