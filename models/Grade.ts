import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGradeSubject {
  name: string;
  score: number;
}

export interface IGrade extends Document {
  exam_id: mongoose.Types.ObjectId;
  student_id: string; // 这里我们将存储学生的 MongoDB _id (字符串形式) 以保证唯一性
  student_no?: string; // 可选：存储原始学号用于显示
  score: number; // 总分
  subjects: IGradeSubject[]; // 各科成绩
  remark?: string;
  is_absent?: boolean; // 是否缺考
  created_at: Date;
  updated_at: Date;
}

const GradeSchema = new Schema<IGrade>({
  exam_id: {
    type: Schema.Types.ObjectId,
    ref: "Exam",
    required: [true, "请关联考试"],
    index: true,
  },
  student_id: {
    type: String,
    required: [true, "请提供学号"],
    index: true,
  },
  student_no: {
    type: String,
    trim: true,
  },
  score: {
    type: Number,
    required: [true, "请提供分数"],
    min: [0, "分数不能小于0"],
    default: 0,
  },
  subjects: [
    {
      name: { type: String, required: true },
      score: { type: Number, required: true, default: 0 },
    },
  ],
  remark: {
    type: String,
    trim: true,
  },
  is_absent: {
    type: Boolean,
    default: false,
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

// 复合索引：同一个考试中，一个学生只能有一条成绩记录
GradeSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

const Grade: Model<IGrade> =
  mongoose.models?.Grade || mongoose.model<IGrade>("Grade", GradeSchema);

export default Grade;
