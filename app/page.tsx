import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
import Class from "@/models/Class";
import { IClass } from "@/types/Class";
import { GraduationCap, ChevronRight, Calendar, ShieldCheck, Settings } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// 强制服务端每次请求时拉取数据，避免构建时静态化导致 NAS 部署后首页班级为空
export const dynamic = "force-dynamic";

async function getClasses(): Promise<IClass[]> {
  try {
    await dbConnect();
    const classes = await Class.find({}).sort({ name: 1 });
    return JSON.parse(JSON.stringify(classes));
  } catch (error) {
    console.error("Failed to fetch classes in page:", error);
    return [];
  }
}

export default async function Page() {
  const classes = await getClasses();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader />

      <div className="container mx-auto pt-6 pb-12 px-4 sm:px-8 space-y-8 min-w-0">
        {/* 班级数与日期：紧凑一行 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary/80" />
            <span>班级总数</span>
            <span className="font-semibold text-foreground">{classes.length}</span>
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary/80" />
            <span>
              {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </span>
          </span>
        </div>

        {/* Class List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-primary" />
              <h2 className="text-sm font-bold tracking-tight">选择班级</h2>
            </div>
            <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5">
              共有 {classes.length} 个活跃班级
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <Link
                  key={cls._id?.toString()}
                  href={`/attendance/${cls.code}`}
                  className="group"
                >
                  <Card className="p-1 hover:border-primary/50 transition-colors rounded-lg border bg-card shadow-sm cursor-pointer overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-3">
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold text-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        {cls.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                            {cls.name}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(cls.major_categories || []).length > 0 ? (
                            (cls.major_categories || []).map((cat: string) => (
                              <Badge
                                key={cat}
                                variant="secondary"
                                className="text-[10px] px-2 py-0 h-5 font-medium bg-muted/50"
                              >
                                {cat}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              未配置分类
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </CardHeader>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="col-span-full py-16 text-center border-dashed rounded-lg">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base font-bold">暂无班级数据</CardTitle>
                  <CardDescription className="max-w-xs mx-auto mt-2">
                    当前数据库中还没有录入任何班级。请前往管理中心进行初始化设置。
                  </CardDescription>
                </CardHeader>
                <div className="mt-6">
                  <Link href="/classes/manage">
                    <Button variant="outline" size="sm" className="rounded-lg text-xs">
                      <Settings className="w-3.5 h-3.5 mr-2" />
                      去管理页面添加
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 pb-8 text-muted-foreground">
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-primary" />
            </div>
            © 2026 考勤管理系统 · 极简办公
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/attendance/stats" className="text-xs hover:text-primary transition-colors">个人统计</Link>
            <Link href="/classes/manage" className="text-xs hover:text-primary transition-colors">管理中心</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
