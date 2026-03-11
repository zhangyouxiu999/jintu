"use client";

import { memo } from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, addMonths, subMonths, isWeekend, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Edit2,
  Check,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  History as HistoryIcon,
  RotateCcw,
  X,
  Camera,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth, isSameMonth, isSameDay } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/PageHeader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import Tesseract from "tesseract.js";

interface Student {
  id: string;
  name: string;
}

interface AttendanceData {
  className: string;
  month: string;
  days: string[];
  students: Student[];
  matrix: Record<string, Record<string, Record<number, number>>>;
  student_order?: string[];
}

const PERIODS = [
  { id: 0, name: "早", short: "早" },
  { id: 1, name: "中", short: "中" },
  { id: 2, name: "晚一", short: "一" },
  { id: 3, name: "晚二", short: "二" },
];

const STATUS_CONFIG: Record<
  number,
  { name: string; color: string; bg: string }
> = {
  1: { name: "已到", color: "bg-green-500", bg: "bg-green-50" },
  0: { name: "未到", color: "bg-red-500", bg: "bg-red-50" },
  2: { name: "请假", color: "bg-amber-500", bg: "bg-amber-50" },
  3: { name: "晚到", color: "bg-blue-500", bg: "bg-blue-50" },
};

// --- Memoized Components ---

const AttendanceCell = memo(
  ({
    studentId,
    day,
    dayRecords,
    isSatSun,
    isEditMode,
    isUpdating,
    onUpdateStatus,
    date, // Added pre-parsed date
    selectedPeriodIds,
    isSelected,
    onMouseDown,
    onMouseEnter,
  }: {
    studentId: string;
    day: string;
    dayRecords: Record<number, number>;
    isSatSun: boolean;
    isEditMode: boolean;
    isUpdating: boolean;
    onUpdateStatus: (
      studentId: string,
      day: string,
      periodId: number,
      status: number
    ) => void;
    date: Date; // Added pre-parsed date
    selectedPeriodIds: number[];
    isSelected: boolean;
    onMouseDown: (studentId: string, day: string) => void;
    onMouseEnter: (studentId: string, day: string) => void;
  }) => {
    const [hovered, setHovered] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<number | null>(null);

    const activePeriods = PERIODS.filter((p) =>
      selectedPeriodIds.includes(p.id)
    );

    const cellGrid = (
      <div
        className={cn(
          "grid gap-0.5 w-full h-full mx-auto",
          activePeriods.length === 1 ? "grid-cols-1" : "grid-cols-2",
          activePeriods.length <= 2 ? "grid-rows-1" : "grid-rows-2",
          activePeriods.length === 1 ? "max-w-[24px]" : "max-w-[36px]"
        )}
      >
        {activePeriods.map((period) => {
          const status = dayRecords[period.id];
          const config = status !== undefined ? STATUS_CONFIG[status] : null;

          return (
            <div
              key={period.id}
              onClick={(e) => {
                if (isEditMode) {
                  e.stopPropagation();
                  setEditingPeriod(period.id);
                }
              }}
              className={cn(
                "rounded-[1px] transition-all w-full h-full min-h-[12px]",
                config ? config.color : "bg-muted",
                isEditMode
                  ? "hover:scale-125 cursor-pointer ring-1 ring-white/50"
                  : "cursor-help",
                isUpdating && "animate-pulse opacity-50"
              )}
            />
          );
        })}
      </div>
    );

    // 统一渲染稳定的 td
    return (
      <td
        onPointerEnter={() => {
          if (!isEditMode) {
            setHovered(true);
          } else {
            onMouseEnter(studentId, day);
          }
        }}
        onPointerLeave={() => setHovered(false)}
        onMouseDown={() => isEditMode && onMouseDown(studentId, day)}
        className={cn(
          "border-r border-b p-1 text-center min-w-[44px] h-12 transition-colors relative select-none",
          isSatSun && "bg-muted/30",
          isEditMode && "hover:bg-primary/5 cursor-crosshair",
          isSelected && "bg-primary/20 ring-2 ring-primary ring-inset z-10"
        )}
      >
        {isEditMode ? (
          <Popover
            open={editingPeriod !== null}
            onOpenChange={(open) => !open && setEditingPeriod(null)}
          >
            <PopoverTrigger asChild>
              <div className="w-full h-full">{cellGrid}</div>
            </PopoverTrigger>
            {editingPeriod !== null && (
              <PopoverContent
                side="top"
                className="w-32 p-1 flex flex-col gap-1"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                  修改 {PERIODS.find((p) => p.id === editingPeriod)?.name} 状态
                </div>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    className="h-8 justify-start gap-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(
                        studentId,
                        day,
                        editingPeriod,
                        Number(key)
                      );
                      setEditingPeriod(null);
                    }}
                  >
                    <div className={cn("w-2 h-2 rounded-full", cfg.color)} />
                    {cfg.name}
                  </Button>
                ))}
                <div className="border-t my-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start gap-2 text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(studentId, day, editingPeriod, -1);
                    setEditingPeriod(null);
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  取消标注
                </Button>
              </PopoverContent>
            )}
          </Popover>
        ) : (
          <Tooltip open={hovered}>
            <TooltipTrigger asChild>
              <div className="w-full h-full">{cellGrid}</div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="p-3 min-w-[140px] pointer-events-none"
            >
              <div className="space-y-2">
                <div className="font-bold border-b pb-1 mb-1 text-xs text-muted-foreground">
                  {format(date, "MM月dd日")} (
                  {format(date, "eee", { locale: zhCN })})
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {PERIODS.map((p) => {
                    const isSelected = selectedPeriodIds.includes(p.id);
                    const status = dayRecords[p.id];
                    const config =
                      status !== undefined ? STATUS_CONFIG[status] : null;
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          "flex items-center justify-between text-[11px]",
                          !isSelected && "opacity-30"
                        )}
                      >
                        <span className="text-muted-foreground">{p.name}:</span>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              config ? config.color : "bg-border"
                            )}
                          />
                          <span
                            className={cn(
                              "font-medium",
                              config ? "text-foreground" : "text-muted-foreground/50"
                            )}
                          >
                            {config ? config.name : "无"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </td>
    );
  }
);
AttendanceCell.displayName = "AttendanceCell";

const AttendanceRow = memo(
  ({
    student,
    daysWithInfo, // Changed from days
    matrix,
    isEditMode,
    rowUpdatingCell,
    onUpdateStatus,
    onBatchUpdate,
    selectedPeriodIds,
    onExportStudent,
    selectedDays,
    onCellMouseDown,
    onCellMouseEnter,
  }: {
    student: Student;
    daysWithInfo: { day: string; date: Date; isSatSun: boolean }[]; // Changed type
    matrix: Record<string, Record<number, number>>;
    isEditMode: boolean;
    rowUpdatingCell: string | null;
    onUpdateStatus: (
      studentId: string,
      day: string,
      periodId: number,
      status: number
    ) => void;
    onBatchUpdate: (
      type: "student" | "day",
      id: string,
      status: number
    ) => void;
    selectedPeriodIds: number[];
    onExportStudent: (student: Student) => void;
    selectedDays: string[] | null;
    onCellMouseDown: (studentId: string, day: string) => void;
    onCellMouseEnter: (studentId: string, day: string) => void;
  }) => {
    return (
      <tr className="transition-colors group hover:bg-primary/5">
        <td
          className={cn(
            "sticky left-0 z-20 border-r border-b p-4 font-medium shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-colors",
            "bg-card text-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:font-bold",
            "flex items-center justify-between"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {isEditMode ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="truncate hover:text-primary transition-colors">
                    {student.name}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1" side="right">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-b mb-1">
                    该生本月全设为...
                  </div>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 h-8 text-xs"
                      onClick={() =>
                        onBatchUpdate("student", student.id, Number(key))
                      }
                    >
                      <div className={cn("w-2 h-2 rounded-full", cfg.color)} />
                      {cfg.name}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
            ) : (
              <span className="truncate">{student.name}</span>
            )}
          </div>

          {!isEditMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  onClick={() => onExportStudent(student)}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">导出该生记录</TooltipContent>
            </Tooltip>
          )}
        </td>
        {daysWithInfo.map(({ day, date, isSatSun }) => {
          const dayRecords = matrix[day] || {};
          return (
            <AttendanceCell
              key={day}
              studentId={student.id}
              day={day}
              dayRecords={dayRecords}
              isSatSun={isSatSun}
              isEditMode={isEditMode}
              isUpdating={
                rowUpdatingCell?.startsWith(`${student.id}-${day}`) ?? false
              }
              onUpdateStatus={onUpdateStatus}
              date={date}
              selectedPeriodIds={selectedPeriodIds}
              isSelected={selectedDays?.includes(day) ?? false}
              onMouseDown={onCellMouseDown}
              onMouseEnter={onCellMouseEnter}
            />
          );
        })}
      </tr>
    );
  }
);
AttendanceRow.displayName = "AttendanceRow";

// --- 移动端：按学生卡片 + 横向滚动日格 ---
type DayInfo = {
  day: string;
  date: Date;
  isSatSun: boolean;
  formattedDay: string;
  formattedWeekday: string;
};

const MobileDayCell = memo(
  ({
    studentId,
    day,
    dayRecords,
    date,
    isSatSun,
    isEditMode,
    onUpdateStatus,
    isUpdating,
    selectedPeriodIds,
  }: {
    studentId: string;
    day: string;
    dayRecords: Record<number, number>;
    date: Date;
    isSatSun: boolean;
    isEditMode: boolean;
    onUpdateStatus: (
      studentId: string,
      day: string,
      periodId: number,
      status: number
    ) => void;
    isUpdating: boolean;
    selectedPeriodIds: number[];
  }) => {
    const [open, setOpen] = useState(false);
    const activePeriods = PERIODS.filter((p) => selectedPeriodIds.includes(p.id));
    const content = (
      <div
        className={cn(
          "flex flex-col items-center justify-center w-10 flex-shrink-0 py-1.5 px-0.5 border-r border-border/60 last:border-r-0",
          isSatSun && "bg-muted/40"
        )}
      >
        <span
          className={cn(
            "text-[10px] font-bold leading-none",
            isSatSun ? "text-red-500" : "text-muted-foreground"
          )}
        >
          {format(date, "d")}
        </span>
        <div
          className={cn(
            "grid gap-0.5 mt-1 w-full justify-center",
            activePeriods.length === 1 ? "grid-cols-1" : "grid-cols-2",
            activePeriods.length <= 2 ? "grid-rows-1" : "grid-rows-2"
          )}
        >
          {activePeriods.map((p) => {
            const status = dayRecords[p.id];
            const config = status !== undefined ? STATUS_CONFIG[status] : null;
            return (
              <div
                key={p.id}
                className={cn(
                  "w-2.5 h-2.5 rounded-[2px]",
                  config ? config.color : "bg-muted/80"
                )}
              />
            );
          })}
        </div>
      </div>
    );

    if (!isEditMode) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("min-h-[52px]", isUpdating && "opacity-60")}>
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {format(date, "M月d日 eee", { locale: zhCN })}
            <div className="mt-1.5 space-y-1">
              {(selectedPeriodIds.length ? PERIODS.filter((p) => selectedPeriodIds.includes(p.id)) : PERIODS).map((p) => {
                const status = dayRecords[p.id];
                const config = status !== undefined ? STATUS_CONFIG[status] : null;
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground w-6">{p.name}</span>
                    <span className="font-medium">{config ? config.name : "无"}</span>
                  </div>
                );
              })}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "min-h-[52px] text-left active:bg-primary/10 transition-colors rounded",
              isUpdating && "opacity-60 animate-pulse"
            )}
          >
            {content}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="center"
          className="w-52 p-3 max-w-[calc(100vw-2rem)]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {format(date, "M月d日 eee", { locale: zhCN })}
          </div>
          <div className="space-y-3">
            {activePeriods.map((period) => {
              const status = dayRecords[period.id];
              const config = status !== undefined ? STATUS_CONFIG[status] : null;
              return (
                <div key={period.id} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-7 shrink-0">{period.name}</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        className={cn(
                          "h-7 min-w-[2.25rem] rounded-md text-[10px] font-medium transition-colors flex items-center justify-center gap-1",
                          status === Number(key)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/80 hover:bg-muted text-foreground"
                        )}
                        onClick={() => {
                          onUpdateStatus(studentId, day, period.id, Number(key));
                        }}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.color, status === Number(key) && "bg-primary-foreground/80")} />
                        {cfg.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="h-7 w-7 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground flex items-center justify-center shrink-0"
                      onClick={() => onUpdateStatus(studentId, day, period.id, -1)}
                      title="清空"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
MobileDayCell.displayName = "MobileDayCell";

export default function AttendanceHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const classCode = params?.id as string;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [updatingCell, setUpdatingCell] = useState<string | null>(null); // studentId-day-periodId
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<number[]>(
    PERIODS.map((p) => p.id)
  );

  // --- OCR State ---
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<any[] | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [ocrTargetDate, setOcrTargetDate] = useState<Date>(new Date());
  const [ocrTargetPeriods, setOcrTargetPeriods] = useState<number[]>([
    0, 1, 2, 3,
  ]);

  const togglePeriod = (periodId: number) => {
    setSelectedPeriodIds((prev) =>
      prev.includes(periodId)
        ? prev.filter((id) => id !== periodId)
        : [...prev, periodId]
    );
  };

  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOcrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOcrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const preprocessImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          // 适度放大图片以提高识别率
          const scale = 1.5;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // 绘制并应用灰度处理
          ctx.filter = "grayscale(100%) contrast(150%) brightness(110%)";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 二值化处理（简单的阈值）
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const threshold = 128;
            const val = avg > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
          }
          ctx.putImageData(imageData, 0, 0);

          resolve(canvas.toDataURL("image/png"));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStartOcr = async () => {
    if (!ocrFile) return;
    setIsOcrProcessing(true);
    try {
      // 1. 预处理图片：提高对比度、转为黑白，放大尺寸
      const processedImageData = await preprocessImage(ocrFile);

      // 2. 在浏览器端执行 Tesseract.js 识别
      const result = await Tesseract.recognize(processedImageData, "chi_sim", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`识别进度: ${(m.progress * 100).toFixed(0)}%`);
          }
        },
      });
      // 注意：如果需要更精细的控制，可以使用 createWorker，但 recognize 简单有效
      // 这里的 PSM 默认是 3 (Auto)，对于列表，通常表现尚可。
      // 如果依然不准，建议切换到 createWorker 并设置 tessedit_pageseg_mode 为 4 或 6。

      const fullText = result.data.text;
      console.log("Tesseract Raw Text:", fullText);

      // 3. 将识别出的文本发送到后端进行模糊姓名匹配和状态解析
      const response = await fetch(`/api/attendance/history/${classCode}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullText,
        }),
      });

      if (!response.ok) throw new Error("识别结果解析失败");

      const parsedData = await response.json();

      if (parsedData.success && parsedData.results) {
        setOcrResults(parsedData.results);
        setIsVerifying(true);
        toast.success("识别成功，请核对数据");
      } else {
        throw new Error(parsedData.error || "识别失败");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "识别过程出错");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleApplyOcr = async () => {
    if (!ocrResults || !ocrTargetDate) return;

    try {
      setLoading(true);
      const dateStr = format(ocrTargetDate, "yyyy-MM-dd");

      const response = await fetch(
        `/api/attendance/history/${classCode}/ocr/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateStr,
            periods: ocrTargetPeriods,
            results: ocrResults,
          }),
        }
      );

      if (!response.ok) throw new Error("批量应用识别结果失败");

      await fetchData();
      toast.success("考勤识别结果已应用");
      setIsOcrDialogOpen(false);
      setIsVerifying(false);
      setOcrResults(null);
      setOcrFile(null);
      setOcrPreview(null);
    } catch (error) {
      console.error(error);
      toast.error("应用识别结果失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/attendance/history/${classCode}`;

      if (dateRange?.from && dateRange?.to) {
        const start = format(dateRange.from, "yyyy-MM-dd");
        const end = format(dateRange.to, "yyyy-MM-dd");
        url += `?startDate=${start}&endDate=${end}`;
      } else if (dateRange?.from) {
        // 如果只选了开始日期，默认查询该月份
        const monthStr = format(dateRange.from, "yyyy-MM");
        url += `?month=${monthStr}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("获取数据失败");
      const resData = await response.json();

      // 根据 student_order 对学生进行排序
      if (
        resData.students &&
        resData.student_order &&
        resData.student_order.length > 0
      ) {
        const orderMap = new Map<string, number>(
          resData.student_order.map((id: string, index: number) => [id, index])
        );
        resData.students.sort((a: Student, b: Student) => {
          const indexA = orderMap.get(a.id);
          const indexB = orderMap.get(b.id);

          if (typeof indexA === "number" && typeof indexB === "number")
            return indexA - indexB;
          if (typeof indexA === "number") return -1;
          if (typeof indexB === "number") return 1;
          return 0;
        });
      }

      setData(resData);
    } catch (error) {
      console.error(error);
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [classCode, dateRange]);

  // --- Selection State ---
  const [selectionStart, setSelectionStart] = useState<{
    studentId: string;
    day: string;
  } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{
    studentId: string;
    day: string;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleCellMouseDown = useCallback(
    (studentId: string, day: string) => {
      if (!isEditMode) return;
      setSelectionStart({ studentId, day });
      setSelectionEnd({ studentId, day });
      setIsSelecting(true);
    },
    [isEditMode]
  );

  const handleCellMouseEnter = useCallback(
    (studentId: string, day: string) => {
      if (!isSelecting) return;
      setSelectionEnd({ studentId, day });
    },
    [isSelecting]
  );

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  // --- Range Calculation ---
  const selectedRange = useMemo(() => {
    if (!selectionStart || !selectionEnd || !data) return null;

    const studentIds = data.students.map((s) => s.id);
    const days = data.days;

    const startIdxS = studentIds.indexOf(selectionStart.studentId);
    const endIdxS = studentIds.indexOf(selectionEnd.studentId);
    const startIdxD = days.indexOf(selectionStart.day);
    const endIdxD = days.indexOf(selectionEnd.day);

    if (
      startIdxS === -1 ||
      endIdxS === -1 ||
      startIdxD === -1 ||
      endIdxD === -1
    ) {
      return null;
    }

    const minIdxS = Math.min(startIdxS, endIdxS);
    const maxIdxS = Math.max(startIdxS, endIdxS);
    const minIdxD = Math.min(startIdxD, endIdxD);
    const maxIdxD = Math.max(startIdxD, endIdxD);

    const selectedStudentIds = studentIds.slice(minIdxS, maxIdxS + 1);
    const selectedDays = days.slice(minIdxD, maxIdxD + 1);

    return {
      studentIds: selectedStudentIds,
      days: selectedDays,
    };
  }, [selectionStart, selectionEnd, data]);

  const handleRangeUpdate = useCallback(
    async (targetStatus: number) => {
      if (!selectedRange || !isEditMode) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/attendance/history/${classCode}/batch`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "range",
              studentIds: selectedRange.studentIds,
              dates: selectedRange.days,
              periods: selectedPeriodIds,
              status: targetStatus,
            }),
          }
        );

        if (!response.ok) throw new Error("批量更新失败");

        await fetchData();
        toast.success(
          targetStatus === -1 ? "已取消选中区域的标注" : "区域标注成功"
        );
        clearSelection();
      } catch (error) {
        console.error(error);
        toast.error("区域更新失败");
      } finally {
        setLoading(false);
      }
    },
    [
      selectedRange,
      isEditMode,
      classCode,
      fetchData,
      clearSelection,
      selectedPeriodIds,
    ]
  );

  useEffect(() => {
    if (!isEditMode) {
      clearSelection();
    }
  }, [isEditMode, clearSelection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => {
    if (!dateRange?.from) return;
    const prevMonth = subMonths(dateRange.from, 1);
    setDateRange({
      from: startOfMonth(prevMonth),
      to: endOfMonth(prevMonth),
    });
  };

  const handleNextMonth = () => {
    if (!dateRange?.from) return;
    const nextMonth = addMonths(dateRange.from, 1);
    setDateRange({
      from: startOfMonth(nextMonth),
      to: endOfMonth(nextMonth),
    });
  };

  const handleClearData = async () => {
    try {
      if (!dateRange?.from || !dateRange?.to) {
        toast.error("请先选择完整的日期范围");
        return;
      }

      const startStr = format(dateRange.from, "yyyy-MM-dd");
      const endStr = format(dateRange.to, "yyyy-MM-dd");

      const response = await fetch(
        `/api/attendance/history/${classCode}?startDate=${startStr}&endDate=${endStr}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("清除数据失败");

      toast.success(`已清除 ${startStr} 至 ${endStr} 的历史数据`);
      fetchData(); // 重新加载数据
    } catch (error) {
      console.error(error);
      toast.error("清除数据失败");
    }
  };

  const daysWithInfo = useMemo(() => {
    if (!data?.days) return [];
    return data.days.map((day) => {
      const date = parseISO(day);
      return {
        day,
        date,
        isSatSun: isWeekend(date),
        formattedDay: format(date, "d"),
        formattedWeekday: format(date, "eee", { locale: zhCN }),
      };
    });
  }, [data?.days]);

  const handleUpdateStatus = useCallback(
    async (
      studentId: string,
      day: string,
      periodId: number,
      targetStatus: number
    ) => {
      if (!isEditMode) return;

      const cellId = `${studentId}-${day}-${periodId}`;
      setUpdatingCell(cellId);

      try {
        const response = await fetch(`/api/attendance/history/${classCode}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: day,
            period: periodId,
            student_id: studentId,
            status: targetStatus,
          }),
        });

        if (!response.ok) throw new Error("更新失败");

        // 乐观更新本地数据
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            matrix: {
              ...prev.matrix,
              [studentId]: {
                ...(prev.matrix[studentId] || {}),
                [day]: {
                  ...(prev.matrix[studentId]?.[day] || {}),
                  [periodId]: targetStatus,
                },
              },
            },
          };
        });

        toast.success("已修改考勤状态");
      } catch (error) {
        console.error(error);
        toast.error("修改失败");
      } finally {
        setUpdatingCell(null);
      }
    },
    [classCode, isEditMode]
  );

  const handleBatchUpdate = useCallback(
    async (
      type: "student" | "day" | "all",
      id: string,
      targetStatus: number
    ) => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/attendance/history/${classCode}/batch`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              id,
              status: targetStatus,
            }),
          }
        );

        if (!response.ok) throw new Error("批量更新失败");

        // 重新加载数据以确保同步
        await fetchData();
        toast.success("批量更新成功");
      } catch (error) {
        console.error(error);
        toast.error("批量更新失败");
      } finally {
        setLoading(false);
      }
    },
    [classCode, fetchData, isEditMode]
  );

  const exportToExcel = () => {
    if (!data) return;
    try {
      const activePeriods = PERIODS.filter((p) =>
        selectedPeriodIds.includes(p.id)
      );

      // 符号映射
      const SYMBOLS: Record<number, string> = {
        1: "√", // 已到
        0: "×", // 未到
        2: "○", // 请假
        3: "△", // 晚到
      };

      // 准备统计列标题 (按时段细分，固定状态顺序: 已到, 晚到, 请假, 未到)
      const statHeaders: string[] = [];
      const statusOrder = [1, 3, 2, 0]; // 已到, 晚到, 请假, 未到

      activePeriods.forEach((p) => {
        statusOrder.forEach((k) => {
          if (STATUS_CONFIG[k]) {
            statHeaders.push(`${p.name}-${STATUS_CONFIG[k].name}`);
          }
        });
      });

      const headers = [
        "序号",
        "学生姓名",
        ...statHeaders,
        ...data.days.map((d) => format(parseISO(d), "MM/dd")),
      ];

      const rows = data.students.map((student, index) => {
        // 初始化分时段统计数据: { [periodId]: { [statusId]: count } }
        const periodStats: Record<number, Record<number, number>> = {};
        activePeriods.forEach((p) => {
          periodStats[p.id] = {};
          Object.keys(STATUS_CONFIG).forEach((k) => {
            periodStats[p.id][Number(k)] = 0;
          });
        });

        const attendanceData = data.days.map((day) => {
          const dayRecords = data.matrix[student.id]?.[day] || {};
          return activePeriods
            .map((p) => {
              const status = dayRecords[p.id];
              if (status !== undefined) {
                // 仅统计当前选中的时段
                if (periodStats[p.id]) {
                  periodStats[p.id][status] =
                    (periodStats[p.id][status] || 0) + 1;
                }
                return SYMBOLS[status] || "-";
              }
              return "-";
            })
            .join("/");
        });

        // 展平统计数据
        const flatStats: number[] = [];
        activePeriods.forEach((p) => {
          statusOrder.forEach((k) => {
            flatStats.push(periodStats[p.id][k] || 0);
          });
        });

        return [index + 1, student.name, ...flatStats, ...attendanceData];
      });

      const dateRangeStr =
        dateRange?.from && dateRange?.to
          ? `${format(dateRange.from, "yyyy/MM/dd")} - ${format(
              dateRange.to,
              "yyyy/MM/dd"
            )}`
          : data.month;

      const periodStr =
        selectedPeriodIds.length === PERIODS.length
          ? "全天时段"
          : activePeriods.map((p) => p.name).join("+");

      // 构建工作表数据 (AOA - Array of Arrays)
      const sheetData = [
        [`${data.className} 考勤历史统计报表`], // R1: 大标题
        [
          `统计范围: ${dateRangeStr}`,
          "",
          "",
          `时段: ${periodStr}`,
          "",
          "",
          `导出日期: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
        ], // R2: 元数据
        [
          `图例说明: ${Object.entries(STATUS_CONFIG)
            .map(([k, v]) => `${SYMBOLS[Number(k)]}: ${v.name}`)
            .join("  ")}`,
        ], // R3: 图例
        [], // R4: 空行
        headers, // R5: 表头
        ...rows, // R6+: 数据
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // 设置列宽 (粗略估计)
      const wscols = [
        { wch: 6 }, // 序号
        { wch: 12 }, // 姓名
        ...statHeaders.map(() => ({ wch: 10 })), // 统计列 (时段-状态 较长)
        ...data.days.map(() => ({ wch: 8 })), // 日期列
      ];
      ws["!cols"] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "班级考勤");
      XLSX.writeFile(
        wb,
        `${data.className}_考勤历史_${format(new Date(), "yyyyMMdd")}.xlsx`
      );
      toast.success("全班报表导出成功");
    } catch (error) {
      console.error(error);
      toast.error("导出失败");
    }
  };

  const exportStudentToExcel = useCallback(
    (student: Student) => {
      if (!data) return;
      try {
        const activePeriods = PERIODS.filter((p) =>
          selectedPeriodIds.includes(p.id)
        );

        const SYMBOLS: Record<number, string> = {
          1: "√",
          0: "×",
          2: "○",
          3: "△",
        };

        // 初始化分时段统计数据: { [periodId]: { [statusId]: count } }
        const periodStats: Record<number, Record<number, number>> = {};
        activePeriods.forEach((p) => {
          periodStats[p.id] = {};
          Object.keys(STATUS_CONFIG).forEach((k) => {
            periodStats[p.id][Number(k)] = 0;
          });
        });

        const headers = ["日期", "星期", ...activePeriods.map((p) => p.name)];

        const rows = data.days.map((day) => {
          const date = parseISO(day);
          const dayRecords = data.matrix[student.id]?.[day] || {};
          const row = [
            format(date, "yyyy/MM/dd"),
            format(date, "eee", { locale: zhCN }),
          ];

          activePeriods.forEach((p) => {
            const status = dayRecords[p.id];
            if (status !== undefined) {
              if (periodStats[p.id]) {
                periodStats[p.id][status] =
                  (periodStats[p.id][status] || 0) + 1;
              }
              row.push(`${SYMBOLS[status]} ${STATUS_CONFIG[status]?.name}`);
            } else {
              row.push("-");
            }
          });
          return row;
        });

        const dateRangeStr =
          dateRange?.from && dateRange?.to
            ? `${format(dateRange.from, "yyyy/MM/dd")} - ${format(
                dateRange.to,
                "yyyy/MM/dd"
              )}`
            : data.month;

        // 生成分时段汇总统计行
        const statusOrder = [1, 3, 2, 0];
        const periodStatsRows = activePeriods.map((p) => {
          const statsStr = statusOrder
            .map(
              (k) => `${STATUS_CONFIG[k].name}: ${periodStats[p.id][k] || 0}次`
            )
            .join(" | ");
          return [`${p.name}统计:`, "", statsStr];
        });

        // 总体汇总
        const totalStats: Record<number, number> = {};
        statusOrder.forEach((k) => {
          totalStats[k] = activePeriods.reduce(
            (acc, p) => acc + (periodStats[p.id][k] || 0),
            0
          );
        });
        const totalStatsStr = statusOrder
          .map((k) => `${STATUS_CONFIG[k].name}: ${totalStats[k] || 0}次`)
          .join(" | ");

        const sheetData = [
          [`${student.name} 个人考勤详细记录表`],
          [`班级: ${data.className}`, "", `统计范围: ${dateRangeStr}`],
          [`导出时间: ${format(new Date(), "yyyy-MM-dd HH:mm")}`],
          [],
          ["考勤分时段汇总:"],
          ...periodStatsRows,
          ["总计汇总:", "", totalStatsStr],
          [],
          headers,
          ...rows,
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws["!cols"] = [
          { wch: 15 }, // 日期
          { wch: 10 }, // 星期
          ...activePeriods.map(() => ({ wch: 12 })), // 时段
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "个人明细");
        XLSX.writeFile(
          wb,
          `${data.className}_${student.name}_考勤明细_${format(
            new Date(),
            "yyyyMMdd"
          )}.xlsx`
        );
        toast.success(`${student.name} 的明细已导出`);
      } catch (error) {
        console.error(error);
        toast.error("导出失败");
      }
    },
    [data, selectedPeriodIds, dateRange]
  );

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">正在加载历史报表数据...</p>
      </div>
    );
  }

  if (!data || data.students.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto space-y-6 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg shadow-sm border">
            <Button variant="ghost" size="sm" className="h-8 shrink-0" onClick={() => router.back()}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <h1 className="text-sm font-bold text-foreground">
              未找到考勤记录
            </h1>
          </div>
          <Card className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Trash2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">
                该时间段内暂无确认的报表
              </h3>
              <p className="text-muted-foreground">
                请先在考勤页面点击“确认并复制报告”来保存当天的考勤快照，或选择其他日期范围。
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={handlePrevMonth}>
                查看上个月
              </Button>
              <Button onClick={() => router.back()}>返回考勤页</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 min-w-0 overflow-x-hidden">
      <PageHeader showBack />

      <div className="max-w-[1600px] mx-auto space-y-6 min-w-0">
        {/* 页面工具栏：班级名 + 时段 + 日期 + 操作 */}
        <div className="bg-card rounded-lg shadow-sm border min-w-0 overflow-hidden relative z-10">
          {/* 移动端：两行 */}
          <div className="md:hidden flex flex-col gap-0 touch-manipulation">
            <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2 min-w-0">
              <HistoryIcon className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm font-semibold text-foreground truncate">{data?.className} 考勤历史</p>
            </div>
            {/* 第 2 行：时段筛选（委托 pointerdown 优先响应触摸，避免被下方滚动抢占） */}
            <div
              className="px-3 py-2 border-b border-border/40 relative z-20 bg-card"
              onPointerDown={(e) => {
                const target = (e.target as HTMLElement).closest("[data-period-id]");
                if (target) {
                  e.preventDefault();
                  e.stopPropagation();
                  const id = Number((target as HTMLElement).getAttribute("data-period-id"));
                  if (!Number.isNaN(id)) togglePeriod(id);
                }
              }}
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-8 shrink-0">时段</span>
                <div className="flex flex-1 gap-1 min-w-0">
                  {PERIODS.map((p) => (
                    <span
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      data-period-id={p.id}
                      className={cn(
                        "flex-1 min-w-[2.5rem] h-9 flex items-center justify-center text-xs rounded-lg font-medium transition-colors select-none cursor-pointer",
                        selectedPeriodIds.includes(p.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/80 text-muted-foreground active:bg-muted"
                      )}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          togglePeriod(p.id);
                        }
                      }}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* 第 3 行：日期切换 */}
            <div className="px-3 py-2 flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg" onClick={handlePrevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 min-w-0 h-9 font-medium text-xs justify-center gap-1.5"
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    {dateRange?.from
                      ? dateRange.to
                        ? isSameMonth(dateRange.from, dateRange.to) &&
                          isSameDay(dateRange.from, startOfMonth(dateRange.from)) &&
                          isSameDay(dateRange.to, endOfMonth(dateRange.to))
                          ? format(dateRange.from, "yyyy年M月")
                          : `${format(dateRange.from, "M.d")}～${format(dateRange.to, "M.d")}`
                        : format(dateRange.from, "M月d日")
                      : "选择范围"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg" onClick={handleNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-3 py-2 flex flex-wrap gap-2 border-t border-border/40">
              <Button variant={isEditMode ? "default" : "outline"} size="sm" className="h-8 text-xs gap-1.5" onClick={() => setIsEditMode(!isEditMode)}>
                {isEditMode ? <Check className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                {isEditMode ? "完成修改" : "修改考勤"}
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setIsOcrDialogOpen(true)}>
                <Camera className="h-3.5 w-3.5" /> 照片识别
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportToExcel}>
                <Download className="h-3.5 w-3.5" /> 导出报表
              </Button>
            </div>
          </div>

          {/* 桌面端：单行导航 */}
          <div className="hidden md:flex flex-row flex-wrap items-center justify-between gap-4 p-4 lg:p-6">
            <div className="flex items-center gap-2 min-w-0">
              <HistoryIcon className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-foreground truncate">{data?.className} 考勤历史</h1>
                <p className="text-muted-foreground text-xs">月度考勤统计报表</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:gap-3 min-w-0">
              <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
                {PERIODS.map((p) => (
                  <Button
                    key={p.id}
                    variant={selectedPeriodIds.includes(p.id) ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-7 px-3 text-xs rounded-md transition-all",
                      selectedPeriodIds.includes(p.id)
                        ? "bg-card text-primary shadow-sm hover:bg-card"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => togglePeriod(p.id)}
                  >
                    {p.name}
                  </Button>
                ))}
              </div>

              <div className="h-6 w-px bg-border mx-1 shrink-0" />

              <div className="flex items-center bg-muted rounded-lg p-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-4 font-medium min-w-[140px] text-center h-8 flex items-center gap-2 text-xs"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {dateRange?.from
                        ? dateRange.to
                          ? isSameMonth(dateRange.from, dateRange.to) &&
                            isSameDay(dateRange.from, startOfMonth(dateRange.from)) &&
                            isSameDay(dateRange.to, endOfMonth(dateRange.to))
                            ? format(dateRange.from, "yyyy年MM月")
                            : `${format(dateRange.from, "MM.dd")} - ${format(dateRange.to, "MM.dd")}`
                          : format(dateRange.from, "MM月dd日")
                        : "选择范围"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={zhCN}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 gap-2 text-xs",
                  isEditMode && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                {isEditMode ? "完成修改" : "修改考勤"}
              </Button>

              <Dialog open={isOcrDialogOpen} onOpenChange={setIsOcrDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                    <Camera className="h-4 w-4" />
                    照片识别
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>照片识别考勤</DialogTitle>
                  <DialogDescription>
                    上传纸质考勤表照片，系统将自动识别学生姓名与出勤状态。
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {isVerifying && ocrResults ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase">
                          识别结果核对
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setIsVerifying(false)}
                        >
                          重新上传
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">
                            应用日期
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-xs h-8 bg-card"
                              >
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {format(ocrTargetDate, "yyyy-MM-dd")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={ocrTargetDate}
                                onSelect={(date) =>
                                  date && setOcrTargetDate(date)
                                }
                                locale={zhCN}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">
                            应用时段
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {PERIODS.map((p) => (
                              <Button
                                key={p.id}
                                variant={
                                  ocrTargetPeriods.includes(p.id)
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="h-6 px-2 text-[10px] rounded"
                                onClick={() => {
                                  setOcrTargetPeriods((prev) =>
                                    prev.includes(p.id)
                                      ? prev.filter((id) => id !== p.id)
                                      : [...prev, p.id]
                                  );
                                }}
                              >
                                {p.short}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto border rounded-lg divide-y bg-muted/30">
                        {ocrResults.map((result, index) => (
                          <div
                            key={result.studentId || index}
                            className="p-3 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {index + 1}
                              </div>
                              <div>
                                <div className="text-sm font-medium">
                                  {result.studentName}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  置信度: {(result.confidence * 100).toFixed(1)}
                                  %
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center bg-muted rounded-lg p-0.5">
                              {Object.entries(STATUS_CONFIG).map(
                                ([key, cfg]) => (
                                  <Button
                                    key={key}
                                    variant={
                                      result.recognizedStatus === Number(key)
                                        ? "default"
                                        : "ghost"
                                    }
                                    size="sm"
                                    className={cn(
                                      "h-7 px-2 text-[10px] rounded-md transition-all",
                                      result.recognizedStatus === Number(key)
                                        ? "bg-card text-primary shadow-sm hover:bg-card"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => {
                                      const newResults = [...ocrResults];
                                      newResults[index].recognizedStatus =
                                        Number(key);
                                      setOcrResults(newResults);
                                    }}
                                  >
                                    {cfg.name}
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                        提示：点击状态按钮可以手动修正识别结果。确认无误后点击下方“应用到表格”按钮。
                      </div>
                    </div>
                  ) : !ocrPreview ? (
                    <div className="border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleOcrFileChange}
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            点击或拖拽上传照片
                          </p>
                          <p className="text-xs text-muted-foreground">
                            支持 JPG, PNG 格式，建议拍摄清晰的表格正视图
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
                        <img
                          src={ocrPreview}
                          alt="OCR Preview"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/80 backdrop-blur shadow-sm hover:bg-card"
                          onClick={() => {
                            setOcrFile(null);
                            setOcrPreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="h-3 w-3 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium text-amber-900">
                        识别说明
                      </p>
                      <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
                        <li>系统将根据表格布局自动匹配当前月份的学生</li>
                        <li>支持识别打钩、打叉、圆圈等常见考勤标记</li>
                        <li>识别完成后您可以在对比界面进行手动修正</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsOcrDialogOpen(false)}
                    disabled={isOcrProcessing}
                  >
                    取消
                  </Button>
                  {isVerifying ? (
                    <Button
                      onClick={handleApplyOcr}
                      disabled={ocrTargetPeriods.length === 0}
                      className="min-w-[100px] bg-green-600 hover:bg-green-700"
                    >
                      应用到表格
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStartOcr}
                      disabled={!ocrFile || isOcrProcessing}
                      className="min-w-[100px]"
                    >
                      {isOcrProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          识别中...
                        </>
                      ) : (
                        "开始识别"
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={exportToExcel}
            >
              <Download className="h-4 w-4" />
              导出报表
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  清除数据
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认清除历史数据？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将永久删除{" "}
                    {dateRange?.from
                      ? format(dateRange.from, "yyyy年MM月dd日")
                      : ""}
                    {dateRange?.to
                      ? ` 至 ${format(dateRange.to, "yyyy年MM月dd日")}`
                      : ""}
                    的所有已确认考勤历史记录。此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    确认清除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 sm:gap-6 px-2 py-2 sm:py-1 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 shrink-0" />
            <span>已到</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 shrink-0" />
            <span>未到</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 shrink-0" />
            <span>请假</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 shrink-0" />
            <span>晚到</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-border shrink-0" />
            <span>无记录</span>
          </div>
        </div>

        {/* Selection Toolbar */}
        {selectedRange && isEditMode && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="shadow-md border bg-card/95 backdrop-blur-sm">
              <CardContent className="p-2 flex items-center gap-4">
                <div className="px-3 border-r pr-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase mb-0.5">
                    已选择区域
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {selectedRange.studentIds.length} 名学生 ×{" "}
                    {selectedRange.days.length} 天
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant="ghost"
                      className="h-9 px-3 hover:bg-muted gap-2"
                      onClick={() => handleRangeUpdate(Number(key))}
                    >
                      <div
                        className={cn("w-2.5 h-2.5 rounded-full", cfg.color)}
                      />
                      <span className="text-xs font-medium">{cfg.name}</span>
                    </Button>
                  ))}
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-3 hover:bg-muted gap-2 text-muted-foreground"
                    onClick={() => handleRangeUpdate(-1)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">取消标注</span>
                  </Button>
                </div>

                <div className="pl-2 border-l ml-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-500 text-muted-foreground"
                    onClick={clearSelection}
                    title="取消选择区域"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Matrix Card */}
        <Card className="shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* 移动端：学生卡片 + 横向滚动日格 */}
            <div className="block md:hidden border-b">
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto overflow-x-hidden">
                {data?.students.map((student) => (
                  <div
                    key={student.id}
                    className="border-b border-border/60 last:border-b-0 bg-card"
                  >
                    <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-card border-b border-border/60">
                      <span className="font-semibold text-sm truncate">
                        {student.name}
                      </span>
                      {!isEditMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => exportStudentToExcel(student)}
                        >
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                      <div className="flex min-w-0">
                        {daysWithInfo.map((d: DayInfo) => {
                          const dayRecords = (data?.matrix[student.id] || {})[d.day] || {};
                          return (
                            <MobileDayCell
                              key={d.day}
                              studentId={student.id}
                              day={d.day}
                              dayRecords={dayRecords}
                              date={d.date}
                              isSatSun={d.isSatSun}
                              isEditMode={isEditMode}
                              onUpdateStatus={handleUpdateStatus}
                              isUpdating={
                                updatingCell?.startsWith(`${student.id}-${d.day}`) ?? false
                              }
                              selectedPeriodIds={selectedPeriodIds}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 桌面端：原表格 */}
            <div className="hidden md:block max-h-[calc(100vh-280px)] overflow-auto rounded-xl border relative">
              <TooltipProvider delayDuration={150}>
                <table className="w-full border-separate border-spacing-0 text-sm table-fixed">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="sticky top-0 left-0 z-50 bg-muted/30 border-r border-b p-4 text-left font-semibold text-foreground w-[120px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-between">
                          <span>学生姓名</span>
                          {isEditMode && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-40 p-1"
                                side="bottom"
                                align="start"
                              >
                                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-b mb-1">
                                  全表设为...
                                </div>
                                {Object.entries(STATUS_CONFIG).map(
                                  ([key, cfg]) => (
                                    <Button
                                      key={key}
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start gap-2 h-8 text-xs"
                                      onClick={() =>
                                        handleBatchUpdate(
                                          "all",
                                          "all",
                                          Number(key)
                                        )
                                      }
                                    >
                                      <div
                                        className={cn(
                                          "w-2 h-2 rounded-full",
                                          cfg.color
                                        )}
                                      />
                                      {cfg.name}
                                    </Button>
                                  )
                                )}
                                <div className="border-t my-1" />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground"
                                  onClick={() =>
                                    handleBatchUpdate("all", "all", -1)
                                  }
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  取消全表标注
                                </Button>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </th>
                      {daysWithInfo.map(
                        ({
                          day,
                          isSatSun,
                          formattedDay,
                          formattedWeekday,
                        }: {
                          day: string;
                          isSatSun: boolean;
                          formattedDay: string;
                          formattedWeekday: string;
                        }) => {
                          const headerContent = (
                            <div className="flex flex-col items-center gap-1 py-2">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                {formattedWeekday}
                              </span>
                              <span
                                className={cn(
                                  "text-lg font-bold leading-none",
                                  isSatSun ? "text-red-500" : "text-foreground"
                                )}
                              >
                                {formattedDay}
                              </span>
                            </div>
                          );

                          return (
                            <th
                              key={day}
                              className={cn(
                                "sticky top-0 z-30 border-r border-b min-w-[44px] p-0 font-medium transition-colors bg-muted/30",
                                isSatSun && "bg-muted/30"
                              )}
                            >
                              {isEditMode ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="w-full h-full hover:bg-primary/5 rounded transition-colors">
                                      {headerContent}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-40 p-1">
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-b mb-1">
                                      当日全员设为...
                                    </div>
                                    {Object.entries(STATUS_CONFIG).map(
                                      ([key, cfg]) => (
                                        <Button
                                          key={key}
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-start gap-2 h-8 text-xs"
                                          onClick={() =>
                                            handleBatchUpdate(
                                              "day",
                                              day,
                                              Number(key)
                                            )
                                          }
                                        >
                                          <div
                                            className={cn(
                                              "w-2 h-2 rounded-full",
                                              cfg.color
                                            )}
                                          />
                                          {cfg.name}
                                        </Button>
                                      )
                                    )}
                                    <div className="border-t my-1" />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground"
                                      onClick={() =>
                                        handleBatchUpdate("day", day, -1)
                                      }
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      取消当日标注
                                    </Button>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                headerContent
                              )}
                            </th>
                          );
                        }
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data?.students.map((student) => (
                      <AttendanceRow
                        key={student.id}
                        student={student}
                        daysWithInfo={daysWithInfo}
                        matrix={data.matrix[student.id] || {}}
                        isEditMode={isEditMode}
                        rowUpdatingCell={
                          updatingCell?.startsWith(student.id)
                            ? updatingCell
                            : null
                        }
                        onUpdateStatus={handleUpdateStatus}
                        onBatchUpdate={handleBatchUpdate}
                        selectedPeriodIds={selectedPeriodIds}
                        onExportStudent={exportStudentToExcel}
                        selectedDays={
                          selectedRange?.studentIds.includes(student.id)
                            ? selectedRange.days
                            : null
                        }
                        onCellMouseDown={handleCellMouseDown}
                        onCellMouseEnter={handleCellMouseEnter}
                      />
                    ))}
                  </tbody>
                </table>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
