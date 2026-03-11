import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnouncement extends Document {
  class_id: string;
  content: string;
  is_active: boolean;
  expiration_type: "today" | "permanent" | "custom";
  starts_at?: Date;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const announcementSchema = new Schema<IAnnouncement>({
  class_id: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  expiration_type: {
    type: String,
    enum: ["today", "permanent", "custom"],
    default: "today",
  },
  starts_at: {
    type: Date,
    default: null,
  },
  expires_at: {
    type: Date,
    default: null,
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

announcementSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

const Announcement: Model<IAnnouncement> =
  mongoose.models?.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", announcementSchema);

export default Announcement;
