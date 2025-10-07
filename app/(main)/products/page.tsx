import { Suspense } from 'react'
import type { Metadata } from "next";
import { Header } from '@/components/Header'
import DynamicAllProducts from '@/app/(main)/dynamic-all-products'
import { Skeleton } from '@/components/ui/skeleton'

// Enable PPR for this page
export const experimental_ppr = true;

// Static metadata for products page
export const metadata: Metadata = {
  title: "All Products - CodingCat.dev",
  description: "Browse our complete collection of products",
};

function ProductCardSkeleton() {
  return (
    <div className="group">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-8">
        <Skeleton className="h-full w-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-1 h-4 w-1/2" />
    </div>
  );
}

function AllProductsSkeleton() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <Skeleton className="h-6 w-1/3 mb-6" />
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <>
      <main>
        <Suspense fallback={<AllProductsSkeleton />}>
          <DynamicAllProducts />
        </Suspense>
      </main>
    </>
  )
}
