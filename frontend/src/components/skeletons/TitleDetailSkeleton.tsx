import { Skeleton } from "./Skeleton";

export function TitleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:pt-36">
      <div className="flex flex-col gap-6 sm:flex-row">
        <Skeleton className="aspect-[2/3] w-40 shrink-0 rounded-xl sm:w-56" />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-2/3 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-2/3 rounded" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PersonDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <Skeleton className="h-40 w-40 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-1/3 rounded" />
          <Skeleton className="h-4 w-1/4 rounded" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
