"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DetailPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 max-w-[calc(100vw-8rem)]" />
            <Skeleton className="h-4 w-48 max-w-[calc(100vw-8rem)]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Info Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="space-y-2 animate-pulse"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Tabs Section */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Tab Headers */}
              <div className="flex gap-4 border-b pb-2 overflow-x-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className="h-8 w-24 flex-shrink-0" 
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-3 p-3 border rounded-lg animate-pulse"
                    style={{ animationDelay: `${i * 75}ms` }}
                  >
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <Skeleton className="h-4 w-32 max-w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div 
                  key={i} 
                  className="space-y-2 animate-pulse"
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </Card>

          {/* Related Items Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 p-2 border rounded-lg animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Timeline Card */}
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-3 animate-pulse"
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
