import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Category: Model<ICategory> =
  mongoose.models?.Category ||
  mongoose.model<ICategory>("Category", categorySchema);

export default Category;
