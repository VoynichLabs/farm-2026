# 09-Apr-2026 — Weekly Updates & Content Refresh

## Scope
- New "Field Notes" content system + pages (replaces Diary)
- Instagram feed embed (@markbarney121, curated embeds)
- Chicken enclosure project shelved (AI design showcase narrative)
- Flock roster update: Birdgit deceased, Birdadette chick, incoming Cackle Hatchery + local birds
- New photos: command center, April 2026 series, Guardian detections, aerial, drawings
- Homepage refresh: featured field note, updated stats, Instagram section
- Guardian project docs updated through v2.11.0
- Gallery expanded

## Architecture
- `content/field-notes/*.mdx` — weekly update MDX files with cover photo + photo array frontmatter
- `FieldNote` interface + `getAllFieldNotes()` / `getFieldNote()` in `lib/content.ts`
- `app/field-notes/page.tsx` + `app/field-notes/[slug]/page.tsx` — photo-forward feed + detail
- `app/components/InstagramFeed.tsx` — client component using embed.js + `content/instagram-posts.json`
- `"shelved"` added to `Project.status` union

## TODOs
1. [x] Write plan doc
2. [ ] Update `lib/content.ts` — FieldNote interface, loaders, shelved status
3. [ ] Update `content/flock-profiles.json` — Birdgit deceased, Birdadette chick, incoming birds
4. [ ] Shelve chicken-enclosure project, rewrite narrative
5. [ ] Copy additional photos (command center, detections, aerial, drawings)
6. [ ] Create field-notes content (3 MDX files)
7. [ ] Create field-notes pages (feed + detail)
8. [ ] Update layout nav (Diary -> Field Notes)
9. [ ] Create Instagram embed component + data
10. [ ] Refresh homepage
11. [ ] Update projects pages (shelved badge)
12. [ ] Update flock page (deceased + incoming)
13. [ ] Update gallery with new photos
14. [ ] Update Guardian project docs
15. [ ] Handle diary redirect, CHANGELOG, build verify
