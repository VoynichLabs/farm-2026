# Web-presence tightening — retire static gallery, kill Birdadette retrospective, unify social CTA (23-Apr-2026)

## Context

Boss clarified the role of this site relative to the broadcast surfaces:

- **Broadcast:** Instagram (`@pawel_and_pawleen`) + Facebook (Yorkies App page). Posts are auto-published from the Guardian pipeline on the Mac Mini. See CLAUDE.md → "Instagram posting" + "Facebook cross-posting".
- **This website (farm.markbarney.net):** NOT a broadcast mirror. Its unique value is (a) multi-camera live Guardian dashboard, (b) searchable/filterable gem archive at `/gallery/gems`, (c) flock roster + breed reference, (d) long-form field notes, (e) retrospectives/history, (f) yard-diary timelapse stockpile.

Two things Boss corrected in the last turn:

1. **The VLM can't reliably identify Birdadette.** The 18 "strong-tier birdadette" frames I built `/flock/birdadette` on yesterday are mis-tags — those are other chicks, not her. The page misleads. Retire.
2. **The static `/gallery` (hand-curated `content/gallery.json`)** is dead weight next to the live `/gallery/gems` surface and the yard-diary. Retire.

Also: the `InstagramSection` on the homepage still says "Follow @markbarney121" — the farm account is `@pawel_and_pawleen`. And there's no Facebook CTA at all. Fix both.

## Scope

**In:**
- Delete `/flock/birdadette` route + `lib/birdadette.ts` + the retrospective card that was added to `/flock`.
- Retire `/gallery` static: convert the route to a server-side redirect to `/gallery/gems`, delete the now-unreferenced `content/gallery.json`, and repoint every `href="/gallery"` in the codebase directly to `/gallery/gems`.
- Replace `InstagramSection` with `SocialSection` — a single homepage CTA block that links out to both Instagram (`@pawel_and_pawleen`) and Facebook (Yorkies App, page_id `614607655061302`). No embed script, no curated-posts JSON, no attempt to mirror IG content.
- Delete the now-unused `app/components/InstagramFeed.tsx` and `content/instagram-posts.json`.
- Update `CLAUDE.md`'s "Pages" + "Content sources" sections to reflect the new reality.
- Save a memory note so a future assistant doesn't rebuild `/flock/birdadette` on the same bad VLM tag.

**Out (explicitly):**
- No new "IG mirror" rail of `@pawel_and_pawleen`'s recent posts. The pipeline already commits the JPEGs to `public/photos/brooder/`, but mirroring would duplicate what IG/FB already show, and maintaining a curated post list invites drift. Point OUT, don't copy IN.
- No Facebook embed (FB's embed SDK is heavy and gated; a plain link is enough).
- No hero tagline rewrite.
- No yard-as-video work (still queued as a follow-up, not this pass).
- No restructure of `/flock`, field notes, or Guardian integration — they're doing their jobs.
- No changes to the pipeline, the pipeline's auto-commits to `public/photos/**`, or any FB/IG credentials.

## Architecture

### /flock/birdadette removal

`app/flock/birdadette/page.tsx` + `lib/birdadette.ts` → deleted. Retrospective card block in `app/flock/page.tsx` → removed. `/flock` returns to its pre-v1.10 structure (hero → roosters → hens → in memoriam → breed notes).

**Why a hard delete rather than a "waiting for data" empty state:** the VLM will keep producing false-positive Birdadette tags at the same rate; an empty-state page would never fill, just confuse. When the pipeline can reliably ID her (separate project, backend change), the retrospective is cheap to rebuild from the plan doc.

Memory note `feedback_vlm_birdadette_false_positives.md` records the failure mode so a future assistant doesn't take a third swing at it with the same broken source.

### /gallery retirement

`app/gallery/page.tsx` becomes a minimal server component that calls `redirect("/gallery/gems")` from `next/navigation`. Next.js emits a 307 at the edge; bookmarks + IG-bio links + old field-note links continue to work, they just land on the live surface.

`content/gallery.json` → deleted; no other file imports it after the page rewrite (grep confirmed).

Every existing `href="/gallery"` in the codebase is repointed directly to `/gallery/gems` so the top-level nav and footer don't cost a redirect hop. Files touched: `app/layout.tsx`, `app/components/home/SiteFooter.tsx`, `app/components/home/Hero.tsx`, `app/yard/page.tsx`, `app/gallery/gems/page.tsx` (its own "← Curated archive" sibling link).

The `/gallery/gems` sibling-nav used to read `← Curated archive · Yard diary →`; it now reads just `Yard diary →` since the archive no longer exists. `/yard`'s matching sibling nav is repointed the same way.

### Social CTA

`InstagramSection` → renamed to `SocialSection`. New body: a single two-card grid with a prominent "Follow on Instagram — @pawel_and_pawleen" card and a matching "Follow on Facebook — Yorkies App" card. Same cream-dark section background, same SectionHeader. No embed script, no client component needed — both are plain anchor tags with the IG/FB brand glyphs.

- IG link: `https://www.instagram.com/pawel_and_pawleen/`
- FB link: `https://www.facebook.com/614607655061302/` (page URL by numeric ID — canonical form per Boss's FB skill doc, which uses numeric profile-plus IDs for the same page)

Section header copy updated from "Follow the Farm" (fine) to lead with the dual-platform truth. No claim of mirroring.

`app/components/InstagramFeed.tsx` + `content/instagram-posts.json` → deleted. The embed path has been unused in practice since 09-Apr when the JSON was first stubbed; no curated posts were ever added.

`app/page.tsx` swaps `InstagramSection` import for `SocialSection`.

### CLAUDE.md updates

- "Pages" section: `/gallery` line changes from "Lightbox photo gallery (April 2026 + historical)" to "Redirects to /gallery/gems (static gallery retired 23-Apr-2026)". `/flock/birdadette` line: omitted since the route no longer exists.
- "Content sources" table: remove `content/gallery.json` + `content/instagram-posts.json` rows.
- No changes to the Instagram-posting section (accurate) or the FB-cross-posting section (accurate).

## Ordered TODOs

1. Write this plan doc. ✓
2. Delete `/flock/birdadette` + `lib/birdadette.ts`; remove retrospective card from `app/flock/page.tsx`.
3. Rewrite `app/gallery/page.tsx` as a redirect; delete `content/gallery.json`; repoint every `href="/gallery"` to `href="/gallery/gems"`.
4. Write `app/components/home/SocialSection.tsx`; delete `app/components/home/InstagramSection.tsx`, `app/components/InstagramFeed.tsx`, `content/instagram-posts.json`; swap the import in `app/page.tsx`.
5. Update CLAUDE.md.
6. Save memory note about VLM birdadette false positives; add to MEMORY.md index.
7. `npm run lint` + `npm run build`.
8. Local smoke: hit `/`, `/gallery` (should redirect to `/gallery/gems`), `/gallery/gems`, `/flock/birdadette` (should 404), `/flock`. Confirm homepage Social block shows both CTAs and links are live.
9. Update `CHANGELOG.md` — `[1.11.0] — 2026-04-23`.
10. Commit + push.

## Verification

- `npm run build` succeeds; `/gallery` now compiles as a redirect stub, `/flock/birdadette` is absent from the route table, `/flock` back to pre-1.10 layout.
- `curl -I http://localhost:3xxx/gallery` returns a 3xx to `/gallery/gems`.
- Homepage renders the new Social block with both IG + FB external links.
- `grep -rE 'href="/gallery"' app/` returns zero matches (all repointed).
- No dangling imports for `InstagramFeed`, `InstagramSection`, `content/gallery.json`, `content/instagram-posts.json`, or `lib/birdadette`.

## Docs / Changelog touchpoints

- `docs/23-Apr-2026-web-presence-tightening-plan.md` (this file).
- `CHANGELOG.md`: new `[1.11.0]` entry summarising the retirements + the social CTA swap.
- `CLAUDE.md`: Pages + Content sources table updates.
- No `docs/FRONTEND-ARCHITECTURE.md` changes needed — the SSoT patterns are unaffected.

## Future follow-ups (not this pass)

- `/yard` as an actual playable timelapse reel (video or auto-scroll strip) instead of a grid.
- Stories-style portrait rail for s7-cam 9:16 gems (if it adds value the `LatestFlockFrames` rail doesn't already cover).
- Rebuild a Birdadette retrospective once the backend can reliably identify her (proposal: a distinct `confirmed_individuals` field gated on human review, or a VLM fine-tune, or a hand-curation admin route — all separate engineering).
- Trim `FlockPreviewStrip` / `ActiveProjects` if they start feeling static next to the live-data sections above them.
