import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import AttendanceHistory from "@/models/AttendanceHistory";
import AttendanceLog from "@/models/AttendanceLog";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { date, periods, results } = await req.json();

    if (!date || !periods || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    await dbConnect();

    // 批量处理每个时段
    for (const periodId of periods) {
      // 1. 更新 AttendanceHistory
      // 先确保该日期和时段的记录存在
      let history = await AttendanceHistory.findOne({
        class_code: code,
        date: date,
        period: periodId,
      });

      if (!history) {
        history = new AttendanceHistory({
          class_code: code,
          date: date,
          period: periodId,
          records: [],
        });
      }

      // 更新记录
      for (const res of results) {
        if (res.studentId != null && res.recognizedStatus !== undefined) {
          const studentIdStr = String(res.studentId);
          const existingRecordIndex = history.records.findIndex(
            (r: any) => String(r.student_id) === studentIdStr
          );

          if (existingRecordIndex > -1) {
            history.records[existingRecordIndex].status = res.recognizedStatus;
          } else {
            history.records.push({
              student_id: studentIdStr,
              status: res.recognizedStatus,
            });
          }

          // 2. 同步更新 AttendanceLog (与模型一致：student_id 为字符串学号)
          await AttendanceLog.findOneAndUpdate(
            {
              class_code: code,
              student_id: studentIdStr,
              date: date,
              period: periodId,
            },
            { status: res.recognizedStatus },
            { upsert: true }
          );
        }
      }

      await history.save();
    }

    return NextResponse.json({ success: true, message: "批量更新成功" });
  } catch (error: any) {
    logger.error({ err: error }, "OCR Apply Error");
    return NextResponse.json(
      { error: error.message || "应用识别结果失败" },
      { status: 500 }
    );
  }
}
