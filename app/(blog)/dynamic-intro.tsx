import PortableText from "@/app/portable-text";

import type { SettingsQueryResult } from "@/sanity.types";
import * as demo from "@/sanity/lib/demo";
import { sanityFetchPPR } from "@/sanity/lib/fetch-ppr";
import { settingsQuery } from "@/sanity/lib/queries";

function Intro(props: { title: string | null | undefined; description: any }) {
    const title = props.title || demo.title;
    const description = props.description?.length
        ? props.description
        : demo.description;
    return (
        <section className="mt-16 mb-16 flex flex-col items-center lg:mb-12 lg:flex-row lg:justify-between">
            <h1 className="text-balance text-6xl font-bold leading-tight tracking-tighter lg:pr-8 lg:text-8xl">
                {title || demo.title}
            </h1>
            <h2 className="text-pretty mt-5 text-center text-lg lg:pl-8 lg:text-left">
                <PortableText
                    className="prose-lg"
                    value={description?.length ? description : demo.description}
                />
            </h2>
        </section>
    );
}

export default async function DynamicIntro() {
    const settings = await sanityFetchPPR({
        query: settingsQuery,
    });

    return <Intro title={settings?.title} description={settings?.description} />;
}