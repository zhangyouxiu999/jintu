import Exam from "@/models/Exam";
import Grade from "@/models/Grade";
import Student from "@/models/Student";

export class ExamService {
  static normalizeSubjects(examObj: any) {
    if (
      (!examObj.subjects || examObj.subjects.length === 0) &&
      (examObj as any).subject
    ) {
      examObj.subjects = [
        { name: (examObj as any).subject, max_score: 100 },
      ];
    }
    return examObj;
  }

  static async listExamsWithStats() {
    const exams = await Exam.find({})
      .populate("class_id", "name")
      .populate("class_ids", "name")
      .sort({ date: -1, created_at: -1 });

    const examsWithStats = await Promise.all(
      exams.map(async (exam) => {
        const gradedCount = await Grade.countDocuments({ exam_id: exam._id });

        let totalStudents = 0;
        if (exam.class_ids && exam.class_ids.length > 0) {
          const classIds = exam.class_ids.map((c: any) => c._id || c);
          totalStudents = await Student.countDocuments({
            current_class_id: { $in: classIds },
          });
        } else if (exam.class_id) {
          const classId = (exam.class_id as any)._id || exam.class_id;
          totalStudents = await Student.countDocuments({
            current_class_id: classId,
          });
        } else {
          totalStudents = await Student.countDocuments({});
        }

        const examObj = this.normalizeSubjects(exam.toObject());

        return {
          ...examObj,
          gradedCount,
          totalStudents,
        };
      })
    );

    return examsWithStats;
  }

  static async createExam(body: {
    name: string;
    subjects?: any[];
    date?: string;
    max_score?: number;
    class_id?: string;
    class_ids?: string[];
  }) {
    const { name, subjects, date, max_score, class_id, class_ids } = body;

    const finalSubjects = Array.isArray(subjects) ? subjects : [];

    const exam = await Exam.create({
      name,
      subjects: finalSubjects,
      date: date ? new Date(date) : new Date(),
      max_score:
        max_score ||
        (finalSubjects.length > 0
          ? finalSubjects.reduce(
              (acc: number, s: any) => acc + (s.max_score || 0),
              0
            )
          : 100),
      class_id:
        class_id ||
        (class_ids && class_ids.length > 0 ? class_ids[0] : undefined),
      class_ids: class_ids || (class_id ? [class_id] : []),
    });

    return exam;
  }

  static async getExamById(id: string) {
    const exam = await Exam.findById(id)
      .populate("class_id", "name")
      .populate("class_ids", "name");

    if (!exam) {
      return null;
    }

    const examObj = this.normalizeSubjects(exam.toObject());
    return examObj;
  }

  static async updateExam(id: string, data: any) {
    const exam = await Exam.findByIdAndUpdate(
      id,
      { $set: { ...data, updated_at: new Date() } },
      { new: true, runValidators: true }
    )
      .populate("class_id", "name")
      .populate("class_ids", "name");

    if (!exam) {
      return null;
    }

    return exam;
  }

  static async deleteExam(id: string) {
    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) {
      return null;
    }

    await Grade.deleteMany({ exam_id: id });

    return exam;
  }
}
