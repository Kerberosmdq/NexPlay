import type { MetadataRoute } from "next";

// BDR-0002 §8: the hex token is the app icon. Next.js App Router auto-links this
// as the PWA manifest — no manual <link rel="manifest"> needed.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexPlay",
    short_name: "NexPlay",
    description: "Juega en familia y amigos en tiempo real.",
    start_url: "/",
    display: "standalone",
    background_color: "#2a66e0",
    theme_color: "#2a66e0",
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
