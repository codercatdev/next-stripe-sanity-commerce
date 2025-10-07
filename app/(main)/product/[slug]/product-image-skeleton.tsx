import { Skeleton } from "@/components/ui/skeleton";

export function ProductImageSkeleton() {
  return (
    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-w-8 xl:aspect-h-8">
      <Skeleton className="h-full w-full" />
    </div>
  );
}