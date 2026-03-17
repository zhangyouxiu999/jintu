import Grade from "@/models/Grade";
import mongoose from "mongoose";

export class GradeService {
  static async getGradesByExam(exam_id: string) {
    const grades = await Grade.find({ exam_id }).sort({ student_id: 1 });
    return grades;
  }

  static async saveGrades(params: {
    exam_id: string;
    grades: any[];
  }): Promise<{
    success: boolean;
    count: number;
    details: {
      nModified: number;
      nUpserted: number;
      nRemoved: number;
    };
  }> {
    const { exam_id, grades } = params;

    const examObjectId = new mongoose.Types.ObjectId(exam_id);

    const operations = grades.map((g: any) => {
      if (g.score === "" && !g.remark) {
        return {
          deleteOne: {
            filter: { exam_id: examObjectId, student_id: g.student_id },
          },
        };
      }

      const sanitizedSubjects = (g.subjects || []).map((s: any) => ({
        name: s.name,
        score:
          s.score === "" || s.score === null || s.score === undefined
            ? 0
            : Number(s.score),
      }));

      const sanitizedScore =
        g.score === "" || g.score === null || g.score === undefined
          ? 0
          : Number(g.score);

      return {
        updateOne: {
          filter: { exam_id: examObjectId, student_id: g.student_id },
          update: {
            $set: {
              score: sanitizedScore,
              subjects: sanitizedSubjects,
              remark: g.remark || "",
              is_absent: !!g.is_absent,
              student_no: g.student_no || undefined,
              updated_at: new Date(),
            },
            $setOnInsert: {
              exam_id: examObjectId,
              student_id: g.student_id,
            },
          },
          upsert: true,
        },
      };
    });

    let result = { nModified: 0, nUpserted: 0, nRemoved: 0 };

    if (operations.length > 0) {
      const bulkResult = await Grade.bulkWrite(operations, { ordered: false });
      result = {
        nModified: bulkResult.modifiedCount || 0,
        nUpserted: bulkResult.upsertedCount || 0,
        nRemoved: bulkResult.deletedCount || 0,
      };
    }

    return {
      success: true,
      count: result.nModified + result.nUpserted + result.nRemoved,
      details: result,
    };
  }
}
