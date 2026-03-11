"use client";

import copy from "copy-to-clipboard";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";

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
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Student, AnnouncementItem } from "./types";
import AttendanceStats from "./components/AttendanceStats";
import AnnouncementManager from "./components/AnnouncementManager";
import StudentAttendanceList from "./components/StudentAttendanceList";
import AttendanceLoading from "./components/AttendanceLoading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  RefreshCw,
  FileText,
  History as HistoryIcon,
  ClipboardCheck,
  Search,
  CheckCircle,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { arrayMove } from "@dnd-kit/sortable";
import { DragEndEvent } from "@dnd-kit/core";
import { PageHeader } from "@/components/PageHeader";

const Attendance = () => {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [classTitle, setClassTitle] = useState("");
  const [majorCategory, setMajorCategory] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnnouncementsVisible, setIsAnnouncementsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<
    string | null
  >(null);
  const [expirationType, setExpirationType] = useState<
    "today" | "permanent" | "custom"
  >("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const socketRef = useRef<Socket | null>(null);

  const getCurrentPeriodId = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hour * 60 + minutes;

    if (hour >= 5 && hour < 12) return "0"; // 上午
    if (hour >= 12 && hour < 18) return "1"; // 下午
    if (totalMinutes >= 18 * 60 && totalMinutes < 19 * 60 + 30) return "2"; // 晚一
    return "3"; // 晚二
  }, []);

  // 自动重置逻辑
  useEffect(() => {
    if (!hasMounted || students.length === 0) return;

    const currentPeriod = getCurrentPeriodId();
    const today = new Date().toLocaleDateString();
    const resetKey = `last_reset_${id}_${today}_${currentPeriod}`;

    // 检查本地存储
    const lastReset = localStorage.getItem(resetKey);
    if (!lastReset) {
      console.log(
        `[AutoReset] Detecting new period: ${currentPeriod}. Resetting...`
      );
      const resetStudents = students.map((s) => ({
        ...s,
        attendanceStatus: 0,
      }));
      setStudents(resetStudents);
      localStorage.setItem(resetKey, "true");

      // 如果有 socket，同步重置状态
      socketRef.current?.emit("order-update", {
        room: id,
        students: resetStudents,
      });

      toast.info(
        `已自动重置考勤状态（当前时段：${getReportDate().split(" ").pop()}）`,
        {
          description: "新时段开始，已清空之前的考勤记录。",
          duration: 5000,
        }
      );
    }
  }, [hasMounted, id, students.length, getCurrentPeriodId]);

  useEffect(() => {
    setHasMounted(true);

    // 1. 初始获取数据
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/classes/${id}`);
        if (!response.ok) throw new Error("Failed to fetch class data");
        const data = await response.json();
        setStudents(data.students);
        setAnnouncements(data.announcements);
        setClassTitle(data.name);

        // 处理班级大类：如果是数组则取第一个或拼接，如果不存在则默认
        if (data.major_categories && data.major_categories.length > 0) {
          setMajorCategory(data.major_categories[0]);
        } else {
          setMajorCategory("其他大类");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("加载数据失败");
        setLoading(false);
      }
    };

    fetchData();

    // 2. 初始化 Socket.io
    const initSocket = async () => {
      try {
        // 预热 Socket 服务器
        await fetch("/api/socket_io");

        const socket = io({
          path: "/api/socket_io_conn",
          addTrailingSlash: false,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ["polling", "websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("✅ [Socket] Connected to server");
          socket.emit("join-room", id);
        });

        socket.on("connect_error", (err: Error) => {
          console.error("❌ [Socket] Connection error:", err.message);
        });

        socket.on(
          "attendance-sync",
          (data: {
            room: string;
            classId?: string;
            studentId: string;
            status: number;
          }) => {
            if (data.classId === id || data.room === id) {
              setStudents((prev) =>
                prev.map((s) =>
                  s.id === data.studentId
                    ? { ...s, attendanceStatus: data.status }
                    : s
                )
              );
            }
          }
        );

        socket.on(
          "order-sync",
          (data: { room: string; classId?: string; students: Student[] }) => {
            if ((data.classId === id || data.room === id) && data.students) {
              setStudents(data.students);
            }
          }
        );

        socket.on(
          "announcement-sync",
          (data: { room: string; classId?: string; announcements: any[] }) => {
            if (
              (data.classId === id || data.room === id) &&
              data.announcements
            ) {
              setAnnouncements(data.announcements);
            }
          }
        );
      } catch (error) {
        console.error("Socket initialization error:", error);
      }
    };

    initSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [id]);

  const toggleReport = useCallback(() => {
    setIsReportOpen((prev) => !prev);
  }, []);

  const toggleAnnouncements = useCallback(() => {
    setIsAnimating(true);
    setIsAnnouncementsVisible((prev) => !prev);
    setTimeout(() => setIsAnimating(false), 500);
  }, []);

  const updateStudentStatus = useCallback(
    async (studentId: string, status: number) => {
      // 乐观更新
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, attendanceStatus: status } : s
        )
      );

      try {
        // 1. 发送给 Socket 广播给其他客户端 (不再即时持久化到数据库)
        socketRef.current?.emit("attendance-update", {
          room: id,
          studentId,
          status,
        });
      } catch (error) {
        console.error("Error broadcasting status:", error);
      }
    },
    [id]
  );

  const handleIndexChange = useCallback(
    async (studentId: string, newIndexStr: string) => {
      const newIndex = parseInt(newIndexStr) - 1;
      if (isNaN(newIndex) || newIndex < 0 || newIndex >= students.length)
        return;

      const oldIndex = students.findIndex((s) => s.id === studentId);
      if (oldIndex === -1 || oldIndex === newIndex) return;

      const newStudents = arrayMove(students, oldIndex, newIndex);
      setStudents(newStudents);

      try {
        // 1. 持久化排序
        const response = await fetch(`/api/classes/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_order",
            student_order: newStudents.map((s) => s.id),
          }),
        });

        if (!response.ok) throw new Error("Failed to update order");

        // 2. 广播
        socketRef.current?.emit("order-update", {
          room: id,
          students: newStudents,
        });
      } catch (error) {
        console.error("Error updating order:", error);
        toast.error("同步排序失败");
      }
    },
    [id, students]
  );

  const handleDragStart = useCallback(() => {
    // 处理拖拽开始
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = students.findIndex((s) => s.id === active.id);
        const newIndex = students.findIndex((s) => s.id === over.id);

        const newStudents = arrayMove(students, oldIndex, newIndex);
        setStudents(newStudents);

        try {
          // 1. 持久化排序
          const response = await fetch(`/api/classes/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update_order",
              student_order: newStudents.map((s) => s.id),
            }),
          });

          if (!response.ok) throw new Error("Failed to update order");

          // 2. 广播
          socketRef.current?.emit("order-update", {
            room: id,
            students: newStudents,
          });
        } catch (error) {
          console.error("Error updating order:", error);
          toast.error("同步排序失败");
        }
      }
    },
    [id, students]
  );

  const handleDragOver = useCallback(() => {
    // 处理跨容器拖拽（如果需要）
  }, []);

  const handleSaveAnnouncement = useCallback(async () => {
    if (!announcementText.trim()) return;

    const announcementData = {
      content: announcementText,
      expiration_type: expirationType,
      custom_starts_at: dateRange?.from?.toISOString(),
      custom_expires_at: dateRange?.to?.toISOString(),
    };

    try {
      let response;
      if (editingAnnouncementId) {
        response = await fetch(`/api/classes/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            announcement_id: editingAnnouncementId,
            ...announcementData,
          }),
        });
      } else {
        response = await fetch(`/api/classes/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(announcementData),
        });
      }

      if (!response.ok) throw new Error("Failed to save announcement");

      // 重新获取公告列表并广播
      const refreshRes = await fetch(`/api/classes/${id}`);
      const refreshData = await refreshRes.json();
      setAnnouncements(refreshData.announcements);

      socketRef.current?.emit("announcement-update", {
        room: id,
        announcements: refreshData.announcements,
      });

      setAnnouncementText("");
      setEditingAnnouncementId(null);
      setExpirationType("today");
      setDateRange(undefined);
      toast.success(editingAnnouncementId ? "更新成功" : "发布成功");
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("操作失败");
    }
  }, [id, announcementText, editingAnnouncementId, expirationType, dateRange]);

  const handleDeleteAnnouncement = useCallback(
    async (announcementId: string) => {
      try {
        const response = await fetch(`/api/classes/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete",
            announcement_id: announcementId,
          }),
        });

        if (!response.ok) throw new Error("Failed to delete announcement");

        // 重新获取并广播
        const refreshRes = await fetch(`/api/classes/${id}`);
        const refreshData = await refreshRes.json();
        setAnnouncements(refreshData.announcements);

        socketRef.current?.emit("announcement-update", {
          room: id,
          announcements: refreshData.announcements,
        });
        toast.success("删除成功");
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error("删除失败");
      }
    },
    [id]
  );

  const onClear = useCallback(async () => {
    const updatedStudents = students.map((s) => ({
      ...s,
      attendanceStatus: 0,
    }));
    setStudents(updatedStudents);

    // 广播 (不持久化到数据库)
    socketRef.current?.emit("order-update", {
      room: id,
      students: updatedStudents,
    });

    toast.success("考勤已重置 (未保存)");
  }, [id, students]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "早上好！";
    if (hour < 18) return "下午好！";
    return "晚上好！";
  };

  const getMajorCategory = () => {
    return majorCategory.split("-")[0].trim();
  };

  const getTeacherCategory = () => {
    const cat = getMajorCategory();
    // 移除“佰盈”或“金图”前缀
    return cat.replace(/^(佰盈|金图)/, "");
  };

  const getCleanedClassTitle = () => {
    return classTitle.split("-")[0].trim();
  };

  const getReportDate = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hour * 60 + minutes;

    let period = "";
    if (hour >= 5 && hour < 12) {
      period = "上午";
    } else if (hour >= 12 && hour < 18) {
      period = "下午";
    } else if (totalMinutes >= 18 * 60 && totalMinutes < 19 * 60 + 30) {
      // 18:00 - 19:29
      period = "晚一";
    } else {
      // 19:30 - 04:59
      period = "晚二";
    }
    return `${month}月 ${day}日 ${period}`;
  };

  const textTemplate = `${getReportDate()} 
${getMajorCategory()} 
应到: ${students.length}人 
实到: ${students.filter((s) => s.attendanceStatus === 1).length}人 
请假: ${
    students.filter((s) => s.attendanceStatus === 2).length > 0
      ? students
          .filter((s) => s.attendanceStatus === 2)
          .map((s) => s.name)
          .join(" ")
      : "无"
  } 
晚到: ${
    students.filter((s) => s.attendanceStatus === 3).length > 0
      ? students
          .filter((s) => s.attendanceStatus === 3)
          .map((s) => s.name)
          .join(" ")
      : "无"
  } 
未到: ${
    students.filter((s) => s.attendanceStatus === 0).length > 0
      ? students
          .filter((s) => s.attendanceStatus === 0)
          .map((s) => s.name)
          .join(" ")
      : "无"
  } 
教学老师到岗情况：${getTeacherCategory()}老师已到岗`;

  const onReportConfirm = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // 计算当前时段 ID
      const now = new Date();
      const hour = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hour * 60 + minutes;

      let periodId = 0; // 默认早上
      if (hour >= 12 && hour < 18) {
        periodId = 1; // 中午
      } else if (totalMinutes >= 18 * 60 && totalMinutes < 19 * 60 + 30) {
        periodId = 2; // 晚一
      } else if (totalMinutes >= 19 * 60 + 30 || hour < 5) {
        periodId = 3; // 晚二
      }

      // 批量保存当前状态到数据库（确认报表时持久化）
      const response = await fetch(`/api/classes/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_update_attendance",
          student_ids: students.map((s) => s.id),
          period: periodId,
          status_map: students.reduce((acc, s) => {
            acc[s.id] = s.attendanceStatus;
            return acc;
          }, {} as Record<string, number>),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || "Failed to save report data"
        );
      }

      copy(textTemplate);
      toast.success("报告已复制并保存记录");
      setIsReportOpen(false);
    } catch (error: unknown) {
      console.error("Error saving report:", error);
      const message =
        error instanceof Error ? error.message : "保存报告数据失败";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [id, students, textTemplate, isSaving]);

  const filteredStudents = useMemo(
    () =>
      students.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [students, searchQuery]
  );

  const onMarkAllPresent = useCallback(async () => {
    const targetStudents = searchQuery ? filteredStudents : students;
    const unarrivedStudents = targetStudents.filter(
      (s) => s.attendanceStatus === 0
    );
    if (unarrivedStudents.length === 0) {
      toast.info(searchQuery ? "搜索结果中没有未到学生" : "没有未到学生");
      return;
    }

    const updatedStudents = students.map((s) => {
      const isTarget = unarrivedStudents.some((us) => us.id === s.id);
      return isTarget ? { ...s, attendanceStatus: 1 } : s;
    });

    setStudents(updatedStudents);

    // 广播 (不持久化到数据库)
    socketRef.current?.emit("order-update", {
      room: id,
      students: updatedStudents,
    });

    toast.success(`已将 ${unarrivedStudents.length} 位学生标记为已到 (未保存)`);
  }, [id, students, filteredStudents, searchQuery]);

  const presentNames = useMemo(
    () => students.filter((s) => s.attendanceStatus === 1).map((s) => s.name),
    [students]
  );

  const onLeaveNames = useMemo(
    () => students.filter((s) => s.attendanceStatus === 2).map((s) => s.name),
    [students]
  );

  const lateArrivalNames = useMemo(
    () => students.filter((s) => s.attendanceStatus === 3).map((s) => s.name),
    [students]
  );

  if (loading) {
    return <AttendanceLoading />;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background">
        {/* 考勤报告弹窗 */}
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
            <DialogHeader className="p-6 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold tracking-tight">
                    考勤报告预览
                  </DialogTitle>
                  <DialogDescription className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    Attendance Report Preview
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6">
              <div className="bg-muted/50 p-5 rounded-xl border font-mono text-sm leading-relaxed relative group">
                <pre className="whitespace-pre-wrap">{textTemplate}</pre>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-muted/30 border-t flex flex-row gap-3 justify-end sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsReportOpen(false)}
                className="font-semibold text-xs"
              >
                取消
              </Button>
              <Button
                onClick={onReportConfirm}
                disabled={isSaving}
                className="font-bold text-xs px-6 rounded-lg"
              >
                {isSaving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                )}
                {isSaving ? "正在保存..." : "复制并关闭"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PageHeader showBack />

        {/* 页面工具栏：班级名 + 搜索 */}
        <div className="border-b bg-muted/30 px-3 py-2 md:px-4 md:py-2.5">
          <div className="container mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardCheck className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{getCleanedClassTitle()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{getMajorCategory()}</p>
              </div>
            </div>
            <div className="relative flex-1 max-w-xs sm:max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="搜索学生..." className="h-9 pl-8 pr-8 rounded-lg text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="outline" size="sm" className="h-8 text-xs border-blue-200 hover:bg-blue-50 hover:text-blue-600" onClick={() => router.push(`/attendance/daily/${id}`)}>
                <FileText className="mr-1.5 h-3.5 w-3.5 text-blue-500" />日考勤矩阵
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push(`/attendance/history/${id}`)}>
                <HistoryIcon className="mr-1.5 h-3.5 w-3.5" />历史报表
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600" onClick={onMarkAllPresent}>
                <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />全员到齐
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />重置</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader><AlertDialogTitle>确定要重置所有学生的考勤状态吗？</AlertDialogTitle><AlertDialogDescription>此操作将把当前班级所有学生的考勤状态重设为“未到”。</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel className="rounded-xl font-bold text-xs">取消</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-amber-500 text-white hover:bg-amber-600 font-bold text-xs" onClick={onClear}>确定重置</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* 公告管理组件 */}
        <AnnouncementManager
          isAnnouncementsVisible={isAnnouncementsVisible}
          isAnimating={isAnimating}
          hasMounted={hasMounted}
          loading={loading}
          announcements={announcements}
          announcementText={announcementText}
          setAnnouncementText={setAnnouncementText}
          editingAnnouncementId={editingAnnouncementId}
          setEditingAnnouncementId={setEditingAnnouncementId}
          expirationType={expirationType}
          setExpirationType={setExpirationType}
          dateRange={dateRange}
          setDateRange={setDateRange}
          handleSaveAnnouncement={handleSaveAnnouncement}
          handleDeleteAnnouncement={handleDeleteAnnouncement}
          setIsAnnouncementsVisible={setIsAnnouncementsVisible}
        />

        <div className="container mx-auto px-3 pt-6 pb-32 sm:px-4 sm:pt-8 sm:pb-40 md:px-6 lg:px-8">
          {/* 考勤主体组件 */}
          <StudentAttendanceList
            students={filteredStudents}
            allStudents={students}
            updateStudentStatus={updateStudentStatus}
            handleIndexChange={handleIndexChange}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          />
        </div>

        {/* 底部考勤统计组件 */}
        <AttendanceStats
          students={students}
          announcements={announcements}
          isAnnouncementsVisible={isAnnouncementsVisible}
          isReportOpen={isReportOpen}
          toggleAnnouncements={toggleAnnouncements}
          toggleReport={toggleReport}
          presentCount={presentNames.length}
          onLeaveCount={onLeaveNames.length}
          lateArrivalCount={lateArrivalNames.length}
        />
        <Toaster />
      </div>
    </TooltipProvider>
  );
};

export default Attendance;
