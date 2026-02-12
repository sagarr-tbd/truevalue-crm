"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export default function TableSkeleton({
  rows = 10,
  columns = 5,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <Card className="p-6">
      {/* Header */}
      {showHeader && (
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Skeleton className="h-10 flex-1 min-w-[200px] max-w-md" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <div className="space-y-4 overflow-hidden">
        {/* Table Header */}
        <div className="flex gap-4 pb-4 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 min-w-[60px]" />
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex gap-4 py-3 animate-pulse"
            style={{ animationDelay: `${rowIndex * 50}ms` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className="h-6 flex-1 min-w-[60px]" 
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </Card>
  );
}
