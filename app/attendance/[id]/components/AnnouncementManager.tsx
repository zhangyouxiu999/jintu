"use client";

import {
  Bell,
  ChevronUp,
  RefreshCw,
  X,
  Clock,
  BellOff,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, addDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AnnouncementItem } from "../types";
import { DateRange } from "react-day-picker";

interface AnnouncementManagerProps {
  isAnnouncementsVisible: boolean;
  isAnimating: boolean;
  hasMounted: boolean;
  loading: boolean;
  announcements: AnnouncementItem[];
  announcementText: string;
  setAnnouncementText: (text: string) => void;
  editingAnnouncementId: string | null;
  setEditingAnnouncementId: (id: string | null) => void;
  expirationType: "today" | "permanent" | "custom";
  setExpirationType: (type: "today" | "permanent" | "custom") => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  handleSaveAnnouncement: () => void;
  handleDeleteAnnouncement: (id: string) => void;
  setIsAnnouncementsVisible: (visible: boolean) => void;
}

export default function AnnouncementManager({
  isAnnouncementsVisible,
  isAnimating,
  hasMounted,
  loading,
  announcements,
  announcementText,
  setAnnouncementText,
  editingAnnouncementId,
  setEditingAnnouncementId,
  expirationType,
  setExpirationType,
  dateRange,
  setDateRange,
  handleSaveAnnouncement,
  handleDeleteAnnouncement,
  setIsAnnouncementsVisible,
}: AnnouncementManagerProps) {
  return (
    <div
      className={`fixed left-0 right-0 z-[110] transform ${
        isAnimating ? "transition-all duration-500 ease-in-out" : ""
      }`}
      style={{
        top: 0,
        display: hasMounted && !loading ? "block" : "none",
        transform: isAnnouncementsVisible
          ? "translateY(0)"
          : "translateY(-100%)",
        visibility:
          isAnnouncementsVisible || isAnimating ? "visible" : "hidden",
        transition: isAnimating ? "transform 500ms ease-in-out" : "none",
      }}
    >
      <div className="bg-background/95 backdrop-blur-md border-b shadow-xl overflow-hidden">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  班级重要公告
                </h3>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Important Announcements
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted"
              onClick={() => setIsAnnouncementsVisible(false)}
            >
              <ChevronUp className="w-6 h-6" />
            </Button>
          </div>

          {/* 发布新公告区域 */}
          <div className="mb-8 space-y-4">
            <div className="flex gap-2 p-1.5 bg-muted/50 rounded-xl border shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <input
                type="text"
                placeholder={
                  editingAnnouncementId
                    ? "正在编辑公告内容..."
                    : "输入需要推送的新公告..."
                }
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="flex-1 px-4 py-2 bg-transparent text-sm font-medium focus:outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveAnnouncement();
                }}
              />
              <div className="flex items-center gap-1.5">
                {editingAnnouncementId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingAnnouncementId(null);
                      setAnnouncementText("");
                      setExpirationType("today");
                    }}
                    className="h-9 px-4 text-xs font-semibold rounded-lg"
                  >
                    取消
                  </Button>
                )}
                <Button
                  onClick={handleSaveAnnouncement}
                  disabled={!announcementText.trim()}
                  size="sm"
                  className="h-9 px-6 text-xs font-bold rounded-lg shadow-sm"
                >
                  {editingAnnouncementId ? "确认更新" : "立即发布"}
                </Button>
              </div>
            </div>

            {/* 有效期选择 */}
            <div className="flex flex-wrap items-center gap-3 px-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                有效时间:
              </span>
              <div className="flex bg-muted/50 p-1 rounded-lg border">
                {[
                  { id: "today", label: "只限今天" },
                  { id: "permanent", label: "长期有效" },
                  { id: "custom", label: "选择期限" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() =>
                      setExpirationType(type.id as typeof expirationType)
                    }
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      expirationType === type.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {expirationType === "custom" && (
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 px-4 text-xs font-medium rounded-lg border-dashed",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "PP", {
                              locale: zhCN,
                            })}{" "}
                            - {format(dateRange.to, "PP", { locale: zhCN })}
                          </>
                        ) : (
                          format(dateRange.from, "PP", { locale: zhCN })
                        )
                      ) : (
                        <span>选择日期范围</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-[120]"
                    align="start"
                    sideOffset={8}
                  >
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      className="rounded-md"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {announcements.length > 0 ? (
              announcements.map((a: AnnouncementItem) => (
                <div
                  key={a.id}
                  className="group p-5 bg-card text-card-foreground rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 relative"
                >
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium leading-relaxed">
                        {a.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(
                            a.updated_at || a.created_at
                          ).toLocaleString()}
                        </span>
                        {a.expiration_type && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide ${
                              a.expiration_type === "permanent"
                                ? "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-500/30"
                                : a.expiration_type === "today"
                                ? "bg-muted text-muted-foreground border-transparent"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}
                          >
                            {a.expiration_type === "permanent" ? (
                              "长期有效"
                            ) : a.expiration_type === "today" ? (
                              "只限今天"
                            ) : (
                              <>
                                {(() => {
                                  try {
                                    const s = a.starts_at
                                      ? new Date(a.starts_at)
                                      : null;
                                    const e = a.expires_at
                                      ? new Date(a.expires_at)
                                      : null;
                                    const isValidS = s && !isNaN(s.getTime());
                                    const isValidE = e && !isNaN(e.getTime());

                                    if (isValidS && isValidE) {
                                      return `${format(s, "MM/dd")} - ${format(
                                        e,
                                        "MM/dd"
                                      )}`;
                                    } else if (isValidE) {
                                      return `至 ${format(e, "MM/dd")}`;
                                    } else if (isValidS) {
                                      return `自 ${format(s, "MM/dd")}`;
                                    }
                                    return "长期有效";
                                  } catch {
                                    return "自定义期限";
                                  }
                                })()}
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                            onClick={() => {
                              setEditingAnnouncementId(a.id);
                              setAnnouncementText(a.content);
                              setExpirationType(a.expiration_type || "today");
                              if (
                                a.expiration_type === "custom" &&
                                a.starts_at &&
                                a.expires_at
                              ) {
                                setDateRange({
                                  from: new Date(a.starts_at),
                                  to: new Date(a.expires_at),
                                });
                              } else {
                                setDateRange({
                                  from: new Date(),
                                  to: addDays(new Date(), 7),
                                });
                              }
                              const input =
                                document.querySelector('input[type="text"]');
                              if (input) (input as HTMLInputElement).focus();
                            }}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑公告</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => handleDeleteAnnouncement(a.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>删除公告</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 flex flex-col items-center justify-center bg-muted/30 rounded-2xl border border-dashed">
                <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mb-4 border shadow-sm">
                  <BellOff className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  暂无重要公告
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
