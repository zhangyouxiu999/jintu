"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassInfo {
  _id: string;
  name: string;
}

interface CategoryInfo {
  _id: string;
  name: string;
}

import {
  UserPlus,
  ArrowLeft,
  GraduationCap,
  School,
  Calendar,
  User,
} from "lucide-react";

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    student_id: "",
    gender: "male",
    current_class_id: "",
    category_id: "",
    origin_school: "",
    birthday: "",
    enroll_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    // 获取班级和类别列表
    async function fetchData() {
      try {
        const [classesRes, categoriesRes] = await Promise.all([
          fetch("/api/classes"),
          fetch("/api/categories"),
        ]);

        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClasses(classesData);
          // 默认选中第一个班级
          if (classesData.length > 0) {
            setFormData((prev) => ({
              ...prev,
              current_class_id: classesData[0]._id,
            }));
          }
        }
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
          // 默认选中第一个类别
          if (categoriesData.length > 0) {
            setFormData((prev) => ({
              ...prev,
              category_id: categoriesData[0]._id,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch reference data:", err);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.current_class_id || !formData.category_id) {
      toast.error("请填写必填项（姓名、班级、类别）");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("学生添加成功！");
        setTimeout(() => router.push("/"), 1500);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "添加失败");
      }
    } catch (err) {
      console.error("Add Student Error:", err);
      toast.error("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader showBack />

      <div className="container mx-auto max-w-2xl pt-6 pb-12 px-4 sm:px-8 space-y-8 min-w-0">

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="rounded-lg border bg-card shadow-sm">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>带 * 的项目为必填项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    姓名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="请输入学生姓名"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>性别</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger>
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
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    班级 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.current_class_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, current_class_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择班级" />
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
                  <Label className="flex items-center gap-2">
                    <School className="w-4 h-4 text-muted-foreground" />
                    类别 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择类别" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <School className="w-4 h-4 text-muted-foreground" />
                    原学校
                  </Label>
                  <Input
                    value={formData.origin_school}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        origin_school: e.target.value,
                      })
                    }
                    placeholder="请输入原学校名称"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="birthday"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      出生日期
                    </Label>
                    <Input
                      id="birthday"
                      type="date"
                      className="rounded-lg"
                      value={formData.birthday}
                      onChange={(e) =>
                        setFormData({ ...formData, birthday: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="enroll_date"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      入学日期
                    </Label>
                    <Input
                      id="enroll_date"
                      type="date"
                      className="rounded-lg"
                      value={formData.enroll_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enroll_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="pt-6 flex gap-3">
            <Button
              type="submit"
              className="flex-1 rounded-lg h-10 text-xs font-bold"
              disabled={loading}
            >
              {loading ? "正在保存..." : "确认添加学生"}
            </Button>
            <Link href="/students/manage">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg h-10 px-6"
              >
                返回列表
              </Button>
            </Link>
          </div>
        </form>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
