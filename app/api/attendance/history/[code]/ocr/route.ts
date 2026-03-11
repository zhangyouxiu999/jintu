import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import Class from "@/models/Class";
import Student from "@/models/Student";
import Category from "@/models/Category";

// 简单的编辑距离算法，用于模糊匹配姓名
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "未接收到识别文本" }, { status: 400 });
    }

    // 1. 连接数据库
    await dbConnect();

    // 2. 获取班级及其学生（与其它考勤接口保持一致逻辑）
    const classData = await Class.findOne({ code });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    let students: any[] = [];
    if (classData.major_categories && classData.major_categories.length > 0) {
      const categories = await Category.find({
        name: { $in: classData.major_categories },
      });
      const categoryIds = categories.map((cat) => cat._id);
      students = await Student.find({ category_id: { $in: categoryIds } });
    } else {
      students = await Student.find({ current_class_id: classData._id });
    }

    if (students.length === 0) {
      return NextResponse.json(
        { error: "该班级暂无学生数据" },
        { status: 400 }
      );
    }

    // 3. 解析文本行
    // Tesseract 识别的结果通常是按行分割的文本
    const rawLines = text
      .split("\n")
      .filter((line: string) => line.trim().length > 1);

    // 4. 执行模糊匹配
    const recognitionResults = rawLines.map((lineText: string) => {
      // 预处理行文本：去除空格和大部分标点符号，保留中文和基础符号
      const cleanText = lineText.replace(
        /[\s\t\r\n\-\_\=\+\[\]\{\}\\\|\;\:\'\"\,\.\<\>\/\?]/g,
        ""
      );

      // 提取状态标识 - 扩展识别范围
      // 1 (已到): √, v, V, r, R, y, Y, 1, ✓, ✔
      // 0 (未到): ×, x, X, n, N, 0, ✗, ✘
      // 2 (迟到/请假): ○, o, O, 2, 0, ◯, ◦
      // 3 (晚到/特殊): △, 3, ▲, ▷
      let status = 1; // 默认已到

      if (/[×xXnN0✗✘]/.test(cleanText)) status = 0;
      else if (/[○oO◯◦]/.test(cleanText)) status = 2;
      else if (/[△▲▷]/.test(cleanText)) status = 3;
      else if (/[√vVrRyY1✓✔]/.test(cleanText)) status = 1;

      // 提取可能的姓名部分 (尝试只保留中文字符)
      const namePart = cleanText.replace(/[^\u4e00-\u9fa5]/g, "");

      let bestMatch: any = null;
      let minDistance = Infinity;

      // 如果姓名部分太短，尝试使用过滤掉状态符号后的原始文本
      const searchName =
        namePart.length >= 2
          ? namePart
          : cleanText.replace(/[√vVrRyY✓✔×xXnN✗✘○oO◯◦△▲▷0123]/g, "");

      for (const student of students) {
        const distance = levenshteinDistance(searchName, student.name);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = student;
        }
      }

      // 动态调整匹配阈值：姓名越长，允许的误差越大
      const threshold =
        searchName.length <= 2 ? 1 : Math.floor(searchName.length / 2);
      const isMatch = bestMatch && minDistance <= threshold;

      return {
        studentId: isMatch ? (bestMatch.student_id as string) : null,
        studentName: isMatch
          ? (bestMatch.name as string)
          : `未知(${searchName || cleanText})`,
        recognizedStatus: status,
        confidence: isMatch
          ? 1 - minDistance / Math.max(bestMatch.name.length, searchName.length)
          : 0,
        originalText: lineText.trim(),
      };
    });

    // 5. 补充班级中未识别到的学生（与考勤表一致：使用字符串 student_id）
    const recognizedStudentIds = recognitionResults
      .filter((r: { studentId?: string }) => r.studentId)
      .map((r: { studentId?: string }) => String(r.studentId));

    const missingStudents = students.filter(
      (s: any) => !recognizedStudentIds.includes(String(s.student_id))
    );

    const finalResults = [
      ...recognitionResults,
      ...missingStudents.map((s: any) => ({
        studentId: s.student_id,
        studentName: s.name,
        recognizedStatus: 1,
        confidence: 1,
        isMissing: true,
      })),
    ];

    return NextResponse.json({
      success: true,
      results: finalResults,
    });
  } catch (error: any) {
    logger.error({ err: error }, "OCR API Error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
