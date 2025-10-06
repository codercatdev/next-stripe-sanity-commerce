import { Suspense } from 'react'
import { Header } from '@/components/Header'

import { ProductCard } from '@/components/ProductCard'
import { ProductHero } from '@/components/ProductHero'
import { sanityFetch } from "@/sanity/lib/fetch";
import { featuredProductsQuery, heroQuery, settingsQuery } from "@/sanity/lib/queries";
import { Skeleton } from '@/components/ui/skeleton'
import { FeaturedProductsQueryResult } from '@/sanity.types'

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

function FeaturedProductsSkeleton() {
  return (
    <>
      <div className="relative h-[500px] w-full">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <Skeleton className="h-6 w-1/3 mb-6" />
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

async function FeaturedProducts() {
  const [products] = await Promise.all([
    sanityFetch({
      query: featuredProductsQuery,
    }),
    sanityFetch({ query: heroQuery }),
  ]);

  return (
    <>
      <div>
        <ProductHero key={products.at(0)._id} product={products.at(0)} />
      </div>
      <div className="">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Products</h2>

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {products.map((product: FeaturedProductsQueryResult[0]) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<FeaturedProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </main>
    </>
  )
}