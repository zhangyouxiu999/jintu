import { Document } from "mongoose";

export interface IClass extends Document {
  _id: string;
  code: string;
  name: string;
  teacher: string;
  major_categories?: string[];
  student_order?: string[];
  created_at: Date;
  updated_at: Date;
}
