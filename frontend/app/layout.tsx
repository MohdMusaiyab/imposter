import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hey-imposter.vercel.app"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Imposter | The Word Deduction Game",
    template: "%s | Imposter",
  },
  description:
    "Can you spot the liar? Play Imposter free online with friends. One player doesn’t know the real word. Give clues, bluff, and vote them out.",
  keywords: [
    "imposter game",
    "impostor game",
    "imposter word game",
    "online imposter game",
    "free imposter game",
    "imposter game with friends",
    "word deduction game",
    "social deduction game",
    "online party game",
    "browser party game",
    "multiplayer word game",
    "bluffing game",
    "find the imposter",
    "who is the imposter game",
  ],
  openGraph: {
    title: "Imposter: Can You Spot the Liar?",
    description:
      "Free online word game for friends. One player has no idea what the word is. Give clues, bluff, and vote them out.",
    url: "https://hey-imposter.vercel.app",
    type: "website",
    locale: "en_US",
    siteName: "Imposter",
  },
  twitter: {
    card: "summary_large_image",
    title: "Imposter: Can You Spot the Liar?",
    description:
      "Free online word game for friends. One player has no idea what the word is. Give clues, bluff, and vote them out.",
  },
  verification: {
    google: "tZEIXbvD5UYrx3nodRLPoBvTizs8JtiI0uhBxmyLM4M",
  },
  appleWebApp: {
    capable: true,
    title: "Imposter",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["WebApplication", "VideoGame"],
  name: "Imposter",
  applicationCategory: "GameApplication",
  genre: "Social Deduction Party Game",
  operatingSystem: "All modern browsers (iOS, Android, Windows, macOS, Linux)",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  url: "https://hey-imposter.vercel.app",
  description:
    "A fast-paced, real-time multiplayer word deduction game. Play with friends, uncover the hidden imposter, and find out who is lying.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  playMode: "MultiPlayer",
  numberOfPlayers: {
    "@type": "QuantitativeValue",
    minValue: 3,
    maxValue: 10,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
