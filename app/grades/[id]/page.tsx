"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft,
  Save,
  Search,
  User as UserIcon,
  BookOpen,
  Calendar,
  TrendingUp,
  AlertCircle,
  Trash2,
  Settings2,
  History,
  Trophy,
  BarChart,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Plus, X } from "lucide-react";

interface Student {
  _id: string;
  student_id: string;
  name: string;
  current_class_id: string;
}

interface ClassInfo {
  _id: string;
  name: string;
}

interface GradeSubject {
  name: string;
  score: number | string;
}

interface GradeRecord {
  student_id: string;
  student_no?: string;
  score: number | string;
  subjects?: GradeSubject[];
  remark: string;
  is_absent?: boolean;
}

interface ExamSubject {
  name: string;
  max_score: number;
}

interface ClassConfig {
  class_id: string | { _id: string; name: string };
  subjects: ExamSubject[];
}

interface Exam {
  _id: string;
  name: string;
  subjects: ExamSubject[];
  date: string;
  max_score: number;
  class_id?: {
    _id: string;
    name: string;
  };
  class_ids?: {
    _id: string;
    name: string;
  }[];
  class_configs?: ClassConfig[];
}

export default function GradeEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examId } = use(params);
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [grades, setGrades] = useState<Record<string, GradeRecord>>({});
  const [originalGrades, setOriginalGrades] = useState<
    Record<string, GradeRecord>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [bulkPopoverOpen, setBulkPopoverOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("all");
  const [isSubjectsDialogOpen, setIsSubjectsDialogOpen] = useState(false);
  const [editingSubjects, setEditingSubjects] = useState<ExamSubject[]>([]);
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);

  const handleSaveSubjects = async () => {
    if (!selectedClass) return;
    setIsSavingSubjects(true);
    try {
      let updatePayload = {};

      if (selectedClass === "all") {
        updatePayload = { subjects: editingSubjects };
      } else {
        const currentConfigs = exam?.class_configs || [];
        const otherConfigs = currentConfigs.filter((c: ClassConfig) => {
          const classId =
            typeof c.class_id === "string" ? c.class_id : c.class_id._id;
          return classId !== selectedClass;
        });

        const newConfigs = [
          ...otherConfigs,
          { class_id: selectedClass, subjects: editingSubjects },
        ];
        updatePayload = { class_configs: newConfigs };
      }

      const res = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        const examData = await res.json();
        let subjects: ExamSubject[] = [];
        if (Array.isArray(examData.subjects)) {
          subjects = (examData.subjects as (string | ExamSubject)[]).map((s) =>
            typeof s === "string" ? { name: s, max_score: 100 } : s
          );
        } else if (examData.subject) {
          subjects = [{ name: String(examData.subject), max_score: 100 }];
        }

        const normalizedExam = { ...examData, subjects };
        setExam(normalizedExam);
        toast.success(
          selectedClass === "all" ? "默认科目已更新" : "班级科目设置已更新"
        );
        setIsSubjectsDialogOpen(false);
      } else {
        toast.error("保存失败");
      }
    } catch (err) {
      console.error("Save subjects error:", err);
      toast.error("保存出错");
    } finally {
      setIsSavingSubjects(false);
    }
  };
  const [bulkScore, setBulkScore] = useState<string>("");
  const [bulkRemark, setBulkRemark] = useState<string>("");

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(grades) !== JSON.stringify(originalGrades);
  }, [grades, originalGrades]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [examRes, studentsRes, classesRes, gradesRes] = await Promise.all(
          [
            fetch(`/api/exams/${examId}`),
            fetch("/api/students"),
            fetch("/api/classes"),
            fetch(`/api/grades?exam_id=${examId}`),
          ]
        );

        if (examRes.ok && studentsRes.ok && classesRes.ok && gradesRes.ok) {
          const examData = await examRes.json();
          let subjects: ExamSubject[] = [];
          if (Array.isArray(examData.subjects)) {
            subjects = (examData.subjects as (string | ExamSubject)[]).map(
              (s) => (typeof s === "string" ? { name: s, max_score: 100 } : s)
            );
          } else if (examData.subject) {
            subjects = [{ name: String(examData.subject), max_score: 100 }];
          }

          const normalizedExam = { ...examData, subjects };
          const studentsData = await studentsRes.json();
          const classesData = await classesRes.json();
          const gradesData = await gradesRes.json();

          setExam(normalizedExam);

          let filteredClasses = classesData;
          let filteredStudents = studentsData;

          if (normalizedExam.class_ids && normalizedExam.class_ids.length > 0) {
            const allowedClassIds = normalizedExam.class_ids.map(
              (c: { _id: string } | string) =>
                typeof c === "string" ? c : c._id
            );
            filteredClasses = classesData.filter((c: ClassInfo) =>
              allowedClassIds.includes(c._id)
            );
            filteredStudents = studentsData.filter((s: Student) =>
              allowedClassIds.includes(s.current_class_id)
            );
          } else if (normalizedExam.class_id) {
            const allowedClassId =
              typeof normalizedExam.class_id === "string"
                ? normalizedExam.class_id
                : normalizedExam.class_id._id;
            filteredClasses = classesData.filter(
              (c: ClassInfo) => c._id === allowedClassId
            );
            filteredStudents = studentsData.filter(
              (s: Student) => s.current_class_id === allowedClassId
            );
          }

          setStudents(filteredStudents);
          setClasses(filteredClasses);
          setSelectedClass("all");

          const gradeMap: Record<string, GradeRecord> = {};
          (gradesData as GradeRecord[]).forEach((g) => {
            let student = studentsData.find(
              (s: Student) => s._id === g.student_id
            );
            if (!student) {
              student = studentsData.find(
                (s: Student) => s.student_id === g.student_id
              );
            }
            if (student) {
              gradeMap[student._id] = {
                student_id: student._id,
                score: g.score,
                subjects: g.subjects || [],
                remark: g.remark || "",
                is_absent: !!g.is_absent,
              };
            }
          });
          setGrades(gradeMap);
          setOriginalGrades(JSON.parse(JSON.stringify(gradeMap)));
        }
      } catch (err) {
        console.error("Load data error:", err);
        toast.error("加载数据失败");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [examId]);

  const getCurrentClassSubjects = () => {
    if (!exam) return [];
    if (!selectedClass || selectedClass === "all") {
      return exam.subjects || [];
    }
    const config = exam.class_configs?.find((c: ClassConfig) => {
      const classId =
        typeof c.class_id === "string" ? c.class_id : c.class_id._id;
      return classId === selectedClass;
    });
    return config && config.subjects.length > 0
      ? config.subjects
      : exam.subjects || [];
  };

  const getStudentSubjects = (student: Student) => {
    if (!exam) return [];
    const config = exam.class_configs?.find((c: ClassConfig) => {
      const classId =
        typeof c.class_id === "string" ? c.class_id : c.class_id._id;
      return classId === student.current_class_id;
    });
    return config && config.subjects.length > 0
      ? config.subjects
      : exam.subjects || [];
  };

  const handleSubjectScoreChange = (
    studentDocId: string,
    subjectName: string,
    score: string
  ) => {
    if (!studentDocId) return;
    const student = students.find((s) => s._id === studentDocId);
    if (!student) return;

    const studentSubjects = getStudentSubjects(student);
    const targetSubject = studentSubjects.find((s) => s.name === subjectName);
    const maxScore = targetSubject?.max_score || 100;
    const numScore = score === "" ? "" : Number(score);

    if (typeof numScore === "number" && numScore > maxScore) {
      toast.error(`${subjectName}分数不能超过满分 ${maxScore}`);
      return;
    }

    setGrades((prev) => {
      const existingRecord = prev[studentDocId];
      const updatedSubjects = studentSubjects.map((s) => {
        const existingSub = existingRecord?.subjects?.find(
          (es) => es.name === s.name
        );
        const currentScore =
          s.name === subjectName ? numScore : existingSub?.score ?? "";
        return { name: s.name, score: currentScore };
      });

      const allEmpty = updatedSubjects.every((s) => s.score === "");
      const totalScore = allEmpty
        ? ""
        : updatedSubjects.reduce((acc: number, curr: GradeSubject) => {
            const val = curr.score === "" ? 0 : Number(curr.score);
            return acc + val;
          }, 0);

      return {
        ...prev,
        [studentDocId]: {
          ...existingRecord,
          student_id: studentDocId,
          subjects: updatedSubjects,
          score: totalScore,
          remark: existingRecord?.remark || "",
        },
      };
    });
  };

  const handleScoreChange = (studentDocId: string, score: string) => {
    if (!studentDocId) return;
    const student = students.find((s) => s._id === studentDocId);
    if (!student) return;

    const studentSubjects = getStudentSubjects(student);
    const studentMaxScore =
      studentSubjects.length > 0
        ? studentSubjects.reduce((acc, s) => acc + (s.max_score || 0), 0)
        : exam?.max_score || 100;

    const numScore = score === "" ? "" : Number(score);
    if (typeof numScore === "number" && numScore > studentMaxScore) {
      toast.error(`总分不能超过满分 ${studentMaxScore}`);
      return;
    }

    setGrades((prev) => {
      const existingRecord = prev[studentDocId];
      return {
        ...prev,
        [studentDocId]: {
          ...existingRecord,
          student_id: studentDocId,
          score: numScore,
          subjects: studentSubjects.map((s) => {
            const existingSub = existingRecord?.subjects?.find(
              (es) => es.name === s.name
            );
            return { name: s.name, score: existingSub?.score ?? "" };
          }),
          remark: existingRecord?.remark || "",
        },
      };
    });
  };

  const handleAbsentChange = (studentDocId: string, isAbsent: boolean) => {
    if (!studentDocId) return;
    const student = students.find((s) => s._id === studentDocId);
    if (!student) return;

    const studentSubjects = getStudentSubjects(student);
    setGrades((prev) => {
      const existingRecord = prev[studentDocId];
      const subjects = studentSubjects.map((s) => {
        const existingSub = existingRecord?.subjects?.find(
          (es) => es.name === s.name
        );
        return {
          name: s.name,
          score: isAbsent ? "" : existingSub?.score ?? "",
        };
      });

      return {
        ...prev,
        [studentDocId]: {
          ...existingRecord,
          student_id: studentDocId,
          score: isAbsent ? "" : existingRecord?.score ?? "",
          subjects,
          remark: existingRecord?.remark || "",
          is_absent: isAbsent,
        },
      };
    });
  };

  const handleRemarkChange = (studentDocId: string, remark: string) => {
    if (!studentDocId) return;
    const student = students.find((s) => s._id === studentDocId);
    if (!student) return;

    const studentSubjects = getStudentSubjects(student);
    setGrades((prev) => {
      const existingRecord = prev[studentDocId];
      return {
        ...prev,
        [studentDocId]: {
          ...existingRecord,
          student_id: studentDocId,
          score: existingRecord?.score ?? "",
          subjects: studentSubjects.map((s) => {
            const existingSub = existingRecord?.subjects?.find(
              (es) => es.name === s.name
            );
            return { name: s.name, score: existingSub?.score ?? "" };
          }),
          remark: remark,
        },
      };
    });
  };

  const handleBulkAction = (
    action:
      | "clear"
      | "max"
      | "min"
      | "custom_score"
      | "custom_remark"
      | "set_absent"
      | "clear_absent"
  ) => {
    if (!exam || filteredStudents.length === 0) {
      toast.error("当前列表没有学生可操作");
      return;
    }

    if (action === "custom_score") {
      const num = Number(bulkScore);
      if (isNaN(num)) {
        toast.error("请输入有效的数字分数");
        return;
      }
      if (num > (exam?.max_score || 100)) {
        toast.error(`分数不能超过满分 ${exam?.max_score || 100}`);
        return;
      }
    }

    setGrades((prev) => {
      const nextGrades = { ...prev };
      filteredStudents.forEach((s) => {
        if (!s._id) return;
        const existingRecord = prev[s._id];
        const studentSubjects = getStudentSubjects(s);
        const studentMaxScore =
          studentSubjects.length > 0
            ? studentSubjects.reduce(
                (acc, subj) => acc + (subj.max_score || 0),
                0
              )
            : exam?.max_score || 100;

        const getNewSubjects = (scoreValue: number | "") =>
          studentSubjects.map((subj) => ({
            name: subj.name,
            score:
              scoreValue === ""
                ? ""
                : (
                    (scoreValue * (subj.max_score || 0)) /
                    (studentMaxScore || 1)
                  ).toFixed(2),
          }));

        if (action === "clear") {
          nextGrades[s._id] = {
            student_id: s._id,
            score: "",
            subjects: getNewSubjects(""),
            remark: "",
          };
        } else if (action === "max") {
          nextGrades[s._id] = {
            ...existingRecord,
            student_id: s._id,
            score: studentMaxScore,
            subjects: getNewSubjects(studentMaxScore),
            remark: existingRecord?.remark || "",
          };
        } else if (action === "min") {
          nextGrades[s._id] = {
            ...existingRecord,
            student_id: s._id,
            score: 0,
            subjects: getNewSubjects(0),
            remark: existingRecord?.remark || "",
          };
        } else if (action === "custom_score") {
          nextGrades[s._id] = {
            ...existingRecord,
            student_id: s._id,
            score: Number(bulkScore),
            subjects: getNewSubjects(Number(bulkScore)),
            remark: existingRecord?.remark || "",
          };
        } else if (action === "custom_remark") {
          nextGrades[s._id] = {
            ...existingRecord,
            student_id: s._id,
            score: existingRecord?.score ?? "",
            subjects:
              existingRecord?.subjects?.map((subj) => ({ ...subj })) ||
              studentSubjects.map((ss) => ({ name: ss.name, score: "" })),
            remark: bulkRemark,
          };
        } else if (action === "set_absent") {
          nextGrades[s._id] = {
            ...existingRecord,
            student_id: s._id,
            score: "",
            subjects: getNewSubjects(""),
            remark: existingRecord?.remark || "",
            is_absent: true,
          };
        } else if (action === "clear_absent") {
          nextGrades[s._id] = {
            ...existingRecord,
            student_id: s._id,
            is_absent: false,
          };
        }
      });
      return nextGrades;
    });
    toast.success("批量操作已应用");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const gradesToSave: (GradeRecord & { student_no?: string })[] = [];
      Object.keys(grades).forEach((studentId) => {
        const current = grades[studentId];
        const original = originalGrades[studentId];
        if (!original || JSON.stringify(current) !== JSON.stringify(original)) {
          const student = students.find((s) => s._id === studentId);
          gradesToSave.push({
            ...current,
            student_no: student?.student_id,
          });
        }
      });

      if (gradesToSave.length === 0) {
        toast.info("没有需要保存的修改");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: examId, grades: gradesToSave }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(`成功同步 ${result.count || gradesToSave.length} 条数据`);
        setOriginalGrades(JSON.parse(JSON.stringify(grades)));
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "保存失败");
      }
    } catch (err) {
      console.error("Save grades error:", err);
      toast.error("操作出错，请检查网络连接");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass =
        selectedClass === "all" || s.current_class_id === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, selectedClass]);

  const currentClassSubjects = getCurrentClassSubjects();
  const currentMaxScore =
    currentClassSubjects.length > 0
      ? currentClassSubjects.reduce((acc, s) => acc + (s.max_score || 0), 0)
      : exam?.max_score || 100;

  const stats = useMemo(() => {
    const recordedGradesWithStudents = filteredStudents
      .map((s) => ({ student: s, grade: grades[s._id] }))
      .filter(
        (item) =>
          item.grade && (item.grade.score !== "" || item.grade.is_absent)
      );

    const scores = recordedGradesWithStudents
      .filter((item) => !item.grade.is_absent && item.grade.score !== "")
      .map((item) => Number(item.grade.score));

    const absentCount = recordedGradesWithStudents.filter(
      (item) => item.grade.is_absent
    ).length;

    if (recordedGradesWithStudents.length === 0)
      return { avg: 0, max: 0, min: 0, passRate: 0, count: 0, absentCount: 0 };

    let passCount = 0;
    let excellentCount = 0;
    let goodCount = 0;
    let fairCount = 0;
    let failCount = absentCount;

    recordedGradesWithStudents.forEach(({ student, grade }) => {
      if (grade.is_absent) return;
      const score = Number(grade.score);
      let studentMaxScore = currentMaxScore;

      if (selectedClass === "all") {
        const config = exam?.class_configs?.find((c: ClassConfig) => {
          const classId =
            typeof c.class_id === "string" ? c.class_id : c.class_id._id;
          return classId === student.current_class_id;
        });
        if (config && config.subjects.length > 0) {
          studentMaxScore = config.subjects.reduce(
            (acc: number, s: ExamSubject) => acc + (s.max_score || 0),
            0
          );
        } else {
          studentMaxScore =
            exam?.subjects?.reduce(
              (acc: number, s: ExamSubject) => acc + (s.max_score || 0),
              0
            ) ||
            exam?.max_score ||
            100;
        }
      }

      const passThreshold = studentMaxScore * 0.6;
      const goodThreshold = studentMaxScore * 0.8;
      const excellentThreshold = studentMaxScore * 0.9;

      if (score >= passThreshold) passCount++;
      if (score >= excellentThreshold) {
        excellentCount++;
      } else if (score >= goodThreshold) {
        goodCount++;
      } else if (score >= passThreshold) {
        fairCount++;
      } else {
        failCount++;
      }
    });

    const scoresCount = scores.length;
    const sum = scores.reduce((a, b) => a + b, 0);

    return {
      avg: scoresCount > 0 ? (sum / scoresCount).toFixed(1) : 0,
      max: scoresCount > 0 ? Math.max(...scores) : 0,
      min: scoresCount > 0 ? Math.min(...scores) : 0,
      passRate:
        scoresCount > 0 ? ((passCount / scoresCount) * 100).toFixed(1) : 0,
      count: recordedGradesWithStudents.length,
      absentCount,
      distribution: {
        excellent: excellentCount,
        good: goodCount,
        pass: fairCount,
        fail: failCount,
      },
    };
  }, [filteredStudents, grades, currentMaxScore, selectedClass, exam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 min-w-0">
        <div className="max-w-6xl mx-auto space-y-6 min-w-0">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 min-w-0">
      <PageHeader showBack />

      <div className="border-b bg-muted/30 px-3 py-2 md:px-4 md:py-2.5">
        <div className="container mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{exam?.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {exam?.date ? new Date(exam.date).toLocaleDateString("zh-CN", { month: "long", day: "numeric", year: "numeric" }) : ""} · 满分 {currentMaxScore}
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="ml-1.5 bg-amber-100 text-amber-700 border-none font-medium text-[10px]">未保存</Badge>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Popover open={bulkPopoverOpen} onOpenChange={setBulkPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  批量操作
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="rounded-xl p-4 w-[260px] shadow-lg"
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      预设操作
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="ghost"
                        className="justify-start rounded-lg font-medium py-3 px-3 hover:bg-emerald-50 hover:text-emerald-600 text-xs"
                        onClick={() => handleBulkAction("max")}
                      >
                        <TrendingUp className="w-3.5 h-3.5 mr-2" />
                        设为满分
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start rounded-lg font-medium py-3 px-3 hover:bg-amber-50 hover:text-amber-600 text-xs"
                        onClick={() => handleBulkAction("min")}
                      >
                        <AlertCircle className="w-3.5 h-3.5 mr-2" />
                        设为 0 分
                      </Button>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      缺考操作
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-lg font-medium py-3 border-destructive/30 text-destructive hover:bg-destructive/5 text-xs"
                        onClick={() => handleBulkAction("set_absent")}
                      >
                        批量设为缺考
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-lg font-medium py-3 text-xs"
                        onClick={() => handleBulkAction("clear_absent")}
                      >
                        取消缺考状态
                      </Button>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      自定义分值
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="分值"
                        className="h-8 rounded-lg text-xs font-medium"
                        value={bulkScore}
                        onChange={(e) => setBulkScore(e.target.value)}
                      />
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => handleBulkAction("custom_score")}
                      >
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      批量备注
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入备注内容..."
                        className="h-8 rounded-lg text-xs font-medium"
                        value={bulkRemark}
                        onChange={(e) => setBulkRemark(e.target.value)}
                      />
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => handleBulkAction("custom_remark")}
                      >
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-center rounded-lg font-medium py-3 text-destructive hover:bg-destructive/5 text-xs"
                      onClick={() => handleBulkAction("clear")}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      清空分数
                    </Button>
                    <Button
                      className="flex-1 rounded-lg font-bold py-3 text-xs"
                      onClick={() => handleSave()}
                    >
                      同步并保存
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              size="sm"
              className={cn(
                "h-8 rounded-lg font-bold text-xs gap-1.5",
                hasUnsavedChanges && "animate-pulse"
              )}
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "正在同步..." : "保存数据"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-8 pt-6 pb-12 min-w-0">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-card rounded-lg p-4 shadow-sm border flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              已录入
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{stats.count}</span>
              <span className="text-xs text-muted-foreground">/ {filteredStudents.length}</span>
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-wider mb-1 text-sky-500">
              平均分
            </span>
            <span className="text-xl font-bold text-sky-600">{stats.avg}</span>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-wider mb-1 text-emerald-500">
              及格率
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-bold text-emerald-600">{stats.passRate}</span>
              <span className="text-xs font-medium text-emerald-600">%</span>
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-wider mb-1 text-amber-500">
              最高分
            </span>
            <span className="text-xl font-bold text-amber-600">{stats.max}</span>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border flex flex-col items-center justify-center col-span-2 md:col-span-1">
            <span className="text-[10px] font-medium uppercase tracking-wider mb-1 text-destructive">
              最低分
            </span>
            <span className="text-xl font-bold text-destructive">{stats.min}</span>
          </div>
          {stats.absentCount > 0 && (
            <div className="bg-card rounded-lg p-4 shadow-sm border flex flex-col items-center justify-center col-span-2 md:col-span-1">
              <span className="text-[10px] font-medium uppercase tracking-wider mb-1 text-destructive/70">
                缺考人数
              </span>
              <span className="text-xl font-bold text-destructive/70">{stats.absentCount}</span>
            </div>
          )}
        </div>

        {/* Distribution */}
        {stats.count > 0 && stats.distribution && (
          <div className="mb-6 bg-card rounded-lg p-5 shadow-sm border">
            <div className="flex items-center gap-2 mb-3">
              <BarChart className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm text-foreground">分数段分布</h3>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden w-full bg-muted">
              <div
                style={{ width: `${(stats.distribution.excellent / stats.count) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`优秀: ${stats.distribution.excellent}人`}
              />
              <div
                style={{ width: `${(stats.distribution.good / stats.count) * 100}%` }}
                className="bg-sky-500 h-full transition-all duration-500"
                title={`良好: ${stats.distribution.good}人`}
              />
              <div
                style={{ width: `${(stats.distribution.pass / stats.count) * 100}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
                title={`及格: ${stats.distribution.pass}人`}
              />
              <div
                style={{ width: `${(stats.distribution.fail / stats.count) * 100}%` }}
                className="bg-destructive h-full transition-all duration-500"
                title={`不及格: ${stats.distribution.fail}人`}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> 优秀 ({stats.distribution.excellent})
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-sky-500" /> 良好 ({stats.distribution.good})
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> 及格 ({stats.distribution.pass})
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" /> 不及格 ({stats.distribution.fail})
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="快速检索姓名或学号..."
              className="pl-10 h-10 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Dialog
              open={isSubjectsDialogOpen}
              onOpenChange={(open) => {
                setIsSubjectsDialogOpen(open);
                if (open) setEditingSubjects([...getCurrentClassSubjects()]);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-lg text-xs gap-1.5 text-primary"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {selectedClass === "all" ? "设置默认科目" : "设置班级科目"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-lg font-bold">
                    {selectedClass === "all" ? "设置默认科目" : "设置班级科目"}
                  </DialogTitle>
                  <p className="text-muted-foreground text-sm">
                    {selectedClass === "all"
                      ? "为所有班级设置默认考试科目和满分"
                      : "为当前班级设置独立的考试科目和满分"}
                  </p>
                </DialogHeader>
                <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
                  {editingSubjects.map((subject, index) => (
                    <div
                      key={index}
                      className="flex items-end gap-3 p-3 rounded-lg bg-muted/30 border group hover:border-primary/30 transition-all"
                    >
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          科目名称
                        </Label>
                        <Input
                          value={subject.name}
                          onChange={(e) => {
                            const newSubjects = [...editingSubjects];
                            newSubjects[index].name = e.target.value;
                            setEditingSubjects(newSubjects);
                          }}
                          className="h-9 rounded-lg font-medium"
                          placeholder="如：语文"
                        />
                      </div>
                      <div className="w-20 space-y-1.5">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          满分
                        </Label>
                        <Input
                          type="number"
                          value={subject.max_score}
                          onChange={(e) => {
                            const newSubjects = [...editingSubjects];
                            newSubjects[index].max_score = Number(e.target.value);
                            setEditingSubjects(newSubjects);
                          }}
                          className="h-9 rounded-lg font-medium"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSubjects(editingSubjects.filter((_, i) => i !== index))}
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setEditingSubjects([...editingSubjects, { name: "", max_score: 100 }])}
                    className="w-full h-10 rounded-lg border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary/30 font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    添加科目
                  </Button>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSaveSubjects}
                    disabled={isSavingSubjects}
                    className="w-full h-10 rounded-lg font-bold"
                  >
                    {isSavingSubjects ? "正在保存..." : "保存班级配置"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg text-muted-foreground">
              <History className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg shadow-sm border overflow-hidden min-w-0">
          <div className="overflow-x-auto">
          <div className="bg-muted/30 px-4 sm:px-6 py-4 border-b min-w-[640px]">
            <div className="grid grid-cols-12 gap-4 sm:gap-6 items-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1 text-center">序号</div>
              <div className="col-span-3">学生基本信息</div>
              <div className="col-span-5 text-center">分科成绩 / 总分汇总</div>
              <div className="col-span-3">成绩备注</div>
            </div>
          </div>

          <div className="divide-y min-w-[640px]">
            {filteredStudents.map((student, index) => {
              const studentSubjects = getStudentSubjects(student);
              const studentMaxScore =
                studentSubjects.length > 0
                  ? studentSubjects.reduce((acc, s) => acc + (s.max_score || 0), 0)
                  : exam?.max_score || 100;

              const record = grades[student._id] || {
                score: "",
                remark: "",
                subjects: studentSubjects.map((s) => ({ name: s.name, score: "" })),
              };
              const currentClass = classes.find((c) => c._id === student.current_class_id);

              const isExcellent =
                record.score !== "" && Number(record.score) >= studentMaxScore * 0.9;
              const isFailing =
                record.score !== "" && Number(record.score) < studentMaxScore * 0.6;

              return (
                <div
                  key={student._id}
                  className={cn(
                    "px-4 sm:px-6 py-4 grid grid-cols-12 gap-4 sm:gap-6 items-center transition-all group",
                    record.score !== "" ? "bg-card" : "bg-muted/10"
                  )}
                >
                  <div className="col-span-1 text-center font-medium text-muted-foreground group-hover:text-primary transition-colors text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                        isExcellent
                          ? "bg-emerald-50 text-emerald-600"
                          : isFailing
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isExcellent ? (
                        <Trophy className="w-4 h-4" />
                      ) : isFailing ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-sm truncate">
                          {student.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-5 px-1.5 text-[9px] font-medium rounded-md transition-all",
                            record.is_absent
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                          onClick={() => handleAbsentChange(student._id, !record.is_absent)}
                        >
                          {record.is_absent ? "已缺考" : "设为缺考"}
                        </Button>
                      </div>
                      <div className="text-[9px] font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="outline"
                          className="px-1 py-0 rounded-md text-[8px] font-medium"
                        >
                          {currentClass?.name || "未分配"}
                        </Badge>
                        <span className="opacity-50">#</span> {student.student_id}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 flex items-center gap-3">
                    <div className="flex flex-wrap gap-2 flex-1">
                      {studentSubjects.map((subj) => {
                        const subjRecord = record.subjects?.find((s) => s.name === subj.name);
                        return (
                          <div key={subj.name} className="flex flex-col gap-1 min-w-[60px]">
                            <span className="text-[9px] font-medium text-muted-foreground text-center uppercase">
                              {subj.name}
                            </span>
                            <Input
                              type="number"
                              disabled={record.is_absent}
                              placeholder={record.is_absent ? "缺考" : String(subj.max_score)}
                              className={cn(
                                "h-8 rounded-lg font-bold text-center text-xs",
                                record.is_absent && "bg-muted text-muted-foreground placeholder:text-muted-foreground/50"
                              )}
                              value={subjRecord?.score ?? ""}
                              onWheel={(e) => e.currentTarget.blur()}
                              onChange={(e) =>
                                handleSubjectScoreChange(student._id, subj.name, e.target.value)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center px-3 border-l">
                      <span className="text-[9px] font-medium text-primary uppercase tracking-wider">
                        总分
                      </span>
                      <Input
                        type="number"
                        disabled={record.is_absent}
                        placeholder={record.is_absent ? "缺考" : "0"}
                        className={cn(
                          "h-9 w-18 rounded-lg font-bold text-center text-sm border-2 transition-all",
                          record.is_absent
                            ? "border-muted bg-muted text-muted-foreground placeholder:text-muted-foreground/50"
                            : record.score === ""
                            ? "border-muted bg-muted/50 text-muted-foreground"
                            : isExcellent
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                            : isFailing
                            ? "border-destructive/20 bg-destructive/5 text-destructive"
                            : "border-primary/20 bg-primary/5 text-primary"
                        )}
                        value={record.score}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => handleScoreChange(student._id, e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-span-3">
                    <Input
                      placeholder="添加备注..."
                      className="h-8 rounded-lg text-xs font-medium"
                      value={record.remark}
                      onChange={(e) => handleRemarkChange(student._id, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          </div>
          {filteredStudents.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                未找到符合条件的学生
              </h3>
              <p className="text-muted-foreground text-sm">
                尝试更换搜索词或选择其他班级
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
