import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { DemoStateHydrator } from "@/components/shared/demo-state-hydrator";
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
  title: {
    default: "Kenakata | Multi-vendor marketplace",
    template: "%s | Kenakata",
  },
  description: "Shop from thousands of trusted vendors across Bangladesh.",
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
      </body>
    </html>
  );
}
