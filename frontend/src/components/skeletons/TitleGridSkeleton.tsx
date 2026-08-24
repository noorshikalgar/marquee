import { Skeleton } from "./Skeleton";

function TitleCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[2/3] w-full rounded-xl" />
      <div className="p-2.5">
        <Skeleton className="h-3.5 w-4/5 rounded" />
        <Skeleton className="mt-2 h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function TitleGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <TitleCardSkeleton key={i} />
      ))}
    </div>
  );
}
