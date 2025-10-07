"use client"

import { FeaturedProductsQueryResult } from '@/sanity.types';
import { useNextSanityImage } from 'next-sanity-image';
import Img from 'next/image';
import Link from 'next/link';
import { client } from "@/sanity/lib/client";
import { useState } from 'react';

type Product = NonNullable<FeaturedProductsQueryResult[0]>;

// Helper component to handle the hook properly
function ProductCard({
  product,
  index,
  totalCards,
  hoveredIndex,
  setHoveredIndex
}: {
  product: Product;
  index: number;
  totalCards: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}) {
  const imageProps = useNextSanityImage(client, product.image, {
    imageBuilder: (builder, { width, quality }) =>
      builder.width(width || 600).height(width || 800).fit('crop').crop('center').quality(quality || 90)
  });

  const isHovered = hoveredIndex === index;
  const isAdjacent = hoveredIndex !== null && Math.abs(hoveredIndex - index) === 1;

  // Calculate positioning for deck effect
  const baseRotation = (index - (totalCards - 1) / 2) * 3;
  const baseTranslateX = (index - (totalCards - 1) / 2) * 120;
  const baseScale = 0.95 - Math.abs(index - (totalCards - 1) / 2) * 0.02;

  // Adjust on hover
  let rotation = baseRotation;
  let translateX = baseTranslateX;
  let translateY = 0;
  let scale = baseScale;
  let zIndex = index;

  if (isHovered) {
    rotation = 0;
    translateX = 0;
    translateY = -30;
    scale = 1.05;
    zIndex = 100;
  } else if (hoveredIndex !== null) {
    if (index < hoveredIndex) {
      translateX = baseTranslateX - 100;
    } else if (index > hoveredIndex) {
      translateX = baseTranslateX + 100;
    }
    scale = baseScale * 0.95;
  }

  return (
    <Link
      key={product._id}
      href={`/product/${product.slug}`}
      className="absolute transition-all duration-500 ease-out cursor-pointer"
      style={{
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
        zIndex,
      }}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div className="relative w-[280px] md:w-[350px] h-[420px] md:h-[520px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800 group">
        {/* Product Image */}
        <div className="absolute inset-0 overflow-hidden">
          {product?.image && imageProps?.src && (
            <Img
              src={imageProps.src}
              alt={product?.name || 'Product'}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 280px, 350px"
              placeholder="blur"
              blurDataURL={product?.image?.metadata?.lqip}
            />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 transform transition-all duration-500">
          <div className={`transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-90'}`}>
            {product.brand && (
              <p className="text-xs md:text-sm uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                {product.brand}
              </p>
            )}
            <h3 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3 leading-tight">
              {product.name}
            </h3>
            {product.description && (
              <p className={`text-sm md:text-base text-gray-300 mb-4 line-clamp-2 transition-all duration-500 ${isHovered ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'}`}>
                {product.description}
              </p>
            )}
            {product?.price && (
              <div className="flex items-center justify-between">
                <p className="text-2xl md:text-3xl font-bold text-white">
                  ${(product.price / 100).toFixed(2)}
                </p>
                <div className={`transition-all duration-500 ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                  <div className="bg-white text-black px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-sm md:text-base hover:bg-gray-200 transition-colors">
                    Shop Now
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hover Border Effect */}
        <div className={`absolute inset-0 rounded-3xl border-2 border-white/20 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </Link>
  );
}

function ProductCarousel({ products }: { products: FeaturedProductsQueryResult }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="relative w-full py-20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold mb-12 text-center tracking-tight">
          Featured Collection
        </h2>

        {/* Deck of Cards Layout */}
        <div className="relative h-[600px] md:h-[700px] flex items-center justify-center">
          <div className="relative w-full max-w-6xl h-full flex items-center justify-center gap-4 md:gap-8">
            {products.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                index={index}
                totalCards={products.length}
                hoveredIndex={hoveredIndex}
                setHoveredIndex={setHoveredIndex}
              />
            ))}
          </div>
        </div>

        {/* Navigation Hint */}
        <div className="text-center mt-12">
          <p className="text-sm md:text-base text-muted-foreground animate-pulse">
            Hover over cards to explore products
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProductCarousel;