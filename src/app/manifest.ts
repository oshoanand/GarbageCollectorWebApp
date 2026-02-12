import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Услуги64",
    short_name: "Услуги64",
    description: "Garbage Collection ",
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
