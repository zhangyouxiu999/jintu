"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trophy, Calendar, BarChart3, Settings, Users, Plus } from "lucide-react";

export function HomeNavPopover() {
  const [open, setOpen] = useState(false);

  const statLinks = [
    { href: "/grades", label: "成绩录入", icon: Trophy, className: "text-amber-600 hover:bg-amber-50" },
    { href: "/stats/custom-check", label: "月度核查", icon: Calendar },
    { href: "/attendance/stats", label: "个人统计", icon: BarChart3 },
  ];
  const manageLinks = [
    { href: "/classes/manage", label: "管理班级", icon: Settings },
    { href: "/students/manage", label: "管理学生", icon: Users },
  ];
  const addLink = { href: "/students/add", label: "添加学生", icon: Plus };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg text-xs shrink-0">
          更多
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end" side="bottom">
        {/* 统计与核查 */}
        <div className="mb-1.5">
          <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">统计</p>
          <div className="grid grid-cols-3 gap-1">
            {statLinks.map(({ href, label, icon: Icon, className }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full flex-col gap-1 h-auto py-2.5 text-xs font-medium ${className || ""}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">{label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <div className="my-1.5 border-t border-border" />
        {/* 管理 */}
        <div className="mb-1.5">
          <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">管理</p>
          <div className="grid grid-cols-2 gap-1">
            {manageLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 text-xs font-medium">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <div className="my-1.5 border-t border-border" />
        {/* 添加学生 */}
        <Link href={addLink.href} onClick={() => setOpen(false)}>
          <Button variant="default" size="sm" className="w-full justify-center gap-2 h-9 text-xs font-bold">
            <Plus className="w-3.5 h-3.5 shrink-0" />
            {addLink.label}
          </Button>
        </Link>
      </PopoverContent>
    </Popover>
  );
}
