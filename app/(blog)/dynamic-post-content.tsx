import { type PortableTextBlock } from "next-sanity";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Avatar from "@/app/(blog)/avatar";
import CoverImage from "@/app/(blog)/cover-image";
import DateComponent from "@/app/(blog)/date";
import MoreStories from "@/app/(blog)/more-stories";
import PortableText from "@/app/portable-text";
import LoadingStories from "@/app/(blog)/loading-stories";

import * as demo from "@/sanity/lib/demo";
import { sanityFetchPPR } from "@/sanity/lib/fetch-ppr";
import { postQuery, settingsQuery } from "@/sanity/lib/queries";

type Props = {
    slug: string;
};

export default async function DynamicPostContent({ slug }: Props) {
    const [post, settings] = await Promise.all([
        sanityFetchPPR({ query: postQuery, params: { slug } }),
        sanityFetchPPR({ query: settingsQuery }),
    ]);

    if (!post?._id) {
        return notFound();
    }

    return (
        <div className="container mx-auto px-5">
            <h2 className="mb-16 mt-10 text-2xl font-bold leading-tight tracking-tight md:text-4xl md:tracking-tighter">
                <Link href="/" className="hover:underline">
                    {settings?.title || demo.title}
                </Link>
            </h2>
            <article>
                <h1 className="text-balance mb-12 text-6xl font-bold leading-tight tracking-tighter md:text-7xl md:leading-none lg:text-8xl">
                    {post.title}
                </h1>
                <div className="hidden md:mb-12 md:block">
                    {post.author && (
                        <Avatar name={post.author.name} picture={post.author.picture} />
                    )}
                </div>
                <div className="mb-8 sm:mx-0 md:mb-16">
                    <CoverImage image={post.coverImage} priority />
                </div>
                <div className="mx-auto max-w-2xl">
                    <div className="mb-6 block md:hidden">
                        {post.author && (
                            <Avatar name={post.author.name} picture={post.author.picture} />
                        )}
                    </div>
                    <div className="mb-6 text-lg">
                        <div className="mb-4 text-lg">
                            <DateComponent dateString={post.date} />
                        </div>
                    </div>
                </div>
                {post.content?.length && (
                    <PortableText
                        className="mx-auto max-w-2xl prose-violet lg:prose-xl dark:prose-invert"
                        value={post.content as PortableTextBlock[]}
                    />
                )}
            </article>
            <aside>
                <hr className="border-accent-2 mb-24 mt-28" />
                <h2 className="mb-8 text-6xl font-bold leading-tight tracking-tighter md:text-7xl">
                    Recent Stories
                </h2>
                <Suspense fallback={<LoadingStories />}>
                    <MoreStories skip={post._id} limit={2} />
                </Suspense>
            </aside>
        </div>
    );
}