import { Document } from 'mongoose';

export interface ICategory extends Document {
  _id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}
