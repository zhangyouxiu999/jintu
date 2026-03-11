import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudentAttendance {
  student_id: string;
  status: number;
}

export interface IAttendanceHistory extends Document {
  class_code: string;
  date: string;
  period: number; // 0: 早上, 1: 中午, 2: 晚一, 3: 晚二
  records: IStudentAttendance[];
  confirmed_at: Date;
}

const attendanceHistorySchema = new Schema<IAttendanceHistory>({
  class_code: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: String,
    required: true,
    index: true,
  },
  period: {
    type: Number,
    required: true,
  },
  records: [
    {
      student_id: { type: String, required: true },
      status: { type: Number, required: true },
    },
  ],
  confirmed_at: {
    type: Date,
    default: Date.now,
  },
});

// 复合索引：一个班级在某天某个时段只能有一份确认后的完整报表
attendanceHistorySchema.index(
  { class_code: 1, date: 1, period: 1 },
  { unique: true }
);

const AttendanceHistory: Model<IAttendanceHistory> =
  mongoose.models?.AttendanceHistory ||
  mongoose.model<IAttendanceHistory>(
    "AttendanceHistory",
    attendanceHistorySchema
  );

export default AttendanceHistory;
