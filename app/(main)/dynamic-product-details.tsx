import { ProductImage } from '@/components/ProductImage'
import { BuyNow } from '@/components/BuyNow'
import { AddToCart } from '@/components/AddToCart'
import { productBySlugQuery } from '@/sanity/lib/queries'
import { sanityFetchPPR } from '@/sanity/lib/fetch-ppr'
import { notFound } from 'next/navigation'

export default async function DynamicProductDetails({ slug }: { slug: string }) {
    const [product] = await Promise.all([
        sanityFetchPPR({
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