// models/User.js
import { Schema, model, models } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// 防止在开发环境中模型被重复定义
const User = models.User || model('User', userSchema);

export default User;