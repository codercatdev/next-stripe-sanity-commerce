import "@/app/globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { toPlainText, type PortableTextBlock } from "next-sanity";
import { VisualEditing } from "next-sanity/visual-editing";

import { Inter } from "next/font/google";
import { draftMode } from "next/headers";

import AlertBanner from "@/app/alert-banner";
import PortableText from "@/app/portable-text";

import * as demo from "@/sanity/lib/demo";
import { sanityFetch } from "@/sanity/lib/fetch";
import { settingsQuery } from "@/sanity/lib/queries";
import { resolveOpenGraphImage } from "@/sanity/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch({
    query: settingsQuery,
    // Metadata should never contain stega
    stega: false,
  });
  const title = settings?.title || demo.title;
  const description = settings?.description || demo.description;

  const ogImage = resolveOpenGraphImage(settings?.ogImage);
  let metadataBase: URL | undefined = undefined;
  try {
    metadataBase = settings?.ogImage?.metadataBase
      ? new URL(settings.ogImage.metadataBase)
      : undefined;
  } catch {
    // ignore
  }
  return {
    metadataBase,
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description: toPlainText(description),
    openGraph: {
      images: ogImage ? [ogImage] : [],
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await sanityFetch({ query: settingsQuery });
  const footer = data?.footer || [];
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} bg-white text-black`}>
        <body>
          <section className="min-h-screen">
            {isDraftMode && <AlertBanner />}
            <main>{children}</main>
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
          </section>
          {isDraftMode && <VisualEditing />}
          <SpeedInsights />
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
