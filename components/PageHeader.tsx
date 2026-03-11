"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeNavPopover } from "@/components/HomeNavPopover";
import {
  Users,
  Settings,
  Plus,
  BarChart3,
  Calendar,
  Trophy,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

interface PageHeaderProps {
  /** 是否显示返回首页的链接 */
  showBack?: boolean;
}

export function PageHeader({ showBack = false }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:border-b">
      <div className="px-3 pt-3 md:px-0 md:pt-0">
        <div className="rounded-lg border border-border bg-card shadow-sm md:rounded-none md:border-0 md:shadow-none md:bg-transparent overflow-hidden min-w-0">
          <div className="md:hidden flex flex-col gap-0 touch-manipulation">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border/60">
              <div className="flex min-w-0 shrink-0 items-center gap-2">
                {showBack ? (
                  <Link
                    href="/"
                    className="shrink-0 rounded-lg inline-flex items-center justify-center h-9 w-9 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Link>
                ) : null}
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-sm font-bold tracking-tight text-foreground truncate">
                    考勤管理系统
                  </h1>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Attendance System v2.0
                  </p>
                </div>
              </div>
              <HomeNavPopover />
            </div>
          </div>
          <div className="hidden md:flex min-h-14 flex-row items-center justify-between px-4 sm:px-8 min-w-0">
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              {showBack ? (
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg px-2 lg:px-3 shrink-0"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    返回
                  </Button>
                </Link>
              ) : null}
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-bold tracking-tight truncate">
                  考勤管理系统
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  Attendance System v2.0
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 justify-end">
              <div className="flex items-center gap-1.5 shrink-0">
                <Link href="/grades">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-amber-200 hover:bg-amber-50 hover:text-amber-600 text-xs shrink-0"
                  >
                    <Trophy className="w-3.5 h-3.5 sm:mr-1.5 text-amber-500" />
                    <span className="hidden sm:inline">成绩录入</span>
                  </Button>
                </Link>
                <Link href="/stats/custom-check">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs shrink-0"
                  >
                    <Calendar className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">月度核查</span>
                  </Button>
                </Link>
                <Link href="/attendance/stats">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs shrink-0"
                  >
                    <BarChart3 className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">个人统计</span>
                  </Button>
                </Link>
              </div>
              <div className="hidden sm:block w-px h-5 bg-border/60" aria-hidden />
              <div className="flex items-center gap-1.5 shrink-0">
                <Link href="/classes/manage">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">管理班级</span>
                  </Button>
                </Link>
                <Link href="/students/manage">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs shrink-0"
                  >
                    <Users className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">管理学生</span>
                  </Button>
                </Link>
              </div>
              <div className="hidden sm:block w-px h-5 bg-border/60" aria-hidden />
              <Link href="/students/add">
                <Button
                  size="sm"
                  className="h-8 rounded-lg text-xs font-bold shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">添加学生</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
