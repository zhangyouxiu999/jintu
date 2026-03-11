import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomAttendance extends Document {
  type: "individual" | "staff_check";
  target_id: string; // student_id for individual, staff_id for staff_check
  date: string;
  status_morning?: string;
  status_afternoon?: string;
  status_evening?: string;
  custom_data?: any;
  updated_at: Date;
}

const customAttendanceSchema = new Schema<ICustomAttendance>({
  type: {
    type: String,
    required: true,
    enum: ["individual", "staff_check"],
    index: true,
  },
  target_id: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: String,
    required: true,
    index: true,
  },
  status_morning: {
    type: String,
  },
  status_afternoon: {
    type: String,
  },
  status_evening: {
    type: String,
  },
  custom_data: {
    type: Schema.Types.Mixed,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

customAttendanceSchema.index({ type: 1, target_id: 1, date: 1 }, { unique: true });

const CustomAttendance: Model<ICustomAttendance> =
  mongoose.models?.CustomAttendance ||
  mongoose.model<ICustomAttendance>("CustomAttendance", customAttendanceSchema);

export default CustomAttendance;
