import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton, StatsSkeleton } from "@/components/LoadingSkeletons";

export default function ContactsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <StatsSkeleton count={4} />

      {/* Table Skeleton */}
      <TableSkeleton rows={10} columns={6} showHeader={false} />
    </div>
  );
}
