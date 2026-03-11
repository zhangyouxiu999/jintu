import mongoose from 'mongoose';
import dbConnect from './lib/dbConnect.js';
import Class from './models/Class.js';
import Student from './models/Student.js';

async function swapStudents() {
  try {
    await dbConnect();
    
    const classOne = await Class.findOne({ name: /1班/ });
    const classTwo = await Class.findOne({ name: /2班/ });

    if (!classOne || !classTwo) {
      console.error('Error: Class 1 or Class 2 not found.');
      process.exit(1);
    }

    const class1Id = classOne._id;
    const class2Id = classTwo._id;
    const tempId = new mongoose.Types.ObjectId(); // 临时中间 ID

    console.log(`Starting swap:`);
    console.log(`Class 1: ${classOne.name} (ID: ${class1Id})`);
    console.log(`Class 2: ${classTwo.name} (ID: ${class2Id})`);

    // 1. 将 1 班学生移至临时 ID
    const step1 = await Student.updateMany(
      { current_class_id: class1Id },
      { $set: { current_class_id: tempId } }
    );
    console.log(`Step 1: Moved ${step1.modifiedCount} students from Class 1 to Temp.`);

    // 2. 将 2 班学生移至 1 班
    const step2 = await Student.updateMany(
      { current_class_id: class2Id },
      { $set: { current_class_id: class1Id } }
    );
    console.log(`Step 2: Moved ${step2.modifiedCount} students from Class 2 to Class 1.`);

    // 3. 将临时 ID 的学生（原 1 班）移至 2 班
    const step3 = await Student.updateMany(
      { current_class_id: tempId },
      { $set: { current_class_id: class2Id } }
    );
    console.log(`Step 3: Moved ${step3.modifiedCount} students from Temp to Class 2.`);

    console.log('\nSwap completed successfully!');
    
    // 最终检查
    const finalCount1 = await Student.countDocuments({ current_class_id: class1Id });
    const finalCount2 = await Student.countDocuments({ current_class_id: class2Id });
    console.log(`Final count - Class 1: ${finalCount1} students`);
    console.log(`Final count - Class 2: ${finalCount2} students`);

    process.exit(0);
  } catch (error) {
    console.error('Error during swap:', error);
    process.exit(1);
  }
}

swapStudents();
