"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  TrendingUp,
  Download,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

// 定义考勤状态类型
type AttendanceStatus =
  | "none"
  | "present"
  | "present_half"
  | "leave_am"
  | "leave_pm"
  | "leave_all"
  | "rest";

interface Student {
  _id: string;
  student_id: string;
  name: string;
}

function StudentStatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    searchParams?.get("student_id") || null
  );
  const [hasMounted, setHasMounted] = useState(false);

  // 生成考勤统计的时间范围：当前学期或自定义
  const allDates = useMemo(() => {
    const dates: string[] = [];
    // 默认展示最近 3 个月
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates.reverse(); // 最新的在前面
  }, []);

  // 加载学生列表
  useEffect(() => {
    setHasMounted(true);
    async function fetchStudents() {
      try {
        const res = await fetch("/api/students/manage");
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        }
      } catch (err) {
        console.error("Fetch students error:", err);
      }
    }
    fetchStudents();
  }, []);

  // 根据选择的学生加载数据
  useEffect(() => {
    if (!selectedStudentId) return;

    async function fetchRecords() {
      try {
        const res = await fetch(
          `/api/attendance/custom?type=individual&target_id=${selectedStudentId}`
        );
        if (res.ok) {
          const data = await res.json();
          const recordMap: Record<string, AttendanceStatus> = {};
          data.forEach(
            (r: {
              date: string;
              custom_data?: {
                status?: string;
              };
            }) => {
              recordMap[r.date] =
                (r.custom_data?.status as AttendanceStatus) || "none";
            }
          );
          setRecords(recordMap);
        }
      } catch (err) {
        console.error("Fetch records error:", err);
        toast.error("加载记录失败");
      }
    }
    fetchRecords();
  }, [selectedStudentId]);

  const selectedStudent = students.find(
    (s) => s.student_id === selectedStudentId
  );

  // 状态变更保存
  const setStatus = async (date: string, nextStatus: AttendanceStatus) => {
    if (!selectedStudentId) {
      toast.error("请先选择学生");
      return;
    }

    const currentStatus = records[date] || "none";
    const finalStatus = currentStatus === nextStatus ? "none" : nextStatus;

    // 先乐观更新 UI
    setRecords((prev) => ({ ...prev, [date]: finalStatus }));

    try {
      const res = await fetch("/api/attendance/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "individual",
          target_id: selectedStudentId,
          date,
          custom_data: { status: finalStatus },
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      if (finalStatus !== "none") {
        const statusText = {
          present: "上学",
          present_half: "上学(半天)",
          leave_am: "请假(上午)",
          leave_pm: "请假(下午)",
          leave_all: "请假(全天)",
          rest: "正常休息",
        }[finalStatus];

        toast.success(`${date} 已标记为 ${statusText}`, { duration: 1000 });
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("保存失败");
      // 回滚
      setRecords((prev) => ({ ...prev, [date]: currentStatus }));
    }
  };

  // 导出 Excel
  const exportToExcel = () => {
    if (!selectedStudent) {
      toast.error("请先选择学生");
      return;
    }

    try {
      const exportData = [...allDates].reverse().map((date) => {
        const status = records[date] || "none";
        const d = new Date(date);
        const weekDays = [
          "周日",
          "周一",
          "周二",
          "周三",
          "周四",
          "周五",
          "周六",
        ];

        let statusLabel = "未记录";
        if (status === "present") statusLabel = "上学(一天)";
        if (status === "present_half") statusLabel = "上学(半天)";
        if (status === "leave_am") statusLabel = "请假(上午)";
        if (status === "leave_pm") statusLabel = "请假(下午)";
        if (status === "leave_all") statusLabel = "请假(一天)";
        if (status === "rest") statusLabel = "正常休息";

        return {
          日期: date,
          星期: weekDays[d.getDay()],
          考勤状态: statusLabel,
        };
      });

      // 添加统计汇总行
      exportData.push({ 日期: "", 星期: "", 考勤状态: "" });
      exportData.push({ 日期: "统计汇总", 星期: "", 考勤状态: "" });
      exportData.push({
        日期: "总天数",
        星期: String(stats.total),
        考勤状态: "",
      });
      exportData.push({
        日期: "上学天数",
        星期: String(stats.present),
        考勤状态: "",
      });
      exportData.push({
        日期: "请假天数",
        星期: String(stats.leave),
        考勤状态: "",
      });
      exportData.push({
        日期: "休息天数",
        星期: String(stats.rest),
        考勤状态: "",
      });
      exportData.push({
        日期: "出勤率",
        星期: `${attendanceRate}%`,
        考勤状态: "",
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "考勤记录");

      worksheet["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 20 }];

      XLSX.writeFile(
        workbook,
        `${selectedStudent.name}_考勤统计_${allDates[allDates.length - 1]}_${
          allDates[0]
        }.xlsx`
      );
      toast.success("Excel 导出成功");
    } catch (error) {
      console.error("Export failed", error);
      toast.error("导出失败");
    }
  };

  // 统计数据
  const stats = useMemo(() => {
    return allDates.reduce(
      (acc, date) => {
        const s = records[date];
        const d = new Date(date);
        const isSaturday = d.getDay() === 6;

        if (!s || s === "none") {
          acc.none += 1;
        } else if (s === "present") {
          acc.present += 1;
        } else if (s === "present_half") {
          acc.present += 0.5;
          acc.rest += 0.5;
        } else if (s === "leave_am" || s === "leave_pm") {
          acc.leave += 0.5;
          if (isSaturday) {
            acc.rest += 0.5;
          } else {
            acc.present += 0.5;
          }
        } else if (s === "leave_all") {
          acc.leave += 1;
        } else if (s === "rest") {
          acc.rest += 1;
        }

        return acc;
      },
      { total: allDates.length, present: 0, leave: 0, rest: 0, none: 0 }
    );
  }, [allDates, records]);

  const attendanceRate =
    stats.present + stats.leave > 0
      ? Math.round((stats.present / (stats.present + stats.leave)) * 100)
      : 0;

  if (!hasMounted) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader showBack />

      <div className="border-b bg-muted/30 px-3 py-2 md:px-4 md:py-2.5">
        <div className="container mx-auto flex flex-wrap items-center gap-2 sm:gap-4">
          <Select value={selectedStudentId || ""} onValueChange={(val) => { setSelectedStudentId(val); router.replace(`/attendance/stats?student_id=${val}`); }}>
            <SelectTrigger className="w-full sm:w-[200px] h-9 rounded-lg font-medium text-xs">
              <SelectValue placeholder="选择学生" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {students.map((s) => (
                <SelectItem key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="rounded-lg gap-1.5 h-9 px-3 font-medium text-xs" onClick={exportToExcel} disabled={!selectedStudentId}>
            <Download className="w-3.5 h-3.5" />
            导出 Excel
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 sm:px-8 pt-6 pb-12 min-w-0">
        {!selectedStudentId ? (
          <Card className="rounded-lg border-dashed border-2 p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-bold">请选择一名学生</h2>
              <p className="text-muted-foreground">
                选择学生后即可查看并记录其考勤统计数据
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* 数据概览 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    总计天数
                  </p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider mb-0.5">
                    上学天数
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    {stats.present}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wider mb-0.5">
                    请假天数
                  </p>
                  <p className="text-xl font-bold text-amber-600">
                    {stats.leave}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-0.5">
                    出勤率
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {attendanceRate}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 日期列表 */}
            <Card className="rounded-lg shadow-sm border overflow-hidden mb-8">
              <div className="px-6 py-4 bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-sm text-foreground">
                    {selectedStudent?.name || "加载中..."} 的考勤明细
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>上学</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>请假</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                    <span>休息</span>
                  </div>
                </div>
              </div>

              <div className="divide-y max-h-[600px] overflow-y-auto">
                {allDates.map((date) => {
                  const status = records[date] || "none";
                  const dateObj = new Date(date);
                  const isWeekend =
                    dateObj.getDay() === 0 || dateObj.getDay() === 6;

                  return (
                    <div
                      key={date}
                      className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between transition-colors hover:bg-muted/30 gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex flex-col items-center justify-center border shadow-sm",
                            isWeekend
                              ? "bg-muted border-border/50"
                              : "bg-card border-border"
                          )}
                        >
                          <span
                            className={cn(
                              "text-[10px] font-medium uppercase",
                              isWeekend
                                ? "text-muted-foreground/60"
                                : "text-primary"
                            )}
                          >
                            {
                              ["日", "一", "二", "三", "四", "五", "六"][
                                dateObj.getDay()
                              ]
                            }
                          </span>
                          <span className="text-sm font-bold">
                            {date.split("-")[2]}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold tracking-tight text-sm">
                            {date.split("-")[1]}月{date.split("-")[2]}日
                          </p>
                          {isWeekend && (
                            <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-tighter">
                              Weekend
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 p-1 rounded-lg">
                        {[
                          { id: "present", label: "1.0", color: "emerald-500" },
                          {
                            id: "present_half",
                            label: "0.5",
                            color: "emerald-400",
                          },
                          { id: "leave_am", label: "AM", color: "amber-500" },
                          { id: "leave_pm", label: "PM", color: "amber-500" },
                          {
                            id: "leave_all",
                            label: "Full",
                            color: "amber-600",
                          },
                          { id: "rest", label: "Rest", color: "slate-400" },
                        ].map((btn) => (
                          <Button
                            key={btn.id}
                            size="sm"
                            variant={status === btn.id ? "default" : "ghost"}
                            className={cn(
                              "h-8 px-2.5 rounded-lg text-[10px] font-medium transition-all duration-200",
                              status === btn.id
                                ? `bg-${btn.color} hover:bg-${btn.color} text-white shadow-sm shadow-${btn.color}/20`
                                : `text-muted-foreground hover:text-${btn.color} hover:bg-${btn.color}/10`
                            )}
                            onClick={() =>
                              setStatus(date, btn.id as AttendanceStatus)
                            }
                          >
                            {btn.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default function StudentStatsPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center font-bold">加载中...</div>}
    >
      <StudentStatsContent />
    </Suspense>
  );
}
