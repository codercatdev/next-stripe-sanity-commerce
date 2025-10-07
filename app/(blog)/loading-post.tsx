export default function LoadingPost() {
  return (
    <div className="container mx-auto px-5">
      <div className="mb-16 mt-10 h-8 w-1/3 animate-pulse rounded bg-gray-200" />
      <article>
        <div className="text-balance mb-12 h-16 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="hidden md:mb-12 md:block">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="mb-8 sm:mx-0 md:mb-16">
          <div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 block md:hidden">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          <div className="mb-6 text-lg">
            <div className="mb-4 h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </article>
      <aside>
        <hr className="border-accent-2 mb-24 mt-28" />
        <div className="mb-8 h-12 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="mb-32 grid grid-cols-1 gap-y-20 md:grid-cols-2 md:gap-x-16 md:gap-y-32 lg:gap-x-32">
          {Array.from({ length: 2 }).map((_, i) => (
            <article key={i}>
              <div className="group mb-5 block">
                <div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-gray-200" />
              </div>
              <div className="mb-3 h-8 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-gray-200" />
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}