import Link from "next/link";

import Avatar from "@/app/(blog)/avatar";
import CoverImage from "@/app/(blog)/cover-image";
import DateComponent from "@/app/(blog)/date";
import Onboarding from "@/app/(blog)/onboarding";

import type { HeroQueryResult } from "@/sanity.types";
import { sanityFetchPPR } from "@/sanity/lib/fetch-ppr";
import { heroQuery } from "@/sanity/lib/queries";

function HeroPost({
    title,
    slug,
    excerpt,
    coverImage,
    date,
    author,
}: Pick<
    Exclude<HeroQueryResult, null>,
    "title" | "coverImage" | "date" | "excerpt" | "author" | "slug"
>) {
    return (
        <article>
            <Link className="group mb-8 block md:mb-16" href={`/posts/${slug}`}>
                <CoverImage image={coverImage} priority />
            </Link>
            <div className="mb-20 md:mb-28 md:grid md:grid-cols-2 md:gap-x-16 lg:gap-x-8">
                <div>
                    <h3 className="text-pretty mb-4 text-4xl leading-tight lg:text-6xl">
                        <Link href={`/posts/${slug}`} className="hover:underline">
                            {title}
                        </Link>
                    </h3>
                    <div className="mb-4 text-lg md:mb-0">
                        <DateComponent dateString={date} />
                    </div>
                </div>
                <div>
                    {excerpt && (
                        <p className="text-pretty mb-4 text-lg leading-relaxed">
                            {excerpt}
                        </p>
                    )}
                    {author && <Avatar name={author.name} picture={author.picture} />}
                </div>
            </div>
        </article>
    );
}

export default async function DynamicHero() {
    const heroPost = await sanityFetchPPR({ query: heroQuery });

    if (!heroPost) {
        return <Onboarding />;
    }

    return (
        <HeroPost
            title={heroPost.title}
            slug={heroPost.slug}
            coverImage={heroPost.coverImage}
            excerpt={heroPost.excerpt}
            date={heroPost.date}
            author={heroPost.author}
        />
    );
}