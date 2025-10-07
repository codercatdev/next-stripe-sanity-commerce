import { Suspense } from 'react'
import { Header } from '@/components/Header'

import { ProductImage } from '@/components/ProductImage'
import { Skeleton } from '@/components/ui/skeleton'
import { BuyNow } from '@/components/BuyNow'
import { AddToCart } from '@/components/AddToCart'
import { productBySlugQuery } from '@/sanity/lib/queries'
import { sanityFetch } from '@/sanity/lib/fetch'
import { notFound } from 'next/navigation'

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

async function ProductDetails({ slug }: { slug: string }) {

  const [product] = await Promise.all([
    sanityFetch({
      query: productBySlugQuery,
      params: { slug },
    }),
  ]);

  if (!product) {
    return notFound();
  }


  return (
    <div className="bg-white">
      <div className="pt-6">
        <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:max-w-7xl lg:gap-x-8 lg:px-8 flex">
          <div className='max-w-1/3'>
            <ProductImage product={product} />
          </div>
          <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 lg:grid lg:max-w-7xl lg:grid-rows-[auto,auto,1fr] lg:gap-x-8 lg:px-8 lg:pb-24 lg:pt-16">
            <div className="lg:col-span-2 lg:pr-8">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{product.name}</h1>
              <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-b lg:border-gray-200 lg:pb-16 lg:pr-8 lg:pt-6">
                {/* Description and details */}
                <div>
                  <h3 className="sr-only">Description</h3>

                  <div className="space-y-6">
                    <p className="text-base text-gray-900">{product.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="mt-4 lg:row-span-3 lg:mt-0">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl tracking-tight text-gray-900">${(product.price || 0) / 100}</p>
              <div className="flex gap-4 mt-2 md:mt-8">
                <BuyNow product={product} />
                <AddToCart product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<ProductDetailsSkeleton />}>
          <ProductDetails slug={slug} />
        </Suspense>
      </main>

    </>
  )
}
