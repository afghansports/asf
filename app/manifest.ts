import type { MetadataRoute } from "next";

/**
 * PWA manifest. Renders /manifest.webmanifest dynamically. Needed for the
 * iOS / Android "Add to Home Screen" install flow.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Afghan Sports Federation",
    short_name: "ASF",
    description: "Building community through sports excellence since 1998.",
    start_url: "/",
    display: "standalone",
    background_color: "#F2F2F2",
    theme_color: "#1A1D21",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      { src: "/asf-logo-round.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/asf-logo-round.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/asf-logo-round.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["sports", "social", "lifestyle"],
  };
}
