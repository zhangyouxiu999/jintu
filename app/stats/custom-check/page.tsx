"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  User,
  Clock,
  Download,
  Check,
  X,
  Minus,
  TrendingUp,
  Save,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/PageHeader";

// 定义 4 位统计人员
const STAFF = [
  { id: "1", name: "张老师" },
  { id: "2", name: "耿老师" },
  { id: "3", name: "潘老师" },
  { id: "4", name: "郑老师" },
];

// 定义状态枚举
type Status = "completed" | "pending" | "normal";

// 根据年月 YYYY-MM 生成该月所有日期（自动处理 28/29/30/31 天）
function getDaysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function generateDates(yearMonth: string): string[] {
  const days = getDaysInMonth(yearMonth);
  const [y, m] = yearMonth.split("-");
  const dates: string[] = [];
  for (let i = 1; i <= days; i++) {
    dates.push(`${y}-${m}-${String(i).padStart(2, "0")}`);
  }
  return dates;
}

// 构建某月的空考勤网格
function buildEmptyAttendance(yearMonth: string) {
  const data: Record<
    string,
    Record<string, { morning: Status; afternoon: Status }>
  > = {};
  const dates = generateDates(yearMonth);
  dates.forEach((date) => {
    data[date] = {};
    STAFF.forEach((person) => {
      data[date][person.id] = { morning: "normal", afternoon: "normal" };
    });
  });
  return data;
}

function buildEmptyDirty(yearMonth: string) {
  const dirty: Record<
    string,
    Record<string, { morning: boolean; afternoon: boolean }>
  > = {};
  const dates = generateDates(yearMonth);
  dates.forEach((date) => {
    dirty[date] = {};
    STAFF.forEach((person) => {
      dirty[date][person.id] = { morning: false, afternoon: false };
    });
  });
  return dirty;
}

const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);

type AttendanceData = Record<string, Record<string, { morning: Status; afternoon: Status }>>;
type DirtyMapData = Record<string, Record<string, { morning: boolean; afternoon: boolean }>>;

function loadMonthState(month: string): {
  attendanceData: AttendanceData;
  dirtyMap: DirtyMapData;
  filterType: "all" | "error";
} {
  const attendanceData = buildEmptyAttendance(month);
  const dirtyMap = buildEmptyDirty(month);
  let filterType: "all" | "error" = "all";
  try {
    const raw = localStorage.getItem(`staff_check_local_${month}`);
    if (raw) {
      const saved = JSON.parse(raw);
      Object.keys(saved || {}).forEach((date) => {
        if (attendanceData[date]) {
          Object.keys(saved[date] || {}).forEach((sid) => {
            if (attendanceData[date][sid]) {
              attendanceData[date][sid] = {
                morning: saved[date][sid].morning as Status,
                afternoon: saved[date][sid].afternoon as Status,
              };
            }
          });
        }
      });
    }
    const rawDirty = localStorage.getItem(`staff_check_dirty_${month}`);
    if (rawDirty) {
      const savedDirty = JSON.parse(rawDirty);
      Object.keys(savedDirty || {}).forEach((date) => {
        if (dirtyMap[date]) {
          Object.keys(savedDirty[date] || {}).forEach((sid) => {
            if (dirtyMap[date][sid]) {
              dirtyMap[date][sid] = {
                morning: !!savedDirty[date][sid].morning,
                afternoon: !!savedDirty[date][sid].afternoon,
              };
            }
          });
        }
      });
    }
    const ft = localStorage.getItem(`staff_check_filter_${month}`);
    if (ft === "all" || ft === "error") filterType = ft;
  } catch {}
  return { attendanceData, dirtyMap, filterType };
}

function saveMonthState(
  month: string,
  attendanceData: AttendanceData,
  dirtyMap: DirtyMapData,
  filterType: "all" | "error"
) {
  try {
    localStorage.setItem(`staff_check_local_${month}`, JSON.stringify(attendanceData));
    localStorage.setItem(`staff_check_dirty_${month}`, JSON.stringify(dirtyMap));
    localStorage.setItem(`staff_check_filter_${month}`, filterType);
    localStorage.setItem("staff_check_selected_month", month);
  } catch {}
}

const StatusButtons = React.memo(function StatusButtons({
  currentStatus,
  onStatusChange,
}: {
  currentStatus: Status;
  onStatusChange: (status: Status) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={currentStatus === "completed" ? "default" : "outline"}
        size="icon"
        className={`h-6 w-6 rounded-md ${
          currentStatus === "completed"
            ? "bg-green-600 hover:bg-green-700"
            : "text-green-600 hover:bg-green-50 border-green-200"
        }`}
        onClick={() => onStatusChange("completed")}
        title="完成"
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        variant={currentStatus === "pending" ? "default" : "outline"}
        size="icon"
        className={`h-6 w-6 rounded-md ${
          currentStatus === "pending"
            ? "bg-red-600 hover:bg-red-700"
            : "text-red-600 hover:bg-red-50 border-red-200"
        }`}
        onClick={() => onStatusChange("pending")}
        title="未完成"
      >
        <X className="h-3 w-3" />
      </Button>
      <Button
        variant={currentStatus === "normal" ? "default" : "outline"}
        size="icon"
        className={`h-6 w-6 rounded-md ${
          currentStatus === "normal"
            ? "bg-muted-foreground hover:bg-muted-foreground/80"
            : "text-muted-foreground hover:bg-muted border"
        }`}
        onClick={() => onStatusChange("normal")}
        title="正常"
      >
        <Minus className="h-3 w-3" />
      </Button>
    </div>
  );
});

// ─── 统计卡片（memoized，仅在数值变化时重渲染） ────────────────────────────────
type StaffStatCardProps = {
  name: string;
  morningDone: number;
  morningPending: number;
  afternoonDone: number;
  afternoonPending: number;
  score: number;
};
const StaffStatCard = React.memo(function StaffStatCard({
  name, morningDone, morningPending, afternoonDone, afternoonPending, score,
}: StaffStatCardProps) {
  return (
    <Card className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="h-1 bg-primary/20" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-4 h-4" />
            </div>
            <span className="font-bold">{name}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-100 rounded-full">
            <TrendingUp className="w-3 h-3 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">累计: {score}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <span>上午统计</span>
              <div className="h-px flex-1 mx-2 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-green-50 p-2 rounded-lg border border-green-100 flex flex-col items-center">
                <p className="text-green-700 mb-0.5 font-medium">完成</p>
                <p className="text-lg font-bold text-green-700">{morningDone}</p>
              </div>
              <div className="bg-red-50 p-2 rounded-lg border border-red-100 flex flex-col items-center">
                <p className="text-red-700 mb-0.5 font-medium">未完成</p>
                <p className="text-lg font-bold text-red-700">{morningPending}</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <span>下午统计</span>
              <div className="h-px flex-1 mx-2 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-green-50 p-2 rounded-lg border border-green-100 flex flex-col items-center">
                <p className="text-green-700 mb-0.5 font-medium">完成</p>
                <p className="text-lg font-bold text-green-700">{afternoonDone}</p>
              </div>
              <div className="bg-red-50 p-2 rounded-lg border border-red-100 flex flex-col items-center">
                <p className="text-red-700 mb-0.5 font-medium">未完成</p>
                <p className="text-lg font-bold text-red-700">{afternoonPending}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ─── 表格行（memoized，只有该行数据变化时重渲染） ────────────────────────────────
type RowData = Record<string, { morning: Status; afternoon: Status }>;
type OnStatusChange = (
  date: string,
  staffId: string,
  period: "morning" | "afternoon",
  newStatus: Status
) => void;

const AttendanceRow = React.memo(function AttendanceRow({
  date,
  rowData,
  onStatusChange,
}: {
  date: string;
  rowData: RowData;
  onStatusChange: OnStatusChange;
}) {
  const d = new Date(date);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  return (
    <TableRow className={isWeekend ? "bg-muted/20" : ""}>
      <TableCell
        className={`font-medium sticky left-0 z-10 border-r shadow-[1px_0_0_0_rgba(0,0,0,0.05)] ${
          isWeekend ? "bg-muted/30" : "bg-card"
        }`}
      >
        <div className="flex flex-col">
          <span>{date.split("-")[1]}月{date.split("-")[2]}日</span>
          <span className="text-[10px] text-muted-foreground">
            {["周日","周一","周二","周三","周四","周五","周六"][d.getDay()]}
          </span>
        </div>
      </TableCell>
      {STAFF.map((person) => (
        <TableCell key={person.id} className="p-2">
          <div className="flex flex-col gap-3 items-center">
            <div className="flex items-center gap-2 w-full justify-between bg-muted/30 p-1 rounded-lg px-2">
              <span className="text-[10px] font-medium text-muted-foreground">上午</span>
              <StatusButtons
                currentStatus={rowData[person.id].morning}
                onStatusChange={(s) => onStatusChange(date, person.id, "morning", s)}
              />
            </div>
            <div className="flex items-center gap-2 w-full justify-between bg-muted/30 p-1 rounded-lg px-2">
              <span className="text-[10px] font-medium text-muted-foreground">下午</span>
              <StatusButtons
                currentStatus={rowData[person.id].afternoon}
                onStatusChange={(s) => onStatusChange(date, person.id, "afternoon", s)}
              />
            </div>
          </div>
        </TableCell>
      ))}
    </TableRow>
  );
});

export default function CustomStatsPage() {
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(DEFAULT_MONTH);
  const [filterType, setFilterType] = useState<"all" | "error">("all");
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>(
    () => buildEmptyAttendance(DEFAULT_MONTH)
  );
  const [dirtyMap, setDirtyMap] = useState<DirtyMapData>(
    () => buildEmptyDirty(DEFAULT_MONTH)
  );
  const dirtyRef = useRef<DirtyMapData>(dirtyMap);
  // 始终指向最新的 attendanceData，让 handleStatusChange 无需依赖即可读当前值
  const attendanceRef = useRef<AttendanceData>(attendanceData);

  // 客户端挂载后从 localStorage 恢复上次选中的月份及其数据（一次性，避免 SSR/CSR 不一致）
  useEffect(() => {
    try {
      const savedMonth = localStorage.getItem("staff_check_selected_month");
      const month =
        savedMonth && /^\d{4}-\d{2}$/.test(savedMonth)
          ? savedMonth
          : DEFAULT_MONTH;
      const { attendanceData: ad, dirtyMap: dm, filterType: ft } =
        loadMonthState(month);
      // React 18 在 effect 中也会批处理这些 setState，只触发一次重渲染
      dirtyRef.current = dm;
      attendanceRef.current = ad;
      setSelectedYearMonth(month);
      setAttendanceData(ad);
      setDirtyMap(dm);
      setFilterType(ft);
    } catch {}
  }, []);

  // 加载后端数据，切换月份时取消旧请求防止竞态
  useEffect(() => {
    const controller = new AbortController();
    setIsLoaded(false);

    async function fetchStaffAttendance() {
      try {
        const res = await fetch("/api/attendance/custom?type=staff_check", {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setAttendanceData((prev) => {
            const newData = { ...prev };
            const prefix = selectedYearMonth + "-";
            data.forEach(
              (record: {
                date: string;
                target_id: string;
                status_morning?: string;
                status_afternoon?: string;
              }) => {
                if (!record.date?.startsWith(prefix)) return;
                const date = record.date;
                const staffId = record.target_id;
                if (newData[date] && newData[date][staffId]) {
                  const localCell = newData[date][staffId];
                  const remoteMorning =
                    (record.status_morning as Status) || "normal";
                  const remoteAfternoon =
                    (record.status_afternoon as Status) || "normal";
                  newData[date][staffId] = {
                    morning:
                      dirtyRef.current[date]?.[staffId]?.morning ||
                      localCell.morning !== "normal"
                        ? localCell.morning
                        : remoteMorning,
                    afternoon:
                      dirtyRef.current[date]?.[staffId]?.afternoon ||
                      localCell.afternoon !== "normal"
                        ? localCell.afternoon
                        : remoteAfternoon,
                  };
                }
              }
            );
            return newData;
          });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Fetch staff attendance error:", err);
        toast.error("加载数据失败，请刷新重试");
      } finally {
        if (!controller.signal.aborted) setIsLoaded(true);
      }
    }
    fetchStaffAttendance();
    return () => controller.abort();
  }, [selectedYearMonth]);

  // 持久化：仅当 attendanceData 归属于当前月份时才写入，防止切月期间写入错误数据
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const dataKeys = Object.keys(attendanceData);
    if (dataKeys.length === 0) return;
    const dataMonth = dataKeys[0].slice(0, 7);
    if (dataMonth !== selectedYearMonth) return;

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveMonthState(selectedYearMonth, attendanceData, dirtyMap, filterType);
    }, 300);
    return () => clearTimeout(saveTimerRef.current);
  }, [attendanceData, dirtyMap, filterType, selectedYearMonth]);

  const handleReset = () => {
    if (window.confirm("确定要重置当前月份的统计数据吗？此操作不可撤销。")) {
      try {
        const emptyDirty = buildEmptyDirty(selectedYearMonth);
        dirtyRef.current = emptyDirty;
        setAttendanceData(buildEmptyAttendance(selectedYearMonth));
        setDirtyMap(emptyDirty);
        try {
          localStorage.removeItem(`staff_check_local_${selectedYearMonth}`);
          localStorage.removeItem(`staff_check_filter_${selectedYearMonth}`);
          localStorage.removeItem(`staff_check_dirty_${selectedYearMonth}`);
        } catch {}
        toast.success("当前月份本地数据已重置，请手动更新需要的状态以同步到服务器");
      } catch (error) {
        console.error("Reset staff attendance error:", error);
        toast.error("重置失败");
      }
    }
  };

  const dates = useMemo(
    () => Object.keys(attendanceData).sort(),
    [attendanceData]
  );

  const monthLabel = useMemo(() => {
    const [y, m] = selectedYearMonth.split("-");
    return `${y}年${parseInt(m, 10)}月`;
  }, [selectedYearMonth]);

  const [pickerYear, setPickerYear] = useState<number>(() => {
    const [y] = selectedYearMonth.split("-").map(Number);
    return y;
  });

  const handleMonthSelect = (year: number, month: number) => {
    const newMonth = `${year}-${String(month).padStart(2, "0")}`;
    const { attendanceData: ad, dirtyMap: dm, filterType: ft } = loadMonthState(newMonth);
    // React 18 在事件处理函数中自动批处理所有 setState → 单次重渲染，消除卡顿
    dirtyRef.current = dm;
    attendanceRef.current = ad;
    setSelectedYearMonth(newMonth);
    setAttendanceData(ad);
    setDirtyMap(dm);
    setFilterType(ft);
    setIsLoaded(false);
    setMonthPickerOpen(false);
  };

  const handleExport = () => {
    try {
      // 1. 准备明细数据（仅当前选中月份，保证每月导出独立）
      const detailHeaders = [
        "日期",
        ...STAFF.map((p) => `${p.name}(上午)`),
        ...STAFF.map((p) => `${p.name}(下午)`),
      ];
      const detailRows = dates.map((date) => {
        const morningStats = STAFF.map((p) => {
          const status = attendanceData[date][p.id].morning;
          return status === "completed"
            ? "完成"
            : status === "pending"
            ? "未完成"
            : "正常";
        });
        const afternoonStats = STAFF.map((p) => {
          const status = attendanceData[date][p.id].afternoon;
          return status === "completed"
            ? "完成"
            : status === "pending"
            ? "未完成"
            : "正常";
        });
        return [date, ...morningStats, ...afternoonStats];
      });

      // 2. 准备汇总数据
      const summaryHeaders = [
        "姓名",
        "上午完成",
        "上午未完成",
        "下午完成",
        "下午未完成",
        "累计得分",
      ];
      const summaryRows = STAFF.map((p) => {
        let mDone = 0,
          mPending = 0,
          aDone = 0,
          aPending = 0;
        dates.forEach((d) => {
          const r = attendanceData[d][p.id];
          if (r.morning === "completed") mDone++;
          if (r.morning === "pending") mPending++;
          if (r.afternoon === "completed") aDone++;
          if (r.afternoon === "pending") aPending++;
        });
        const score = (mDone + aDone) * 5 + (mPending + aPending) * -5;
        return [p.name, mDone, mPending, aDone, aPending, score];
      });

      // 3. 创建工作表内容（按当前选中月份，每月导出独立）
      const wsData = [
        [`${monthLabel}专项考勤核查明细表`],
        detailHeaders,
        ...detailRows,
        [], // 空行
        ["汇总统计表"],
        summaryHeaders,
        ...summaryRows,
      ];

      // 4. 使用 xlsx 生成并下载（文件名含月份，避免覆盖）
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // 设置列宽
      const wscols = [
        { wch: 15 }, // 日期
        ...Array(STAFF.length * 2).fill({ wch: 12 }), // 老师统计列
      ];
      ws["!cols"] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "考勤统计报告");
      XLSX.writeFile(
        wb,
        `${monthLabel}专项考勤统计报告_${selectedYearMonth}.xlsx`
      );

      toast.success("Excel 报告已生成并开始下载");
    } catch (error) {
      console.error("Export failed", error);
      toast.error("导出报告失败，请重试");
    }
  };

  // useCallback([], [])：依赖为空，函数引用永远稳定，配合 AttendanceRow memo 避免全表重渲染
  const handleStatusChange: OnStatusChange = useCallback(async (
    date,
    staffId,
    period,
    newStatus
  ) => {
    // 通过 ref 读旧值，不依赖 state 闭包
    const prevStatus =
      attendanceRef.current[date]?.[staffId]?.[period] ?? ("normal" as Status);

    setAttendanceData((prev) => {
      const next = {
        ...prev,
        [date]: {
          ...prev[date],
          [staffId]: { ...prev[date][staffId], [period]: newStatus },
        },
      };
      attendanceRef.current = next;
      return next;
    });
    setDirtyMap((prev) => {
      const next = {
        ...prev,
        [date]: {
          ...prev[date],
          [staffId]: { ...prev[date][staffId], [period]: true },
        },
      };
      dirtyRef.current = next;
      return next;
    });

    try {
      const res = await fetch("/api/attendance/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "staff_check",
          target_id: staffId,
          date,
          [period === "morning" ? "status_morning" : "status_afternoon"]: newStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("已更新状态");
    } catch (err) {
      console.error("Update staff attendance error:", err);
      // 回滚：只恢复变更的单个格子，不需要整份数据的深拷贝
      setAttendanceData((prev) => {
        const next = {
          ...prev,
          [date]: {
            ...prev[date],
            [staffId]: { ...prev[date][staffId], [period]: prevStatus },
          },
        };
        attendanceRef.current = next;
        return next;
      });
      toast.error("更新失败，请重试");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDates = useMemo(() => {
    return filterType === "all"
      ? dates
      : dates.filter((date) => {
          return STAFF.some(
            (person) =>
              attendanceData[date][person.id].morning !== "normal" ||
              attendanceData[date][person.id].afternoon !== "normal"
          );
        });
  }, [filterType, dates, attendanceData]);

  // 统计卡片数据缓存：避免在每次渲染时重新计算
  const staffStats = useMemo(() => {
    return STAFF.map((person) => {
      let morningDone = 0, morningPending = 0, afternoonDone = 0, afternoonPending = 0;
      dates.forEach((d) => {
        const r = attendanceData[d][person.id];
        if (r.morning === "completed") morningDone++;
        if (r.morning === "pending") morningPending++;
        if (r.afternoon === "completed") afternoonDone++;
        if (r.afternoon === "pending") afternoonPending++;
      });
      return {
        ...person,
        morningDone, morningPending, afternoonDone, afternoonPending,
        score: (morningDone + afternoonDone) * 5 + (morningPending + afternoonPending) * -5,
      };
    });
  }, [dates, attendanceData]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader showBack />

      <div className="border-b bg-muted/30 px-3 py-2 md:px-4 md:py-2.5">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Popover open={monthPickerOpen} onOpenChange={(open) => { setMonthPickerOpen(open); if (open) setPickerYear(Number(selectedYearMonth.split("-")[0])); }}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-input px-3 text-xs font-medium shrink-0">
                  {monthLabel}
                  <CalendarIcon className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 z-[9999]" align="start" sideOffset={8}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setPickerYear((y) => y - 1)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold">{pickerYear}年</span>
                    <button type="button" onClick={() => setPickerYear((y) => y + 1)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const isSelected = pickerYear === Number(selectedYearMonth.split("-")[0]) && m === Number(selectedYearMonth.split("-")[1]);
                      return (
                        <button key={m} type="button" onClick={() => handleMonthSelect(pickerYear, m)} className={cn("h-8 rounded-md text-xs font-medium transition-colors", isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground")}>
                          {m}月
                        </button>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {isLoaded && (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-100 shrink-0">
                <Save className="w-3 h-3" /> 已同步
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant={filterType === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterType("all")} className="h-8 rounded-lg text-xs">全部日期</Button>
            <Button variant={filterType === "error" ? "default" : "outline"} size="sm" onClick={() => setFilterType("error")} className="h-8 rounded-lg text-xs text-destructive border-destructive/30 hover:bg-destructive/5">只看异常</Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="h-8 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30">
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> 重置
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1.5 rounded-lg text-xs">
              <Download className="h-3.5 w-3.5" /> 导出报告
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-8 pt-6 pb-12 space-y-6 min-w-0">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {staffStats.map((s) => (
            <StaffStatCard
              key={s.id}
              name={s.name}
              morningDone={s.morningDone}
              morningPending={s.morningPending}
              afternoonDone={s.afternoonDone}
              afternoonPending={s.afternoonPending}
              score={s.score}
            />
          ))}
        </div>


        {/* Detailed Table */}
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                核查明细录入表
              </CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                Total: {filteredDates.length} days
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-auto relative rounded-b-xl border-t">
              <Table className="border-separate border-spacing-0">
                <TableHeader className="relative z-30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[140px] font-semibold bg-muted sticky top-0 left-0 z-50 border-b border-r shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                      日期
                    </TableHead>
                    {STAFF.map((person) => (
                      <TableHead
                        key={person.id}
                        className="text-center font-semibold min-w-[180px] bg-muted sticky top-0 z-40 border-b border-r last:border-r-0 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]"
                      >
                        {person.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDates.map((date) => (
                    <AttendanceRow
                      key={date}
                      date={date}
                      rowData={attendanceData[date]}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
