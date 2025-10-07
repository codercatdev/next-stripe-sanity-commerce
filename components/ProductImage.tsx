"use client"

import { client } from "@/sanity/lib/client";
import { useNextSanityImage } from 'next-sanity-image';
import Img from 'next/image';

type ProductImageProps = {
  product: {
    _id: string;
    name: string | null;
    image: any;
  };
};

export function ProductImage({ product }: ProductImageProps) {
  const imageProps: any = product?.image ? useNextSanityImage(client, product.image, {
    imageBuilder: (builder, { width, quality }) => builder.width(width || 400).height(width || 400).fit('crop').crop('center').quality(quality || 80)
  }) : null;

  return (
    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-w-8 xl:aspect-h-8">
      {product?.image && imageProps?.src && (
        <Img
          {...imageProps}
          alt={product?.name || 'Product Image'}
          className="h-full w-full object-cover"
          sizes="(max-width: 800px) 100vw, 800px"
          placeholder="blur"
          blurDataURL={product?.image?.metadata?.lqip}
        />
      )}
    </div>
  )
}
