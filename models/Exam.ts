import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExamSubject {
  name: string;
  max_score: number;
}

export interface IClassConfig {
  class_id: mongoose.Types.ObjectId;
  subjects: IExamSubject[];
}

export interface IExam extends Document {
  name: string;
  subjects: IExamSubject[]; // 全局默认科目（可选）
  date: Date;
  max_score: number; // 全局默认满分
  class_id?: mongoose.Types.ObjectId; // 保持兼容
  class_ids?: mongoose.Types.ObjectId[]; // 支持多个班级
  class_configs?: IClassConfig[]; // 各个班级的单独配置
  created_at: Date;
  updated_at: Date;
}

const ExamSchema = new Schema<IExam>({
  name: {
    type: String,
    required: [true, "请提供考试名称"],
    trim: true,
  },
  subjects: [
    {
      name: { type: String, required: true },
      max_score: { type: Number, required: true, default: 100 },
    },
  ],
  date: {
    type: Date,
    required: [true, "请提供考试日期"],
    default: Date.now,
  },
  max_score: {
    type: Number,
    required: [true, "请提供满分分值"],
    default: 100,
  },
  class_id: {
    type: Schema.Types.ObjectId,
    ref: "Class",
  },
  class_ids: [
    {
      type: Schema.Types.ObjectId,
      ref: "Class",
    },
  ],
  class_configs: [
    {
      class_id: { type: Schema.Types.ObjectId, ref: "Class" },
      subjects: [
        {
          name: { type: String, required: true },
          max_score: { type: Number, required: true, default: 100 },
        },
      ],
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// 在开发环境下，如果模型已存在则删除，以确保 Schema 的更改能即时生效
if (process.env.NODE_ENV === "development" && mongoose.models.Exam) {
  delete mongoose.models.Exam;
}

const Exam: Model<IExam> =
  mongoose.models.Exam || mongoose.model<IExam>("Exam", ExamSchema);

export default Exam;
