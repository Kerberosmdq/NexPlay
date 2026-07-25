import type { MetadataRoute } from "next";

// BDR-0001 §4: the hexagon is real. Next.js App Router auto-links this
// as the PWA manifest — no manual <link rel="manifest"> needed.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexPlay",
    short_name: "NexPlay",
    description: "Juega en familia y amigos en tiempo real.",
    start_url: "/",
    display: "standalone",
    background_color: "#efe6d6",
    theme_color: "#1f6b52",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
