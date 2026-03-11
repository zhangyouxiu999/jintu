"use client";

import { Bell, FileText, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Student, AnnouncementItem } from "../types";

interface AttendanceStatsProps {
  students: Student[];
  announcements: AnnouncementItem[];
  isAnnouncementsVisible: boolean;
  isReportOpen: boolean;
  toggleAnnouncements: () => void;
  toggleReport: () => void;
  presentCount: number;
  onLeaveCount: number;
  lateArrivalCount: number;
}

export default function AttendanceStats({
  students,
  announcements,
  isAnnouncementsVisible,
  isReportOpen,
  toggleAnnouncements,
  toggleReport,
  presentCount,
  onLeaveCount,
  lateArrivalCount,
}: AttendanceStatsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
      <div className="bg-card text-card-foreground border shadow-lg rounded-2xl p-2 flex flex-col backdrop-blur supports-[backdrop-filter]:bg-card/80 gap-2">
        {/* 第一行：应到/未到/请假/晚到 */}
        <div className="flex items-center justify-around gap-4 md:gap-6 px-2 md:px-4 py-1">
          <div className="flex flex-col items-center">
            <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              应到
            </span>
            <span className="text-sm md:text-base font-semibold">
              {students.length}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] md:text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
              未到
            </span>
            <span className="text-sm md:text-base font-bold text-rose-600 dark:text-rose-400">
              {students.length - presentCount - onLeaveCount - lateArrivalCount}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] md:text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              请假
            </span>
            <span className="text-sm md:text-base font-bold text-amber-600 dark:text-amber-400">
              {onLeaveCount}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] md:text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">
              晚到
            </span>
            <span className="text-sm md:text-base font-bold text-sky-600 dark:text-sky-400">
              {lateArrivalCount}
            </span>
          </div>
        </div>

        {/* 第二行：公告 */}
        <div className="flex justify-center md:justify-end px-1">
          <Button
            variant={isAnnouncementsVisible ? "default" : "secondary"}
            size="sm"
            className="rounded-full px-3 md:px-4 h-8 md:h-9 text-xs md:text-sm"
            onClick={toggleAnnouncements}
          >
            <Bell
              className={`mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 ${
                isAnnouncementsVisible ? "animate-bounce" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isAnnouncementsVisible
                ? "收起公告"
                : `公告 (${announcements.length})`}
            </span>
            <span className="sm:hidden">
              {isAnnouncementsVisible
                ? "收起"
                : `公告 (${announcements.length})`}
            </span>
            {isAnnouncementsVisible ? (
              <ChevronUp className="ml-1 h-3.5 w-3.5 md:h-4 md:w-4" />
            ) : (
              <ChevronDown className="ml-1 h-3.5 w-3.5 md:h-4 md:w-4" />
            )}
          </Button>
        </div>

        {/* 第三行：生成报告按钮独占一行 */}
        <Button
          variant={isReportOpen ? "default" : "secondary"}
          size="sm"
          className="w-full rounded-full px-4 h-9 text-xs md:text-sm"
          onClick={toggleReport}
        >
          <FileText className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
          <span className="hidden sm:inline">
            {isReportOpen ? "收起报告" : "查看报告"}
          </span>
          <span className="sm:hidden">{isReportOpen ? "收起" : "报告"}</span>
          {isReportOpen ? (
            <ChevronUp className="ml-1 h-3.5 w-3.5 md:h-4 md:w-4" />
          ) : (
            <ChevronDown className="ml-1 h-3.5 w-3.5 md:h-4 md:w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
