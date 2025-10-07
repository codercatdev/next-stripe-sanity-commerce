import { Suspense } from "react";
import MoreStories from "@/app/(blog)/more-stories";
import LoadingStories from "@/app/(blog)/loading-stories";
import { sanityFetchPPR } from "@/sanity/lib/fetch-ppr";
import { heroQuery } from "@/sanity/lib/queries";

export default async function ConditionalMoreStories() {
    const heroPost = await sanityFetchPPR({ query: heroQuery });

    if (!heroPost?._id) {
        return null;
    }

    return (
        <aside>
            <h2 className="mb-8 text-6xl font-bold leading-tight tracking-tighter md:text-7xl">
                More Stories
            </h2>
            <Suspense fallback={<LoadingStories />}>
                <MoreStories skip={heroPost._id} limit={100} />
            </Suspense>
        </aside>
    );
}