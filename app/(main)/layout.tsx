import "@/app/globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { toPlainText } from "next-sanity";
import { VisualEditing } from "next-sanity/visual-editing";
import { Suspense } from "react";

import { Inter } from "next/font/google";
import { draftMode } from "next/headers";

import AlertBanner from "@/app/alert-banner";
import DynamicMainFooter from "@/app/(main)/dynamic-main-footer";
import MainFooterSkeleton from "@/app/(main)/main-footer-skeleton";

// Enable PPR for main layout
export const experimental_ppr = true;

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { CartProvider } from "@/contexts/CartContext";

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
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} bg-white text-black`}>
        <body>
          <CartProvider>
            <section className="min-h-screen">
              {isDraftMode && <AlertBanner />}
              <main>{children}</main>
              <Suspense fallback={<MainFooterSkeleton />}>
                <DynamicMainFooter />
              </Suspense>
            </section>
          </CartProvider>
          {isDraftMode && <VisualEditing />}
          <SpeedInsights />
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
