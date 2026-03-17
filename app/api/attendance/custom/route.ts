import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import CustomAttendance from "@/models/CustomAttendance";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const target_id = searchParams.get("target_id");

    if (!type) {
      return NextResponse.json(
        { message: "Missing type" },
        { status: 400 }
      );
    }

    // type=staff_check 时可不传 target_id，返回该 type 下全部记录（月度核查用）
    const filter: { type: string; target_id?: string } = { type };
    if (target_id) filter.target_id = target_id;
    const records = await CustomAttendance.find(filter);
    return NextResponse.json(records);
  } catch (error: any) {
    logger.error({ err: error }, "Fetch Custom Attendance Error");
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { type, target_id, date, status_morning, status_afternoon, status_evening, custom_data, action } = body;

    if (action === "batch_save") {
      const { records } = body;
      if (!Array.isArray(records)) {
        return NextResponse.json({ message: "Invalid records" }, { status: 400 });
      }

      const operations = records.map((r: any) => ({
        updateOne: {
          filter: { type: r.type, target_id: r.target_id, date: r.date },
          update: {
            $set: {
              status_morning: r.status_morning,
              status_afternoon: r.status_afternoon,
              status_evening: r.status_evening,
              custom_data: r.custom_data,
              updated_at: new Date(),
            },
            $setOnInsert: {
              type: r.type,
              target_id: r.target_id,
              date: r.date,
            },
          },
          upsert: true,
        },
      }));

      await CustomAttendance.bulkWrite(operations);
      return NextResponse.json({ success: true });
    }

    if (!type || !target_id || !date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const record = await CustomAttendance.findOneAndUpdate(
      { type, target_id, date },
      {
        $set: {
          status_morning,
          status_afternoon,
          status_evening,
          custom_data,
          updated_at: new Date(),
        },
        $setOnInsert: { type, target_id, date },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(record);
  } catch (error: any) {
    logger.error({ err: error }, "Save Custom Attendance Error");
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
