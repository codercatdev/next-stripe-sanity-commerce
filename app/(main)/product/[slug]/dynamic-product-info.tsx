import { productBySlugQuery } from '@/sanity/lib/queries'
import { sanityFetchPPR } from '@/sanity/lib/fetch-ppr'
import { notFound } from 'next/navigation'

export default async function DynamicProductInfo({ slug }: { slug: string }) {
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{product.name}</h1>
            <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-b lg:border-gray-200 lg:pb-16 lg:pr-8 lg:pt-6">
                <div>
                    <h3 className="sr-only">Description</h3>
                    <div className="space-y-6">
                        <p className="text-base text-gray-900">{product.description}</p>
                    </div>
                </div>
            </div>
        </>
    );
}