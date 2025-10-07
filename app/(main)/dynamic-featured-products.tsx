import { ProductCard } from '@/components/ProductCard'
import { ProductHero } from '@/components/ProductHero'
import { sanityFetchPPR } from "@/sanity/lib/fetch-ppr";
import { featuredProductsQuery, heroQuery } from "@/sanity/lib/queries";
import { FeaturedProductsQueryResult } from '@/sanity.types'
import MobileProductCarousel from '@/components/MobileProductCarousel';
import { Suspense } from 'react';
import { ProductCarouselSkeleton } from '@/components/ProductCarouselSkeleton';

async function ProductCarouselWrapper() {
    const [products] = await Promise.all([
        sanityFetchPPR({
            query: featuredProductsQuery,
        }),
    ]);

    return <MobileProductCarousel products={products} />;
}

export default async function FeaturedProducts() {
    const [products] = await Promise.all([
        sanityFetchPPR({
            query: featuredProductsQuery,
        }),
    ]);

    const heroProduct = products.at(0);

    return (
        <>
            {/* {heroProduct && (
                <div>
                    <ProductHero key={heroProduct._id} product={heroProduct} />
                </div>
            )} */}
            <Suspense fallback={<ProductCarouselSkeleton />}>
                <ProductCarouselWrapper />
            </Suspense>
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