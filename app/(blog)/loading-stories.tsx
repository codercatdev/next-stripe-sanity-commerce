export default function LoadingStories() {
    return (
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
    );
}