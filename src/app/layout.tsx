import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/settings";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { DataGate } from "@/components/ui/DataGate";
import { Footer } from "@/components/ui/Footer";
import { ServiceWorker } from "@/components/ui/ServiceWorker";
import { SkipLink } from "@/components/ui/SkipLink";
import { fr } from "@/lib/i18n/fr";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  // Static metadata is French (the default language); PageTitle updates the tab title for English readers.
  title: { default: fr["app.metaTitle"], template: "%s · MUSEUM" },
  description: fr["app.metaDescription"],
  manifest: "/manifest.webmanifest",
  applicationName: "MUSEUM",
  appleWebApp: { capable: true, title: "MUSEUM", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f6f2ea",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light" suppressHydrationWarning className={`${sans.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <SkipLink />
        <Header />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-8 md:pb-16">
          <DataGate>{children}</DataGate>
        </main>
        <Footer />
        <BottomNav />
        <ServiceWorker />
      </body>
    </html>
  );
}
