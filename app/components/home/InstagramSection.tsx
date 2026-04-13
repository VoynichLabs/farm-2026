/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Homepage Instagram block — header + curated-embeds feed. Reads the
 *   curated URL list from content/instagram-posts.json. Extracted from
 *   app/page.tsx during Phase 1 of the frontend SRP/DRY rewrite.
 * SRP/DRY check: Pass — single responsibility (wrap InstagramFeed with the
 *   section header + background). See docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md.
 */
import InstagramFeed from "@/app/components/InstagramFeed";
import instagramPosts from "@/content/instagram-posts.json";
import SectionHeader from "@/app/components/primitives/SectionHeader";

export default function InstagramSection() {
  return (
    <section className="bg-cream-dark">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <SectionHeader
          title="Follow the Farm"
          subtitle="More photos, more birds, more behind-the-scenes on Instagram."
        />
        <InstagramFeed posts={instagramPosts} />
      </div>
    </section>
  );
}
