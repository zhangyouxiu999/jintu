import mongoose from 'mongoose';

export interface IStudent extends mongoose.Document {
  student_id: string;
  name: string;
  gender?: 'male' | 'female' | 'other';
  current_class_id: mongoose.Schema.Types.ObjectId;
  previous_class_id?: mongoose.Schema.Types.ObjectId;
  category_id: mongoose.Schema.Types.ObjectId;
  origin_school?: string;
  birthday?: Date;
  enroll_date?: Date;
  created_at: Date;
  updated_at: Date;
}
