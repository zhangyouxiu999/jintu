import Class from "@/models/Class";
import Student from "@/models/Student";
import AttendanceHistory from "@/models/AttendanceHistory";
import AttendanceLog from "@/models/AttendanceLog";
import Category from "@/models/Category";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
} from "date-fns";

export interface HistoryQueryRange {
  month?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export class AttendanceHistoryService {
  static resolveDateRange(params: HistoryQueryRange) {
    const { month, startDate, endDate } = params;

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (month) {
      const [year, m] = month.split("-").map(Number);
      start = startOfMonth(new Date(year, m - 1));
      end = endOfMonth(new Date(year, m - 1));
    } else {
      start = startOfMonth(new Date());
      end = endOfMonth(new Date());
    }

    return { startDate: start, endDate: end };
  }

  static async getHistory(code: string, range: HistoryQueryRange) {
    const { month, startDate, endDate } = range;
    const { startDate: start, endDate: end } = this.resolveDateRange(range);

    const classData = await Class.findOne({ code });
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

    const logs = await AttendanceHistory.find({
      class_code: code,
      date: {
        $gte: format(start, "yyyy-MM-dd"),
        $lte: format(end, "yyyy-MM-dd"),
      },
    }).sort({ date: 1, period: 1 });

    const historicalStudentIds = [
      ...new Set(
        logs.flatMap((log: any) =>
          (log.records || []).map((r: any) => r.student_id)
        )
      ),
    ];

    const currentStudentIds = students.map(
      (s: any) => s.student_id || s._id.toString()
    );

    const missingStudentIds = historicalStudentIds.filter(
      (id) => !currentStudentIds.includes(id)
    );

    if (missingStudentIds.length > 0) {
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      const validObjectIds = missingStudentIds.filter((id) =>
        objectIdPattern.test(id)
      );

      const missingStudents = await Student.find({
        $or: [
          { student_id: { $in: missingStudentIds } },
          { _id: { $in: validObjectIds } },
        ],
      });

      students = [...students, ...missingStudents];
    }

    const matrix: Record<string, Record<string, Record<number, number>>> = {};

    logs.forEach((log: any) => {
      log.records.forEach((record: any) => {
        const sId = record.student_id as string;
        if (!matrix[sId]) matrix[sId] = {};
        if (!matrix[sId][log.date]) matrix[sId][log.date] = {};
        matrix[sId][log.date][log.period as number] =
          record.status as number;
      });
    });

    return {
      className: classData.name,
      month: month || format(start, "yyyy-MM"),
      days: eachDayOfInterval({ start, end }).map((d) =>
        format(d, "yyyy-MM-dd")
      ),
      students: students.map((s: any) => ({
        id: s.student_id || s._id.toString(),
        name: s.name,
      })),
      matrix,
      student_order: classData.student_order || [],
    };
  }

  static async updateRecord(params: {
    code: string;
    date: string;
    period: number;
    student_id: string;
    status: number;
  }) {
    const { code, date, period, student_id, status } = params;

    if (status === -1) {
      await AttendanceHistory.updateOne(
        { class_code: code, date, period },
        { $pull: { records: { student_id } } }
      );

      await AttendanceLog.deleteOne({
        class_code: code,
        date,
        period,
        student_id,
      });

      return { success: true };
    }

    const updateResult = await AttendanceHistory.updateOne(
      { class_code: code, date, period, "records.student_id": student_id },
      {
        $set: { "records.$.status": status },
      }
    );

    if (updateResult.matchedCount === 0) {
      await AttendanceHistory.findOneAndUpdate(
        { class_code: code, date, period },
        {
          $push: { records: { student_id, status } },
        },
        { upsert: true, new: true }
      );
    }

    await AttendanceLog.findOneAndUpdate(
      { class_code: code, date, period, student_id },
      {
        $set: { status, updated_at: new Date() },
        $setOnInsert: { class_code: code, date, period, student_id },
      },
      { upsert: true }
    );

    return { success: true };
  }

  static buildDeleteFilter(code: string, range: HistoryQueryRange) {
    const { month, startDate, endDate } = range;
    const filter: any = { class_code: code };

    if (startDate && endDate) {
      filter.date = {
        $gte: startDate,
        $lte: endDate,
      };
    } else if (month) {
      const [year, m] = month.split("-").map(Number);
      const start = startOfMonth(new Date(year, m - 1));
      const end = endOfMonth(new Date(year, m - 1));

      filter.date = {
        $gte: format(start, "yyyy-MM-dd"),
        $lte: format(end, "yyyy-MM-dd"),
      };
    }

    return filter;
  }

  static buildDeleteMessage(range: HistoryQueryRange) {
    const { month, startDate, endDate } = range;

    if (startDate && endDate) {
      return `已清除 ${startDate} 至 ${endDate} 的报表及考勤记录`;
    }

    if (month) {
      return `已清除 ${month} 的报表及考勤记录`;
    }

    return "已清除所有报表及考勤记录";
  }

  static async deleteRange(code: string, range: HistoryQueryRange) {
    const filter = this.buildDeleteFilter(code, range);

    const [historyResult, logResult] = await Promise.all([
      AttendanceHistory.deleteMany(filter),
      AttendanceLog.deleteMany(filter),
    ]);

    const message = this.buildDeleteMessage(range);

    return {
      success: true,
      deletedHistoryCount: historyResult.deletedCount,
      deletedLogCount: logResult.deletedCount,
      message,
    };
  }
}
