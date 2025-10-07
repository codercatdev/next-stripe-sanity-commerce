import type { ClientPerspective, QueryParams } from "next-sanity";
import { draftMode } from "next/headers";

import { client } from "@/sanity/lib/client";
import { token } from "@/sanity/lib/token";

/**
 * PPR-optimized version of sanityFetch that removes automatic revalidation
 * to allow Next.js PPR to handle caching and revalidation strategy
 */
export async function sanityFetchPPR<const QueryString extends string>({
    query,
    params = {},
    perspective: _perspective,
    stega: _stega,
}: {
    query: QueryString;
    params?: QueryParams | Promise<QueryParams>;
    perspective?: Omit<ClientPerspective, "raw">;
    stega?: boolean;
}) {
    const perspective =
        _perspective || (await draftMode()).isEnabled
            ? "previewDrafts"
            : "published";
    const stega =
        _stega ||
        perspective === "previewDrafts" ||
        process.env.VERCEL_ENV === "preview";

    if (perspective === "previewDrafts") {
        return client.fetch(query, await params, {
            stega,
            perspective: "previewDrafts",
            // The token is required to fetch draft content
            token,
            // The `previewDrafts` perspective isn't available on the API CDN
            useCdn: false,
            // For draft mode, we still need to disable caching
            next: { revalidate: 0 },
        });
    }

    // For published content with PPR, we remove the revalidate setting
    // and let PPR handle the caching strategy
    return client.fetch(query, await params, {
        stega,
        perspective: "published",
        // The `published` perspective is available on the API CDN
        useCdn: true,
        // No revalidate setting - let PPR handle caching
    });
}