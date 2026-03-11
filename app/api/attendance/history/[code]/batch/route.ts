import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import AttendanceHistory from "@/models/AttendanceHistory";
import AttendanceLog from "@/models/AttendanceLog";
import Class from "@/models/Class";
import Student from "@/models/Student";
import Category from "@/models/Category";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await dbConnect();
    const { code } = await params;
    const body = await request.json();
    const { type, id, studentIds, dates, periods, status } = body; // type: 'student' | 'day' | 'range', id: studentId or date

    if (
      !type ||
      (type !== "all" && !id && !studentIds && !dates) ||
      status === undefined
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (type === "range") {
      if (!studentIds || !dates || !periods) {
        return NextResponse.json(
          { error: "Missing studentIds, dates or periods for range update" },
          { status: 400 }
        );
      }

      // 1. 获取班级所有学生（仅用于确认学生存在，不再用于全量初始化）
      const classData = await Class.findOne({ code });
      if (!classData) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }

      // 2. 针对每一个 (日期, 时段) 进行精确更新
      for (const date of dates) {
        for (const period of periods) {
          if (status === -1) {
            // --- 取消标注逻辑 ---
            // A. 从 AttendanceHistory.records 中移除选中的学生
            await AttendanceHistory.updateOne(
              { class_code: code, date, period },
              {
                $pull: {
                  records: { student_id: { $in: studentIds } },
                },
              }
            );

            // B. 从 AttendanceLog 中删除对应的实时记录
            await AttendanceLog.deleteMany({
              class_code: code,
              date,
              period,
              student_id: { $in: studentIds },
            });
          } else {
            // --- 正常标注逻辑 ---
            // A. 确保 AttendanceHistory 文档存在
            await AttendanceHistory.findOneAndUpdate(
              { class_code: code, date, period },
              {
                $setOnInsert: {
                  records: [],
                  confirmed_at: new Date(),
                },
              },
              { upsert: true }
            );

            // B. 更新已经在 records 数组中的学生状态
            await AttendanceHistory.updateOne(
              { class_code: code, date, period },
              { $set: { "records.$[elem].status": status } },
              {
                arrayFilters: [{ "elem.student_id": { $in: studentIds } }],
              }
            );

            // C. 对于不在 records 数组中的选中学生，使用 $push 添加进去
            const currentDoc = await AttendanceHistory.findOne({
              class_code: code,
              date,
              period,
            });
            if (currentDoc) {
              const existingInDoc = new Set(
                currentDoc.records.map((r: any) => r.student_id)
              );
              const toAdd = (studentIds as string[]).filter((id: string) => !existingInDoc.has(id));

              if (toAdd.length > 0) {
                await AttendanceHistory.updateOne(
                  { class_code: code, date, period },
                  {
                    $push: {
                      records: {
                        $each: toAdd.map((sId: string) => ({
                          student_id: sId,
                          status,
                        })),
                      },
                    },
                  }
                );
              }
            }

            // D. 更新 AttendanceLog (实时表)
            for (const studentId of studentIds) {
              await AttendanceLog.findOneAndUpdate(
                { class_code: code, date, period, student_id: studentId },
                { $set: { status, updated_at: new Date() } },
                { upsert: true }
              );
            }
          }
        }
      }
    } else if (type === "student") {
      if (status === -1) {
        // --- 取消标注逻辑 ---
        await AttendanceHistory.updateMany(
          { class_code: code },
          { $pull: { records: { student_id: id } } }
        );
        await AttendanceLog.deleteMany({ class_code: code, student_id: id });
      } else {
        // --- 正常标注逻辑 ---
        await AttendanceHistory.updateMany(
          { class_code: code, "records.student_id": id },
          { $set: { "records.$.status": status } }
        );
        await AttendanceLog.updateMany(
          { class_code: code, student_id: id },
          { $set: { status, updated_at: new Date() } }
        );
      }
    } else if (type === "day") {
      if (status === -1) {
        // --- 取消标注逻辑 ---
        await AttendanceHistory.updateMany(
          { class_code: code, date: id },
          { $set: { records: [] } }
        );
        await AttendanceLog.deleteMany({ class_code: code, date: id });
      } else {
        // --- 正常标注逻辑 ---
        // 1. 获取该日期已有的记录
        const historyRecords = await AttendanceHistory.find({
          class_code: code,
          date: id,
        });

        // 如果没有任何时段的记录，则需要初始化
        if (historyRecords.length === 0) {
          const classData = await Class.findOne({ code });
          if (classData) {
            let students = [];
            if (
              classData.major_categories &&
              classData.major_categories.length > 0
            ) {
              const categories = await Category.find({
                name: { $in: classData.major_categories },
              });
              const categoryIds = categories.map((cat) => cat._id);
              students = await Student.find({
                category_id: { $in: categoryIds },
              });
            } else {
              students = await Student.find({
                current_class_id: classData._id,
              });
            }

            const studentRecords = students.map((s: any) => ({
              student_id: s.student_id || s._id.toString(),
              status: status,
            }));

            const newHistories = [0, 1, 2, 3].map((period) => ({
              class_code: code,
              date: id,
              period,
              records: studentRecords,
              confirmed_at: new Date(),
            }));

            await AttendanceHistory.insertMany(newHistories);
          }
        } else {
          for (const history of historyRecords) {
            const updatedRecords = history.records.map((r) => ({
              ...r,
              status: status,
            }));
            history.records = updatedRecords;
            await history.save();
          }
        }

        await AttendanceLog.updateMany(
          { class_code: code, date: id },
          { $set: { status, updated_at: new Date() } }
        );
      }
    } else if (type === "all") {
      if (status === -1) {
        // --- 取消标注逻辑 ---
        await AttendanceHistory.updateMany(
          { class_code: code },
          { $set: { records: [] } }
        );
        await AttendanceLog.deleteMany({ class_code: code });
      } else {
        // --- 正常标注逻辑 ---
        await AttendanceHistory.updateMany(
          { class_code: code },
          { $set: { "records.$[].status": status } }
        );
        await AttendanceLog.updateMany(
          { class_code: code },
          { $set: { status, updated_at: new Date() } }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ err: error }, "Batch Update Error");
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
