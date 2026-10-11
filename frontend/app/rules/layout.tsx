import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Play Imposter | Official Game Rules & Guide",
  description:
    "Official rulebook for Imposter, the word deduction party game. Complete rules and instructions for both Multi-Device online play and Single-Device (Hotseat) pass-the-phone mode.",
  alternates: {
    canonical: "/rules",
  },
  openGraph: {
    title: "How to Play Imposter | Official Game Rules",
    description:
      "Learn how to catch the liar. Rules, strategies, and instructions for playing Imposter with friends online or on a single device.",
    url: "https://hey-imposter.vercel.app/rules",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Play Imposter | Official Game Rules",
    description:
      "Learn how to catch the liar. Official rules and guide for Imposter.",
  },
};

export default function RulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
