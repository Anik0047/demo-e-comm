import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { DemoStateHydrator } from "@/components/shared/demo-state-hydrator";
import { ToastViewport } from "@/components/shared/toast-viewport";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kenakata.com"),
  title: {
    default: "Bangladesh marketplace demo",
    template: "%s | Kenakata",
  },
  description: "Explore a frontend marketplace demonstration with sample products and independent seller storefronts in Bangladesh.",
  openGraph: {
    type: "website",
    siteName: "Kenakata",
    title: "Bangladesh marketplace demo",
    description: "Explore a frontend marketplace demonstration with sample products and independent seller storefronts in Bangladesh.",
    locale: "en_BD",
  },
  twitter: {
    card: "summary",
    title: "Bangladesh marketplace demo",
    description: "Explore a frontend marketplace demonstration with sample products and independent seller storefronts in Bangladesh.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${plusJakarta.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh bg-canvas font-body text-ink">
        <DemoStateHydrator />
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
