"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import {
  Search,
  ArrowLeft,
  Settings2,
  AlertCircle,
  CheckCircle2,
  Plus,
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

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

interface ClassInfo {
  _id: string;
  code: string;
  name: string;
  major_categories: string[];
}

interface Category {
  _id: string;
  name: string;
}

export default function ClassesManagePage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [classesRes, categoriesRes] = await Promise.all([
          fetch("/api/classes"),
          fetch("/api/categories"),
        ]);

        if (classesRes.ok && categoriesRes.ok) {
          const classesData = await classesRes.json();
          const categoriesData = await categoriesRes.json();
          setClasses(classesData);
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error("Load data error:", err);
        toast.error("加载数据失败");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast.error("请输入班级名称");
      return;
    }

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName }),
      });

      if (res.ok) {
        const newClass = await res.json();
        setClasses((prev) => [...prev, newClass]);
        setIsAddDialogOpen(false);
        setNewClassName("");
        toast.success(`班级创建成功，自动分配代码: ${newClass.code}`);
      } else {
        const error = await res.json();
        toast.error(error.message || "创建失败");
      }
    } catch (err) {
      console.error("Create class error:", err);
      toast.error("操作出错");
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: classes.length,
    unconfigured: classes.filter(
      (c) => !c.major_categories || c.major_categories.length === 0
    ).length,
  };

  const handleToggleCategory = async (
    classCode: string,
    categoryName: string
  ) => {
    const cls = classes.find((c) => c.code === classCode);
    if (!cls) return;

    let newCategories: string[];
    const currentCategories = cls.major_categories || [];
    if (currentCategories.includes(categoryName)) {
      newCategories = currentCategories.filter((name) => name !== categoryName);
    } else {
      newCategories = [...currentCategories, categoryName];
    }

    try {
      const res = await fetch(`/api/classes/${classCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_categories",
          major_categories: newCategories,
        }),
      });

      if (res.ok) {
        setClasses((prev) =>
          prev.map((c) =>
            c.code === classCode ? { ...c, major_categories: newCategories } : c
          )
        );
        toast.success("更新成功");
      } else {
        toast.error("更新失败");
      }
    } catch (err) {
      console.error("Update category error:", err);
      toast.error("操作出错");
    }
  };

  const handleDeleteClass = async (classCode: string) => {
    try {
      const res = await fetch(`/api/classes/${classCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_class" }),
      });

      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c.code !== classCode));
        toast.success("班级已成功删除");
      } else {
        const error = await res.json();
        toast.error(error.message || "删除失败");
      }
    } catch (err) {
      console.error("Delete class error:", err);
      toast.error("操作出错");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen py-8 px-4 sm:px-8 bg-background">
        <div className="container mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader showBack />

      <div className="border-b bg-muted/30 px-3 py-2 md:px-4 md:py-2.5">
        <div className="container mx-auto flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="relative flex-1 max-w-xs sm:max-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="搜索班级..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 rounded-lg text-xs w-full" />
          </div>
          <Button size="sm" className="h-9 rounded-lg text-xs gap-1.5" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            新建班级
          </Button>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle>新建班级</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">班级名称</p>
              <Input placeholder="例如: 佰盈23班" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="rounded-lg" />
              <p className="text-xs text-muted-foreground">班级代码将由系统自动生成</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-lg">取消</Button>
            <Button onClick={handleCreateClass} className="rounded-lg">确认创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 sm:px-8 pt-6 pb-12 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-lg border bg-card shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    总计班级
                  </p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border bg-card shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-lg ${
                    stats.unconfigured > 0
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  {stats.unconfigured > 0 ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    待配置班级
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      stats.unconfigured > 0
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {stats.unconfigured}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Table */}
        <Card className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <Table className="min-w-[320px]">
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-48 font-semibold">班级名称</TableHead>
                <TableHead className="font-semibold">
                  所属大类配置 (可多选)
                </TableHead>
                <TableHead className="w-24 font-semibold text-right">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((cls) => {
                return (
                  <TableRow
                    key={cls._id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <TableCell>
                      <Link
                        href={`/attendance/${cls.code}`}
                        className="hover:underline"
                      >
                        <span className="font-semibold text-sm">{cls.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => {
                          const isSelected = (
                            cls.major_categories || []
                          ).includes(cat.name);
                          return (
                            <Button
                              key={cat._id}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                handleToggleCategory(cls.code, cat.name)
                              }
                              className={`rounded-full px-4 h-8 text-xs font-bold transition-all ${
                                isSelected
                                  ? "shadow-md hover:shadow-lg translate-y-[-1px]"
                                  : "hover:border-primary/50"
                              }`}
                            >
                              {cat.name}
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive">
                              确认删除班级？
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作将永久删除“{cls.name}
                              ”及其所有关联的考勤记录、历史报表和公告。此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl border-none bg-muted hover:bg-muted/80">
                              取消
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteClass(cls.code)}
                              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 border-none"
                            >
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
          {filteredClasses.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <p className="italic">没有找到匹配的班级</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
