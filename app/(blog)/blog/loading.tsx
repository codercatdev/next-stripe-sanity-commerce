export default function Loading() {
    return (
        <div className="container mx-auto px-5">
            {/* Loading state for the intro section */}
            <section className="mt-16 mb-16 flex flex-col items-center lg:mb-12 lg:flex-row lg:justify-between">
                <div className="h-16 w-3/4 animate-pulse rounded bg-gray-200 lg:h-20 lg:pr-8" />
                <div className="mt-5 h-6 w-full animate-pulse rounded bg-gray-200 lg:mt-0 lg:w-1/2 lg:pl-8" />
            </section>

            {/* Loading state for the hero post */}
            <article>
                <div className="group mb-8 block md:mb-16">
                    <div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-gray-200" />
                </div>
                <div className="mb-20 md:mb-28 md:grid md:grid-cols-2 md:gap-x-16 lg:gap-x-8">
                    <div>
                        <div className="mb-4 h-12 w-3/4 animate-pulse rounded bg-gray-200 lg:h-16" />
                        <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-gray-200 md:mb-0" />
                    </div>
                    <div>
                        <div className="mb-4 space-y-2">
                            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        </div>
                    </div>
                </div>
            </article>

            {/* Loading state for more stories section */}
            <aside>
                <div className="mb-8 h-12 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="mb-32 grid grid-cols-1 gap-y-20 md:grid-cols-2 md:gap-x-16 md:gap-y-32 lg:gap-x-32">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <article key={i}>
                            <div className="group mb-5 block">
                                <div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-gray-200" />
                            </div>
                            <div className="mb-3 h-8 w-3/4 animate-pulse rounded bg-gray-200" />
                            <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-gray-200" />
                            <div className="mb-4 space-y-2">
                                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                            </div>
                        </article>
                    ))}
                </div>
            </aside>
        </div>
    );
}