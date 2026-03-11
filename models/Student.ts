import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudent extends Document {
  student_id: string;
  name: string;
  gender: "male" | "female" | "other";
  current_class_id: mongoose.Types.ObjectId;
  previous_class_id?: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  origin_school?: string;
  birthday?: Date;
  enroll_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const StudentSchema = new Schema<IStudent>({
  student_id: {
    type: String,
    required: [true, "请提供学号"],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, "请提供学生姓名"],
    trim: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    default: "other",
  },
  current_class_id: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    required: [true, "请提供当前班级ID"],
  },
  previous_class_id: {
    type: Schema.Types.ObjectId,
    ref: "Class",
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "请提供类别ID"],
  },
  origin_school: {
    type: String,
    trim: true,
  },
  birthday: {
    type: Date,
  },
  enroll_date: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const Student: Model<IStudent> =
  mongoose.models?.Student ||
  mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
