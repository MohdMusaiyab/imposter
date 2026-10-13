import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Imposter | Word Deduction Game",
    short_name: "Imposter",
    description:
      "Find the liar. A fast-paced real-time multiplayer word deduction party game.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#16161a",
    orientation: "portrait-primary",
    categories: ["games", "entertainment"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
