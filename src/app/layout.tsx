import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#CD576A",
  width: "device-width",
  initialScale: 1,
};

const BASE_URL = "https://te-sueno-bobba-tea.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Té Sueño | Bubble Tea en Calkiní, Campeche",
  description: "Menú de Té Sueño en Calkiní, Campeche. Bubble tea, frappes, sodas italianas y bebidas especiales. Personaliza tu orden y pídela por WhatsApp.",
  manifest: "/manifest.json",
  keywords: ["té sueño", "bubble tea calkiní", "bobba tea calkiní", "te sueño calkiní", "frappe calkiní", "soda italiana calkiní", "campeche bubble tea"],
  alternates: {
    canonical: BASE_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Té Sueño",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "oOauXUqTM2tI568bzi2gs1PNhWoHD3aYXKuyCCOE12M",
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Té Sueño",
    title: "Té Sueño | Bubble Tea en Calkiní, Campeche",
    description: "Bubble tea, frappes, sodas italianas y bebidas especiales en Calkiní, Campeche. Personaliza tu orden y pídela por WhatsApp.",
    locale: "es_MX",
    images: [{ url: "/apple-touch-icon.png", width: 180, height: 180, alt: "Té Sueño" }],
  },
  twitter: {
    card: "summary",
    title: "Té Sueño | Bubble Tea en Calkiní",
    description: "Bubble tea, frappes y sodas italianas en Calkiní, Campeche.",
    images: ["/apple-touch-icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "name": "Té Sueño",
    "alternateName": "Te Sueño Bobba Tea",
    "description": "Bubble tea, frappes, sodas italianas y bebidas especiales en Calkiní, Campeche.",
    "url": BASE_URL,
    "telephone": "+529969634631",
    "servesCuisine": ["Bubble Tea", "Frappe", "Soda Italiana", "Té Frutal"],
    "menu": BASE_URL,
    "hasMap": "https://maps.google.com/?q=Calkiní,Campeche,México",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Calkiní",
      "addressRegion": "Campeche",
      "addressCountry": "MX",
    },
    "areaServed": {
      "@type": "City",
      "name": "Calkiní",
    },
    "sameAs": [
      "https://menu-tea.vercel.app",
    ],
  };

  return (
    <html lang="es">
      <body className={`${poppins.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
