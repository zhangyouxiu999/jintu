import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendanceLog extends Document {
  class_code: string;
  student_id: string;
  date: string;
  period: number; // 0: 早上, 1: 中午, 2: 晚一, 3: 晚二
  status: number; // 0: 未到, 1: 已到, 2: 请假, 3: 晚到
  updated_at: Date;
}

const attendanceLogSchema = new Schema<IAttendanceLog>({
  class_code: {
    type: String,
    required: true,
    index: true,
  },
  student_id: {
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
    default: 0, // 默认早上
  },
  status: {
    type: Number,
    required: true,
    default: 0,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

attendanceLogSchema.index(
  { class_code: 1, student_id: 1, date: 1, period: 1 },
  { unique: true }
);

const AttendanceLog: Model<IAttendanceLog> =
  mongoose.models?.AttendanceLog ||
  mongoose.model<IAttendanceLog>("AttendanceLog", attendanceLogSchema);

export default AttendanceLog;
