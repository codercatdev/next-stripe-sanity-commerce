import { BuyNow } from '@/components/BuyNow'
import { AddToCart } from '@/components/AddToCart'
import { productBySlugQuery } from '@/sanity/lib/queries'
import { sanityFetchPPR } from '@/sanity/lib/fetch-ppr'
import { notFound } from 'next/navigation'

export default async function DynamicProductPricing({ slug }: { slug: string }) {
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
        <>
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl tracking-tight text-gray-900">${(product.price || 0) / 100}</p>
            <div className="flex gap-4 mt-2 md:mt-8">
                <BuyNow product={product} />
                <AddToCart product={product} />
            </div>
        </>
    );
}