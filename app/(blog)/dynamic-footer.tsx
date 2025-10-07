import { type PortableTextBlock } from "next-sanity";
import PortableText from "@/app/portable-text";
import { sanityFetchPPR } from "@/sanity/lib/fetch-ppr";
import { settingsQuery } from "@/sanity/lib/queries";

export default async function DynamicFooter() {
  const data = await sanityFetchPPR({ query: settingsQuery });
  const footer = data?.footer || [];

  return (
    <footer className="bg-accent-1 border-accent-2 border-t">
      <div className="container mx-auto px-5">
        {footer.length > 0 ? (
          <PortableText
            className="prose-sm text-pretty bottom-0 w-full max-w-none bg-white py-12 text-center md:py-20"
            value={footer as PortableTextBlock[]}
          />
        ) : (
          <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 sm:py-16 lg:px-8">
            <p className="text-center text-xs leading-5 text-gray-500">
              © {new Date().getFullYear()} CodingCat.dev, Inc. All rights reserved.
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}