export function ProductCarouselSkeleton() {
    return (
        <div className="relative w-full py-20 px-4 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Title Skeleton */}
                <div className="mb-12 flex justify-center">
                    <div className="h-12 md:h-16 w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                </div>

                {/* Deck of Cards Skeleton Layout */}
                <div className="relative h-[600px] md:h-[700px] flex items-center justify-center">
                    <div className="relative w-full max-w-6xl h-full flex items-center justify-center gap-4 md:gap-8">
                        {[...Array(5)].map((_, index) => {
                            const totalCards = 5;
                            const baseRotation = (index - (totalCards - 1) / 2) * 3;
                            const baseTranslateX = (index - (totalCards - 1) / 2) * 50;
                            const baseScale = 0.95 - Math.abs(index - (totalCards - 1) / 2) * 0.02;

                            return (
                                <div
                                    key={index}
                                    className="absolute transition-all duration-500 ease-out"
                                    style={{
                                        transform: `translateX(${baseTranslateX}px) rotate(${baseRotation}deg) scale(${baseScale})`,
                                        zIndex: index,
                                    }}
                                >
                                    <div className="relative w-[280px] md:w-[350px] h-[420px] md:h-[520px] rounded-3xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-800">
                                        {/* Image Skeleton */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800 animate-pulse" />

                                        {/* Content Skeleton */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                            <div className="space-y-3">
                                                {/* Brand Skeleton */}
                                                <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />

                                                {/* Title Skeleton */}
                                                <div className="space-y-2">
                                                    <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                                                    <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                                                </div>

                                                {/* Price Skeleton */}
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                                                    <div className="h-10 w-28 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation Hint Skeleton */}
                <div className="text-center mt-12">
                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded mx-auto animate-pulse" />
                </div>
            </div>
        </div>
    );
}
