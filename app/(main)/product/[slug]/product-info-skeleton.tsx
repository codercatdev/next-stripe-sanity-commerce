import { Skeleton } from "@/components/ui/skeleton";

export function ProductInfoSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-3/4" />
      <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-b lg:border-gray-200 lg:pb-16 lg:pr-8 lg:pt-6">
        <div>
          <h3 className="sr-only">Description</h3>
          <div className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    </>
  );
}