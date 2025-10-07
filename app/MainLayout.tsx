import "@/app/globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { VisualEditing } from "next-sanity/visual-editing";
import { Suspense } from "react";

import { Inter } from "next/font/google";
import { draftMode } from "next/headers";

import AlertBanner from "@/app/alert-banner";
import DynamicFooter from "@/app/(blog)/dynamic-footer";
import FooterSkeleton from "@/app/(blog)/footer-skeleton";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";
import { CartProvider } from "@/contexts/CartContext";

// Enable PPR for blog layout
export const experimental_ppr = true;

// Metadata generation moved to individual pages to avoid layout-level data fetching

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isEnabled: isDraftMode } = await draftMode();

    return (
        <ClerkProvider>
            <CartProvider>
                <html lang="en" className={`${inter.variable} bg-white text-black`}>
                    <body>
                        <section className="min-h-screen">
                            {isDraftMode && <AlertBanner />}
                            <Header />
                            <main>{children}</main>
                            <Suspense fallback={<FooterSkeleton />}>
                                <DynamicFooter />
                            </Suspense>
                        </section>
                        {isDraftMode && <VisualEditing />}
                        <SpeedInsights />
                        <Toaster richColors />
                    </body>
                </html>
            </CartProvider>
        </ClerkProvider>
    );
}
