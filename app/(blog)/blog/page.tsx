import { Suspense } from "react";
import DynamicIntro from "@/app/(blog)/dynamic-intro";
import DynamicHero from "@/app/(blog)/dynamic-hero";
import ConditionalMoreStories from "@/app/(blog)/conditional-more-stories";
import LoadingHero from "@/app/(blog)/loading-hero";
import LoadingStories from "@/app/(blog)/loading-stories";

// Enable PPR for this page
export const experimental_ppr = true;

// Create a simple loading fallback for the intro section
function LoadingIntro() {
  return (
    <section className="mt-16 mb-16 flex flex-col items-center lg:mb-12 lg:flex-row lg:justify-between">
      <div className="h-16 w-3/4 animate-pulse rounded bg-gray-200 lg:h-20 lg:pr-8" />
      <div className="mt-5 h-6 w-full animate-pulse rounded bg-gray-200 lg:mt-0 lg:w-1/2 lg:pl-8" />
    </section>
  );
}

export default function Page() {
  return (
    <div className="container mx-auto px-5">
      {/* Static shell that can be pre-rendered */}
      <Suspense fallback={<LoadingIntro />}>
        <DynamicIntro />
      </Suspense>

      <Suspense fallback={<LoadingHero />}>
        <DynamicHero />
      </Suspense>

      <Suspense fallback={<LoadingStories />}>
        <ConditionalMoreStories />
      </Suspense>
    </div>
  );
}
