import type { MetadataRoute } from "next";
import { getSettings } from "@/features/settings/queries";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings();
  return {
    name: settings.store_name,
    short_name: settings.store_name,
    start_url: "/vi",
    display: "standalone",
    background_color: "#141210",
    theme_color: "#141210",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
