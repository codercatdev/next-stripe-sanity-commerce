import { Skeleton } from "@/components/ui/skeleton";

export function ProductPricingSkeleton() {
  return (
    <>
      <h2 className="sr-only">Product information</h2>
      <Skeleton className="h-8 w-1/4" />
      <div className="flex gap-4 mt-2 md:mt-8">
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-12 w-32" />
      </div>
    </>
  );
}