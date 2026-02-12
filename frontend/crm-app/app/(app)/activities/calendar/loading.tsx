"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-64 mb-2 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card 
            key={i} 
            className="p-4 border border-border animate-pulse"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Skeleton */}
      <Card className="p-4 border border-border">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </Card>

      {/* Calendar Skeleton */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={day} className="text-center py-2">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
            ))}
            
            {/* Calendar cells */}
            {Array.from({ length: 35 }).map((_, i) => (
              <div 
                key={i} 
                className="aspect-square p-2 border rounded animate-pulse"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <Skeleton className="h-5 w-5 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
