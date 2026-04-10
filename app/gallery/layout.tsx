import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from the farm — chicks, hawks, the command center, and years of Hampton CT homesteading.",
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
