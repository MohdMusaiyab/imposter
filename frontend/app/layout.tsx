import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Imposter | The Word Deduction Party Game",
    template: "%s | Imposter"
  },
  description:
    "A fast-paced, real-time multiplayer word deduction game. Play with friends, uncover the hidden imposter, and find out who is lying. Trust the tasks, not the talking.",
  keywords: ["imposter", "word game", "multiplayer", "social deduction", "party game", "online game", "bluffing"],
  openGraph: {
    title: "Imposter | The Word Deduction Party Game",
    description: "A fast-paced, real-time multiplayer word deduction game. Can you find the liar?",
    type: "website",
    locale: "en_US",
    siteName: "Imposter",
  },
  twitter: {
    card: "summary_large_image",
    title: "Imposter | The Word Deduction Party Game",
    description: "Uncover the hidden imposter among your friends in this real-time word deduction game.",
  },
  verification: {
    google: "tZEIXbvD5UYrx3nodRLPoBvTizs8JtiI0uhBxmyLM4M",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

