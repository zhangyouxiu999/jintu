import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import Student from "@/models/Student";
import Class from "@/models/Class";
import CustomAttendance from "@/models/CustomAttendance";
import AttendanceLog from "@/models/AttendanceLog";
import AttendanceHistory from "@/models/AttendanceHistory";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const data = await request.json();
    const { id } = await params;

    // 如果修改了班级，需要处理旧班级的排序移除逻辑（可选，取决于系统对排序的要求）
    const student = await Student.findByIdAndUpdate(
      id,
      { ...data, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!student) {
      return NextResponse.json({ error: "学生不存在" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    const err = error as any;
    logger.error({ err }, "Update Student Error");
    if (err.code === 11000) {
      return NextResponse.json({ error: "学号已存在" }, { status: 400 });
    }
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: "学生不存在" }, { status: 404 });
    }

    const studentIdForOrder = student.student_id;

    // 1. 从班级排序中移除该学生
    await Class.updateMany(
      { student_order: studentIdForOrder },
      { $pull: { student_order: studentIdForOrder } }
    );

    // 2. 删除关联的专项考勤记录 (CustomAttendance)
    await CustomAttendance.deleteMany({
      type: "individual",
      target_id: studentIdForOrder,
    });

    // 3. 删除关联的实时考勤日志 (AttendanceLog)
    await AttendanceLog.deleteMany({
      student_id: studentIdForOrder,
    });

    // 4. 从历史考勤报表中移除该学生 (AttendanceHistory)
    await AttendanceHistory.updateMany(
      { "records.student_id": studentIdForOrder },
      { $pull: { records: { student_id: studentIdForOrder } } }
    );

    // 5. 删除学生记录
    await Student.findByIdAndDelete(id);

    return NextResponse.json({ message: "学生已删除及其关联数据" });
  } catch (error) {
    const err = error as Error;
    logger.error({ err }, "Delete Student Error");
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
