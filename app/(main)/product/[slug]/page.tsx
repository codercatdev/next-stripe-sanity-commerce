import { Suspense } from 'react'
import { Header } from '@/components/Header'
import DynamicProductDetails from '@/app/(main)/dynamic-product-details'
import { Skeleton } from '@/components/ui/skeleton'

// Enable PPR for this page
export const experimental_ppr = true;

function ProductDetailsSkeleton() {
  return (
    <div className="bg-white">
      <div className="pt-6">
        <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:max-w-7xl lg:gap-x-8 lg:px-8 flex">
          <div className='max-w-1/3'>
            <Skeleton className="h-[500px] w-[500px]" />
          </div>
          <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 lg:grid lg:max-w-7xl lg:grid-rows-[auto,auto,1fr] lg:gap-x-8 lg:px-8 lg:pb-24 lg:pt-16">
            <div className="lg:col-span-2 lg:pr-8">
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
            </div>

            <div className="mt-4 lg:row-span-3 lg:mt-0">
              <h2 className="sr-only">Product information</h2>
              <Skeleton className="h-8 w-1/4" />

              <Skeleton className="mt-10 h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<ProductDetailsSkeleton />}>
          <DynamicProductDetails slug={slug} />
        </Suspense>
      </main>
    </>
  )
}
