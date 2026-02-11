import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EcoCollect",
    short_name: "EcoCollect",
    description: "Garbage Collection Marketplace",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#4CAF50",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
