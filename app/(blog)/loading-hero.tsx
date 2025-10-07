export default function LoadingHero() {
    return (
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
    );
}