import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SAKLAW — Local search for Kawit, Cavite",
    short_name: "SAKLAW",
    description: "Find places, services, announcements, and events in Kawit, Cavite.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0e6b3f",
    icons: [
      { src: "/brand/saklaw-kawit-app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/saklaw-kawit-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/saklaw-kawit-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/saklaw-kawit-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
