import { Suspense } from 'react'
import { Header } from '@/components/Header'
import DynamicProductImage from '@/app/(main)/product/[slug]/dynamic-product-image'
import DynamicProductInfo from '@/app/(main)/product/[slug]/dynamic-product-info'
import DynamicProductPricing from '@/app/(main)/product/[slug]/dynamic-product-pricing'
import { ProductImageSkeleton } from '@/app/(main)/product/[slug]/product-image-skeleton'
import { ProductInfoSkeleton } from '@/app/(main)/product/[slug]/product-info-skeleton'
import { ProductPricingSkeleton } from '@/app/(main)/product/[slug]/product-pricing-skeleton'

// Enable PPR for this page
export const experimental_ppr = true;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <Header />
      <main>
        <div className="bg-white">
          <div className="pt-6">
            <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-x-8 lg:px-8">
              <div className="lg:col-span-1">
                <Suspense fallback={<ProductImageSkeleton />}>
                  <DynamicProductImage slug={slug} />
                </Suspense>
              </div>
              <div className="lg:col-span-2 px-4 pb-16 pt-10 sm:px-6 lg:grid lg:grid-rows-[auto,auto,1fr] lg:gap-x-8 lg:px-8 lg:pb-24 lg:pt-16">
                <div className="lg:col-span-2 lg:pr-8">
                  <Suspense fallback={<ProductInfoSkeleton />}>
                    <DynamicProductInfo slug={slug} />
                  </Suspense>
                </div>

                <div className="mt-4 lg:row-span-3 lg:mt-0">
                  <Suspense fallback={<ProductPricingSkeleton />}>
                    <DynamicProductPricing slug={slug} />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
