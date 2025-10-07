import { ProductImage } from '@/components/ProductImage'
import { productBySlugQuery } from '@/sanity/lib/queries'
import { sanityFetchPPR } from '@/sanity/lib/fetch-ppr'
import { notFound } from 'next/navigation'

export default async function DynamicProductImage({ slug }: { slug: string }) {
    const [product] = await Promise.all([
        sanityFetchPPR({
            query: productBySlugQuery,
            params: { slug },
        }),
    ]);

    if (!product) {
        return notFound();
    }

    return <ProductImage product={product} />;
}