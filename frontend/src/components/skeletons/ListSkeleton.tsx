import clsx from "clsx";
import { Skeleton } from "./Skeleton";

export function ListSkeleton({ count = 5, withThumbnail = false }: { count?: number; withThumbnail?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline/5 bg-base-900">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={clsx("flex items-center gap-3 px-4 py-3.5", i !== count - 1 && "border-b border-hairline/5")}
        >
          {withThumbnail && <Skeleton className="h-14 w-10 shrink-0 rounded-lg" />}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5 rounded" />
            <Skeleton className="h-3 w-3/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
