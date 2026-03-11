import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClass extends Document {
  code: string;
  name: string;
  teacher?: string;
  major_categories: string[];
  student_order: string[];
  created_at: Date;
  updated_at: Date;
}

const classSchema = new Schema<IClass>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  teacher: { type: String, required: false },
  major_categories: [{ type: String }],
  student_order: [{ type: String }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Class: Model<IClass> =
  mongoose.models?.Class || mongoose.model<IClass>("Class", classSchema);

export default Class;
