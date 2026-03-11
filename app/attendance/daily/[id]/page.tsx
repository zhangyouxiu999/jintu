"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Check,
  X,
  Clock,
  UserMinus,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/PageHeader";

interface Student {
  id: string;
  name: string;
  attendance: Record<number, number>;
}

const PERIODS = [
  { id: 0, name: "早上" },
  { id: 1, name: "中午" },
  { id: 2, name: "晚一" },
  { id: 3, name: "晚二" },
];

const STATUS_CONFIG = [
  {
    id: 1,
    name: "已到",
    icon: Check,
    color: "bg-green-500",
    text: "text-green-600",
    light: "bg-green-50",
  },
  {
    id: 0,
    name: "未到",
    icon: X,
    color: "bg-red-500",
    text: "text-red-600",
    light: "bg-red-50",
  },
  {
    id: 2,
    name: "请假",
    icon: UserMinus,
    color: "bg-amber-500",
    text: "text-amber-600",
    light: "bg-amber-50",
  },
  {
    id: 3,
    name: "晚到",
    icon: Clock,
    color: "bg-blue-500",
    text: "text-blue-600",
    light: "bg-blue-50",
  },
];

export default function DailyAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const classCode = params?.id as string;

  const [date, setDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await fetch(
        `/api/attendance/daily/${classCode}?date=${formattedDate}`
      );
      if (!response.ok) throw new Error("获取数据失败");
      const data = await response.json();
      setStudents(data.students);
      setClassName(data.name);
    } catch (error) {
      console.error(error);
      toast.error("获取数据失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [classCode, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (
    studentId: string,
    period: number,
    status: number
  ) => {
    const updateKey = `${studentId}-${period}`;
    setUpdating(updateKey);
    try {
      const response = await fetch(`/api/attendance/daily/${classCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_attendance",
          student_id: studentId,
          period,
          status,
          date: format(date, "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) throw new Error("保存失败");

      // 局部更新状态
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === studentId) {
            return {
              ...s,
              attendance: { ...s.attendance, [period]: status },
            };
          }
          return s;
        })
      );
    } catch (error) {
      console.error(error);
      toast.error("保存失败，请重试");
    } finally {
      setUpdating(null);
    }
  };

  const handleBatchUpdate = async (period: number, status: number) => {
    try {
      setLoading(true);
      const studentIds = students.map((s) => s.id);
      const response = await fetch(`/api/attendance/daily/${classCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_update_attendance",
          student_ids: studentIds,
          period,
          status,
          date: format(date, "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) throw new Error("批量保存失败");

      toast.success(
        `${PERIODS[period].name}全班已标记为${
          STATUS_CONFIG.find((s) => s.id === status)?.name
        }`
      );
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("批量保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      const detailHeaders = ["姓名", ...PERIODS.map((p) => p.name)];
      const data = students.map((s) => [
        s.name,
        ...PERIODS.map((p) => {
          const statusId = s.attendance[p.id] ?? 0;
          return STATUS_CONFIG.find((sc) => sc.id === statusId)?.name || "未到";
        }),
      ]);

      const ws = XLSX.utils.aoa_to_sheet([
        [`${className} - ${format(date, "yyyy年MM月dd日")} 考勤统计`],
        [],
        detailHeaders,
        ...data,
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "考勤报表");
      XLSX.writeFile(wb, `${className}_考勤_${format(date, "yyyyMMdd")}.xlsx`);
      toast.success("报表已导出");
    } catch (error) {
      console.error(error);
      toast.error("导出失败");
    }
  };

  return (
    <div className="min-h-screen bg-background min-w-0">
      <PageHeader showBack />

      {/* 页面工具栏：班级名 + 日期 */}
      <div className="border-b bg-muted/30 px-3 py-2 md:px-4 md:py-2.5">
        <div className="container mx-auto flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{className || "加载中..."}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">日考勤矩阵</p>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 font-medium text-xs gap-1.5">
                <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                {format(date, "M月d日 EEEE", { locale: zhCN })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
            刷新
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-1.5" />
            导出
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-3 pt-6 pb-12 sm:px-4 md:px-6 lg:px-8 space-y-6 min-w-0">
        {/* 状态图例：紧凑一行（与首页/统计页风格一致） */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {STATUS_CONFIG.map((sc) => (
            <span key={sc.id} className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full shrink-0", sc.color)} />
              {sc.name}
            </span>
          ))}
        </div>

        {/* 考勤矩阵卡片 */}
        <Card className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-px">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                  <TableHead className="w-[100px] min-w-[100px] sm:w-[120px] sm:min-w-[120px] sticky left-0 top-0 z-20 bg-muted/30 font-semibold text-xs border-r border-border/50">
                    姓名
                  </TableHead>
                  {PERIODS.map((period) => (
                    <TableHead
                      key={period.id}
                      className="min-w-[140px] sm:min-w-[180px] text-center sticky top-0 z-10 bg-muted/30 font-semibold text-xs border-b border-border/50"
                    >
                      <div className="flex flex-col gap-1.5 py-2 px-1">
                        <span>{period.name}</span>
                        <div className="flex justify-center gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400"
                            onClick={() => handleBatchUpdate(period.id, 1)}
                          >
                            全勤
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
                            onClick={() => handleBatchUpdate(period.id, 0)}
                          >
                            全缺
                          </Button>
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border/50">
                        <TableCell className="sticky left-0 bg-card border-r border-border/50 py-2">
                          <div className="h-4 w-16 sm:w-20 bg-muted/60 animate-pulse rounded" />
                        </TableCell>
                        {PERIODS.map((p) => (
                          <TableCell key={p.id} className="py-2 px-1">
                            <div className="h-8 w-full max-w-[120px] mx-auto bg-muted/60 animate-pulse rounded-lg" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : students.map((student) => (
                      <TableRow
                        key={student.id}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="font-medium text-sm sticky left-0 bg-card z-10 border-r border-border/50 py-2">
                          {student.name}
                        </TableCell>
                        {PERIODS.map((period) => {
                          const currentStatusId = student.attendance[period.id] ?? 0;
                          const isUpdating = updating === `${student.id}-${period.id}`;
                          return (
                            <TableCell key={period.id} className="py-1.5 px-1 sm:py-2 sm:px-2">
                              <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                                {STATUS_CONFIG.map((sc) => (
                                  <Button
                                    key={sc.id}
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                      "h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition-all shrink-0",
                                      currentStatusId === sc.id
                                        ? cn(sc.color, "text-white shadow-sm")
                                        : "hover:bg-muted/80 text-muted-foreground"
                                    )}
                                    onClick={() => handleStatusUpdate(student.id, period.id, sc.id)}
                                    disabled={isUpdating}
                                  >
                                    <sc.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isUpdating && "animate-pulse")} />
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 各时段出勤：紧凑一行（与首页班级数/日期风格一致） */}
        {!loading && students.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {PERIODS.map((p) => {
              const presentCount = students.filter((s) => s.attendance[p.id] === 1).length;
              return (
                <span key={p.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider">{p.name}</span>
                  <span className="font-semibold text-green-600">{presentCount}</span>
                  <span className="text-muted-foreground/80">/ {students.length}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
