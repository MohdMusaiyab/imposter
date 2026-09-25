import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMPOSTER — All Points Bulletin",
  description:
    "Eight suspects. One of them is lying. A real-time multiplayer word deduction game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
