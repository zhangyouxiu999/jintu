const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/school_cms";

const classSchema = new mongoose.Schema({
  code: String,
  name: String,
  teacher: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Class = mongoose.models.Class || mongoose.model('Class', classSchema);

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected for seeding...');

    await Class.deleteMany({}); // 清空旧数据

    await Class.create([
      { code: "class-001", name: "佰盈1班", teacher: "张老师" },
      { code: "class-002", name: "佰盈2班", teacher: "李老师" },
      { code: "class-003", name: "佰盈3班", teacher: "王老师" }
    ]);

    console.log('✅ Seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
