import { Skeleton } from "@/components/ui/skeleton";

export default function AttendanceLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20 rounded-md" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-16" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton - Matches 3-column layout */}
      <div className="container mx-auto pt-6 pb-32 sm:pt-8 sm:pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((col) => (
            <div key={col} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <Skeleton className="h-4 w-1 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <div className="h-10 bg-muted/50 border-b flex items-center px-4 justify-between">
                  <Skeleton className="h-3 w-4" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="divide-y">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                    <div key={row} className="h-16 flex items-center px-4 justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Stats Bar Skeleton */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <div className="bg-card border shadow-lg rounded-2xl md:rounded-full p-2 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center justify-around md:justify-start gap-4 md:gap-8 px-6 py-2 w-full md:w-auto md:border-r">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="h-2 w-8" />
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 w-full md:w-auto justify-center md:justify-end">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
