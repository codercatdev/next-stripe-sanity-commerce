import { ProductCarouselSkeleton } from '@/components/ProductCarouselSkeleton'

export default function Loading() {
    return (
        <div className="min-h-screen">
            <ProductCarouselSkeleton />

            {/* Featured Products Grid Skeleton */}
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-6" />

                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="group">
                            <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
                                <div className="h-full w-full animate-pulse" />
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
