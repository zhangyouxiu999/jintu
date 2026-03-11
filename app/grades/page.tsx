"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Plus,
  Search,
  ArrowLeft,
  Trophy,
  Calendar,
  BookOpen,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/PageHeader";

interface ExamSubject {
  name: string;
  max_score: number;
}

interface ClassInfo {
  _id: string;
  name: string;
}

interface Exam {
  _id: string;
  name: string;
  subjects: ExamSubject[];
  date: string;
  max_score: number;
  gradedCount: number;
  totalStudents?: number;
  class_id?: {
    _id: string;
    name: string;
  };
  class_ids?: {
    _id: string;
    name: string;
  }[];
}

export default function GradesPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    name: "",
    subjects: [] as ExamSubject[],
    date: new Date().toISOString().split("T")[0],
    class_id: "all",
    class_ids: [] as string[],
  });

  const availableSubjects = [
    "语文", "数学", "英语", "物理", "化学", "生物",
    "政治", "历史", "地理", "信息技术", "体育", "美术", "音乐",
  ];

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams");
      if (res.ok) {
        const data = await res.json();
        const normalizedData: Exam[] = data.map((exam: any): Exam => {
          let subjects: ExamSubject[] = [];
          if (Array.isArray(exam.subjects)) {
            subjects = exam.subjects.map((s: any) =>
              typeof s === "string" ? { name: s, max_score: 100 } : s
            );
          } else if (exam.subject) {
            subjects = [{ name: exam.subject, max_score: 100 }];
          }
          return { ...exam, subjects };
        });
        setExams(normalizedData);
      }
    } catch (err) {
      console.error("Fetch exams error:", err);
      toast.error("获取考试列表失败");
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (err) {
      console.error("Fetch classes error:", err);
    }
  };

  useEffect(() => {
    Promise.all([fetchExams(), fetchClasses()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const handleCreateExam = async () => {
    if (!newExam.name) {
      toast.error("请填写考试名称");
      return;
    }

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExam,
          class_id: undefined,
          class_ids: newExam.class_ids,
        }),
      });

      if (res.ok) {
        toast.success("考试创建成功");
        setIsAddDialogOpen(false);
        setNewExam({
          name: "",
          subjects: [],
          date: new Date().toISOString().split("T")[0],
          class_id: "all",
          class_ids: [],
        });
        fetchExams();
      } else {
        const data = await res.json();
        toast.error(data.error || "创建失败");
      }
    } catch (err) {
      console.error("Create exam error:", err);
      toast.error("创建失败");
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("考试已删除");
        setExams(exams.filter((e) => e._id !== id));
      }
    } catch (err) {
      console.error("Delete exam error:", err);
      toast.error("删除失败");
    }
  };

  const filteredExams = exams.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subjects.some((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const stats = {
    totalExams: exams.length,
    totalGraded: exams.reduce((acc, curr) => acc + curr.gradedCount, 0),
    subjects: Array.from(
      new Set(exams.flatMap((e) => e.subjects.map((s) => s.name)))
    ).length,
  };

  const toggleSubject = (subject: string) => {
    setNewExam((prev) => {
      const exists = prev.subjects.find((s) => s.name === subject);
      if (exists) {
        return { ...prev, subjects: prev.subjects.filter((s) => s.name !== subject) };
      } else {
        return { ...prev, subjects: [...prev.subjects, { name: subject, max_score: 100 }] };
      }
    });
  };

  const updateSubjectMaxScore = (subjectName: string, maxScore: number) => {
    setNewExam((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.name === subjectName ? { ...s, max_score: maxScore } : s
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader showBack />

      <div className="border-b bg-muted/30 px-3 py-2 md:px-4 md:py-2.5">
        <div className="container mx-auto flex justify-end">
          <Button size="sm" className="h-9 rounded-lg text-xs gap-1.5 font-bold" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            新增考试
          </Button>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="rounded-2xl border-none shadow-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">创建新考试计划</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    选择关联班级 (可多选)
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border max-h-[150px] overflow-y-auto">
                    <Badge
                      variant={newExam.class_ids.length === 0 ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer px-3 py-1.5 rounded-lg transition-all font-medium",
                        newExam.class_ids.length === 0
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "bg-card hover:bg-muted text-muted-foreground"
                      )}
                      onClick={() => setNewExam((prev) => ({ ...prev, class_ids: [] }))}
                    >
                      全校/不限班级
                    </Badge>
                    {classes.map((cls) => {
                      const isSelected = newExam.class_ids.includes(cls._id);
                      return (
                        <Badge
                          key={cls._id}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer px-3 py-1.5 rounded-lg transition-all font-medium",
                            isSelected
                              ? "bg-primary hover:bg-primary/90"
                              : "bg-card hover:bg-muted text-muted-foreground"
                          )}
                          onClick={() => {
                            setNewExam((prev) => {
                              const sel = prev.class_ids.includes(cls._id);
                              return {
                                ...prev,
                                class_ids: sel
                                  ? prev.class_ids.filter((id) => id !== cls._id)
                                  : [...prev.class_ids, cls._id],
                              };
                            });
                          }}
                        >
                          {cls.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    考试名称
                  </label>
                  <Input
                    placeholder="如：2024春季期中联考"
                    className="h-10 rounded-lg"
                    value={newExam.name}
                    onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    考试科目与分值
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border max-h-[180px] overflow-y-auto">
                    {availableSubjects.map((s) => {
                      const isSelected = newExam.subjects.some((sub) => sub.name === s);
                      return (
                        <Badge
                          key={s}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer px-3 py-1.5 rounded-lg transition-all font-medium",
                            isSelected
                              ? "bg-primary hover:bg-primary/90"
                              : "bg-card hover:bg-muted text-muted-foreground"
                          )}
                          onClick={() => toggleSubject(s)}
                        >
                          {s}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {newExam.subjects.length > 0 && (
                  <div className="space-y-3 bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <label className="text-[10px] font-medium text-primary uppercase tracking-wider">
                      各科目满分设置
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {newExam.subjects.map((s) => (
                        <div
                          key={s.name}
                          className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm"
                        >
                          <span className="text-sm font-medium text-foreground min-w-[3em]">
                            {s.name}
                          </span>
                          <Input
                            type="number"
                            className="h-8 rounded-lg text-xs font-bold text-center w-20"
                            value={s.max_score}
                            onChange={(e) =>
                              updateSubjectMaxScore(s.name, parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      总满分
                    </label>
                    <div className="h-10 flex items-center justify-center rounded-lg bg-muted font-bold text-primary">
                      {newExam.subjects.reduce((acc, curr) => acc + curr.max_score, 0)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      考试日期
                    </label>
                    <Input
                      type="date"
                      className="h-10 rounded-lg"
                      value={newExam.date}
                      onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" className="rounded-lg" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button className="rounded-lg font-bold px-8" onClick={handleCreateExam}>
                  确认创建
                </Button>
              </DialogFooter>
            </DialogContent>
      </Dialog>

      <div className="container mx-auto max-w-6xl px-4 sm:px-8 pt-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="rounded-lg border bg-card shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">总考试场次</p>
              <h2 className="text-2xl font-bold text-foreground">{stats.totalExams}</h2>
            </div>
          </Card>
          <Card className="rounded-lg border bg-card shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">已录入人次</p>
              <h2 className="text-2xl font-bold text-foreground">{stats.totalGraded}</h2>
            </div>
          </Card>
          <Card className="rounded-lg border bg-card shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">涉及科目</p>
              <h2 className="text-2xl font-bold text-foreground">{stats.subjects}</h2>
            </div>
          </Card>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索考试、科目或年份..."
            className="pl-10 h-10 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <Card className="rounded-lg border-dashed border-2 p-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-base font-bold text-foreground mb-2">暂无考试记录</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              还没有创建任何考试。点击右上角的"新增考试"按钮，开始您的第一次成绩录入工作。
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExams.map((exam) => (
              <Card
                key={exam._id}
                className="group relative rounded-xl border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <span className="text-[10px] font-medium uppercase opacity-60">
                        {new Date(exam.date).getMonth() + 1}月
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {new Date(exam.date).getDate()}
                      </span>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg font-bold text-foreground">
                            彻底删除？
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            您正准备删除{" "}
                            <span className="font-bold text-foreground">{exam.name}</span>
                            。这将永久清除该考试下所有学生的成绩记录，无法恢复。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                          <AlertDialogCancel className="rounded-lg bg-muted border-none">
                            取消
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteExam(exam._id)}
                            className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {exam.name}
                      </h3>
                      {exam.class_id && (
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary border-primary/20 text-[10px] font-medium px-2 py-0"
                        >
                          {exam.class_id.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {exam.subjects.map((s) => (
                        <span
                          key={s.name}
                          className="inline-flex items-center gap-1 bg-muted px-2.5 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground"
                        >
                          <BookOpen className="w-3 h-3" />
                          {s.name}
                          <span className="opacity-50 ml-0.5">{s.max_score}</span>
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1 bg-primary/5 px-2.5 py-0.5 rounded-md text-[10px] font-medium text-primary">
                        <Trophy className="w-3 h-3" />
                        总分 {exam.max_score}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        已录入进度
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-1000"
                            style={{
                              width: `${Math.min(
                                100,
                                (exam.gradedCount / (exam.totalStudents || 1)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          {exam.gradedCount} / {exam.totalStudents || 0} 人
                        </span>
                      </div>
                    </div>

                    <Link href={`/grades/${exam._id}`}>
                      <Button size="sm" className="rounded-lg font-bold text-xs gap-1.5 h-8">
                        进入录入
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
