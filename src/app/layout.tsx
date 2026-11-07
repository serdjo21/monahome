import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-bodoni",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jost",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://monahome.rs";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "monahome — home collection",
    template: "%s — monahome",
  },
  description:
    "Peškiri, pledovi i šolje koji pretvaraju svakodnevne trenutke u male rituale. Tople nijanse, prirodni materijali, nove kolekcije svake sezone.",
  applicationName: "monahome",
  openGraph: {
    type: "website",
    siteName: "monahome",
    locale: "sr_RS",
    url: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#2a211d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr-Latn" className={`${bodoni.variable} ${jost.variable}`}>
      <body data-theme="kamen" className="min-h-dvh">
        {children}
      </body>
    </html>
  );
}