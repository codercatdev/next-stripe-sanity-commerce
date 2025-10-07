"use client"

import Link from 'next/link'
import { useNextSanityImage } from 'next-sanity-image';
import Img from 'next/image';
import { ProductsQueryResult } from '@/sanity.types';
import { client } from "@/sanity/lib/client";

export function ProductCard({ product }: { product: NonNullable<ProductsQueryResult[0]> }) {
  const imageProps = useNextSanityImage(client, product.image, {
    imageBuilder: (builder, { width, quality }) => builder.width(width || 400).height(width || 400).fit('crop').crop('center').quality(quality || 80)
  });

  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-8">
        {product?.image && imageProps?.src && (
          <Img
            {...imageProps}
            alt={product?.name || 'Product Image'}
            style={{ width: '100%', height: 'auto' }}
            sizes="(max-width: 800px) 100vw, 800px"
            placeholder="blur"
            blurDataURL={product?.image?.metadata?.lqip}
          />
        )}
      </div>
      <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
      {product?.price && (
        <p className="mt-1 text-lg font-medium text-gray-900">${product.price / 100}</p>
      )}
    </Link>
  )
}
