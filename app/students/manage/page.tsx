"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Search,
  ArrowLeft,
  Settings2,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  School,
  Calendar,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface StudentInfo {
  _id: string;
  student_id: string;
  name: string;
  gender: "male" | "female" | "other";
  current_class_id: string;
  category_id: string;
  origin_school?: string;
  birthday?: string;
  enroll_date?: string;
}

interface ClassInfo {
  _id: string;
  name: string;
  code: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function StudentsManagePage() {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentInfo | null>(
    null
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [studentsRes, classesRes, categoriesRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/classes"),
        fetch("/api/categories"),
      ]);

      if (studentsRes.ok && classesRes.ok && categoriesRes.ok) {
        const [studentsData, classesData, categoriesData] = await Promise.all([
          studentsRes.json(),
          classesRes.json(),
          categoriesRes.json(),
        ]);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }
    } catch (err) {
      console.error("Load data error:", err);
      toast.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteStudent = async (id: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("学生已删除");
        setStudents(students.filter((s) => s._id !== id));
      } else {
        const error = await res.json();
        throw new Error(error.error || "删除失败");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    try {
      const res = await fetch(`/api/students/${editingStudent._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStudent),
      });

      if (res.ok) {
        toast.success("信息更新成功");
        setIsEditDialogOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        throw new Error(error.error || "更新失败");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredStudents = useMemo(() => {
    let result = [...students];

    // 搜索过滤
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((s) => {
        const nameMatch = s.name?.toLowerCase().includes(query) ?? false;
        const idMatch = s.student_id?.toLowerCase().includes(query) ?? false;
        return nameMatch || idMatch;
      });
    }

    // 班级过滤
    if (selectedClassId !== "all") {
      result = result.filter((s) => s.current_class_id === selectedClassId);
    }

    // 分类过滤
    if (selectedCategoryId !== "all") {
      result = result.filter((s) => s.category_id === selectedCategoryId);
    }

    return result;
  }, [students, searchQuery, selectedClassId, selectedCategoryId]);

  const getClassName = (id: string) => {
    const cls = classes.find((c) => c._id === id);
    return cls ? cls.name : "未知班级";
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find((c) => c._id === id);
    return cat ? cat.name : "未知类别";
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader showBack />

      <div className="container mx-auto px-4 sm:px-8 pt-6 pb-12 space-y-6">
        <Card className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <CardHeader className="bg-card border-b pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  学生列表
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  共找到 {filteredStudents.length} 名学生 (总计{" "}
                  {students.length} 名)
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索姓名或学号..."
                    className="pl-9 rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                >
                  <SelectTrigger className="w-full sm:w-[140px] rounded-lg">
                    <SelectValue placeholder="所有班级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有班级</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger className="w-full sm:w-[140px] rounded-lg">
                    <SelectValue placeholder="所有分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有分类</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(searchQuery ||
                  selectedClassId !== "all" ||
                  selectedCategoryId !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedClassId("all");
                      setSelectedCategoryId("all");
                    }}
                    className="text-muted-foreground hover:text-primary whitespace-nowrap"
                  >
                    重置
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[60px] font-semibold text-center">
                    序号
                  </TableHead>
                  <TableHead className="font-semibold">姓名</TableHead>
                  <TableHead className="font-semibold">性别</TableHead>
                  <TableHead className="font-semibold">所在班级</TableHead>
                  <TableHead className="font-semibold">类别</TableHead>
                  <TableHead className="font-semibold">原学校</TableHead>
                  <TableHead className="text-right font-semibold">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <TableRow
                      key={student._id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="text-center text-muted-foreground font-mono text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-normal bg-muted text-muted-foreground border-none"
                        >
                          {student.gender === "male"
                            ? "男"
                            : student.gender === "female"
                            ? "女"
                            : "其他"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <School className="w-3.5 h-3.5" />
                          {getClassName(student.current_class_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-normal"
                        >
                          {getCategoryName(student.category_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {student.origin_school || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => {
                              setEditingStudent(student);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  确认删除学生？
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  此操作将永久删除学生{" "}
                                  <span className="font-bold text-foreground">
                                    {student.name}
                                  </span>{" "}
                                  的档案信息，且不可恢复。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteStudent(student._id)
                                  }
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  确认删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      未找到相关学生数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              编辑学生档案
            </DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3" /> 姓名
                  </label>
                  <Input
                    value={editingStudent.name}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        name: e.target.value,
                      })
                    }
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    性别
                  </label>
                  <Select
                    value={editingStudent.gender}
                    onValueChange={(val: any) =>
                      setEditingStudent({ ...editingStudent, gender: val })
                    }
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男</SelectItem>
                      <SelectItem value="female">女</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    类别
                  </label>
                  <Select
                    value={editingStudent.category_id}
                    onValueChange={(val) =>
                      setEditingStudent({ ...editingStudent, category_id: val })
                    }
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="选择类别" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <School className="w-3 h-3" /> 所在班级
                </label>
                <Select
                  value={editingStudent.current_class_id}
                  onValueChange={(val) =>
                    setEditingStudent({
                      ...editingStudent,
                      current_class_id: val,
                    })
                  }
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="选择班级" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  原学校
                </label>
                <Input
                  value={editingStudent.origin_school || ""}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      origin_school: e.target.value,
                    })
                  }
                  placeholder="请输入原毕业学校"
                  className="rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> 出生日期
                  </label>
                  <Input
                    type="date"
                    value={
                      editingStudent.birthday
                        ? format(
                            new Date(editingStudent.birthday),
                            "yyyy-MM-dd"
                          )
                        : ""
                    }
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        birthday: e.target.value,
                      })
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> 入学日期
                  </label>
                  <Input
                    type="date"
                    value={
                      editingStudent.enroll_date
                        ? format(
                            new Date(editingStudent.enroll_date),
                            "yyyy-MM-dd"
                          )
                        : ""
                    }
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        enroll_date: e.target.value,
                      })
                    }
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-lg"
            >
              取消
            </Button>
            <Button
              onClick={handleUpdateStudent}
              className="rounded-lg px-8"
            >
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
