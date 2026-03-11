import Class from "@/models/Class";
import Student from "@/models/Student";
import AttendanceLog from "@/models/AttendanceLog";
import AttendanceHistory from "@/models/AttendanceHistory";
import Category from "@/models/Category";

type AttendanceStatus = number;

type StudentAttendanceMap = Record<number, AttendanceStatus>;

export interface DailyAttendanceStudent {
  id: string;
  name: string;
  attendance: StudentAttendanceMap;
}

export interface DailyAttendanceResult {
  id: string;
  name: string;
  students: DailyAttendanceStudent[];
}

export class AttendanceService {
  static async getDailyAttendance(
    classCode: string,
    date: string
  ): Promise<DailyAttendanceResult | null> {
    const classData = await Class.findOne({ code: classCode });

    if (!classData) {
      return null;
    }

    let students: any[] = [];

    if (classData.major_categories && classData.major_categories.length > 0) {
      const categories = await Category.find({
        name: { $in: classData.major_categories },
      });
      const categoryIds = categories.map((cat) => cat._id);
      students = await Student.find({ category_id: { $in: categoryIds } });
    } else {
      students = await Student.find({ current_class_id: classData._id });
    }

    const attendanceLogs = await AttendanceLog.find({
      class_code: classCode,
      date,
    });

    const attendanceMap: Record<string, StudentAttendanceMap> = {};

    attendanceLogs.forEach((log: any) => {
      const studentId = log.student_id as string;
      if (!attendanceMap[studentId]) {
        attendanceMap[studentId] = {};
      }
      attendanceMap[studentId][log.period as number] = log.status as number;
    });

    let sortedStudents = students;

    if (classData.student_order && classData.student_order.length > 0) {
      const orderMap = new Map(
        classData.student_order.map((id: string, index: number) => [id, index])
      );

      sortedStudents = [...students].sort((a: any, b: any) => {
        const idA = (a.student_id || a._id?.toString()) as string;
        const idB = (b.student_id || b._id?.toString()) as string;
        const orderA = orderMap.get(idA) ?? 1000;
        const orderB = orderMap.get(idB) ?? 1000;
        return orderA - orderB;
      });
    }

    return {
      id: classData.code,
      name: classData.name,
      students: sortedStudents.map((s: any) => {
        const sId = (s.student_id || s._id?.toString()) as string;
        return {
          id: sId,
          name: s.name,
          attendance: attendanceMap[sId] || {},
        };
      }),
    };
  }

  static async updateAttendance(params: {
    classCode: string;
    action: "update_attendance" | "batch_update_attendance";
    student_id?: string;
    period: number;
    status: AttendanceStatus;
    date: string;
    student_ids?: string[];
  }) {
    const {
      classCode,
      action,
      student_id,
      student_ids,
      period,
      status,
      date,
    } = params;

    // 同步写入历史考勤表，使历史报表与日考勤矩阵一致
    const syncToHistory = async (
      code: string,
      dateStr: string,
      periodId: number,
      studentId: string,
      statusValue: number
    ) => {
      const updateResult = await AttendanceHistory.updateOne(
        { class_code: code, date: dateStr, period: periodId, "records.student_id": studentId },
        { $set: { "records.$.status": statusValue } }
      );
      if (updateResult.matchedCount === 0) {
        await AttendanceHistory.findOneAndUpdate(
          { class_code: code, date: dateStr, period: periodId },
          { $push: { records: { student_id: studentId, status: statusValue } } },
          { upsert: true, new: true }
        );
      }
    };

    if (action === "update_attendance") {
      if (!student_id) {
        throw new Error("student_id is required for update_attendance");
      }

      const log = await AttendanceLog.findOneAndUpdate(
        { class_code: classCode, student_id, date, period },
        { status, updated_at: new Date() },
        { upsert: true, new: true }
      );

      await syncToHistory(classCode, date, period, student_id, status);

      return log;
    }

    if (action === "batch_update_attendance") {
      if (!student_ids || student_ids.length === 0) {
        throw new Error("student_ids is required for batch_update_attendance");
      }

      const operations = student_ids.map((sId: string) => ({
        updateOne: {
          filter: { class_code: classCode, student_id: sId, date, period },
          update: { status, updated_at: new Date() },
          upsert: true,
        },
      }));

      await AttendanceLog.bulkWrite(operations);

      for (const sId of student_ids) {
        await syncToHistory(classCode, date, period, sId, status);
      }

      return { success: true };
    }

    throw new Error("Invalid action");
  }
}

