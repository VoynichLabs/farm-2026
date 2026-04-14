<!--
Author: Claude Opus 4.6 (1M context)
Date: 14-April-2026
PURPOSE: Frontend implementation plan for the farm-guardian image-archive
         REST surface (v2.25.0 Layer 1). Spells out what ships, how it's
         structured for modularity + reuse, the ordered TODO list, and the
         verification checklist. This is the farm-2026-internal counterpart
         to the cross-repo plan at
         `docs/14-Apr-2026-image-archive-dataset-and-frontend-plan.md`.
SRP/DRY check: Pass — does not duplicate the cross-repo plan; this one is
               implementation-order, file layout, and modularity contract.
-->

# Frontend Gems — Implementation Plan

**Parent plan:** `docs/14-Apr-2026-image-archive-dataset-and-frontend-plan.md` (Parts 2.b/2.c are the authoritative spec — this plan is strictly about how we land it in this repo).
**Backend commit live:** farm-guardian v2.25.0 (uncommitted in tree, running in-process on the Mini; Cloudflare tunnel verified — `curl https://guardian.markbarney.net/api/v1/images/stats` returns 721 rows, 11 gems, 3 birdadette sightings).
**Status:** Draft — awaiting Boss approval, then implementation.

---

## Scope

**In (v0.1):**

1. Shared TypeScript types for the image archive (extend existing `app/components/guardian/types.ts`).
2. `lib/gems.ts` — typed fetcher helpers (`fetchGems`, `fetchGem`, `fetchRecent`, `fetchImageStats`), server-side cached via `next: { revalidate: 300 }`.
3. `lib/gems-format.ts` — pure formatters (camera → hardware label, activity → human-readable, ts → relative time, apparent-age bucket). No I/O, no framework imports.
4. Modular component set under `app/components/gems/` — every component has one responsibility, composes with the others:
   - `GemCard` — single gem tile; `variant` prop (`default` / `compact`) drives layout.
   - `GemCardBadges` — metadata pills (camera hardware label, activity).
   - `GemCaption` — draft-labelled caption block; reusable in card + lightbox.
   - `GemLightbox` — full-size modal; keyboard nav; composes `GemCaption` + `GemMetaTable`.
   - `GemMetaTable` — key/value table of a gem's metadata; used by lightbox.
   - `GemFilters` — filter bar (camera chips, activity chips, individual chips, date range).
   - `GemsGrid` — pure grid layout, consumes `GemCard[]`; used by gallery + homepage rail (rail passes `variant="compact"`).
   - `GemsLoadMore` — cursor-paginated "Load more" button with Suspense fallback.
5. `/gallery/gems` route — `page.tsx` + `GemsGallery` (server) + `GemsGalleryClient` (client — filter state, load-more, lightbox).
6. Homepage rail — `app/components/home/LatestFlockFrames.tsx`, inserted between `FlockPreviewStrip` and `LatestFieldNote`. Reuses `GemsGrid` + `GemCard variant="compact"`; no duplication.
7. Error + empty + offline states on every data surface.
8. Footer stat — small "N gems this week" widget driven by `/stats`. Ships with gallery as the discoverability hook.
9. `CHANGELOG.md` + `FRONTEND-ARCHITECTURE.md` updates.

**Out (deferred to v0.2+ per parent plan Part 2):**

- Birdadette retrospective (`/flock/birdadette`). Covered by a separate plan doc after v0.1 ships. Rationale: the Layer 1 API already supports it via `?individual=birdadette`; no backend blocker, but the retrospective is its own UX design problem and deserves its own plan + approval. Splitting it keeps v0.1 focused.
- Boss-only `/review` UI. Deferred per parent plan 2.c.4 — Finder folder browsing works for now.
- `/search` FTS endpoint consumer. Not shipped on the backend yet.
- Instagram auto-feed. Parent plan 2.f — not v0.1.
- Caption-override editor UI. Parent plan mentions `caption_is_override` in v0.2; backend table not present yet.

---

## Architecture

### File layout (everything new or modified)

```
farm-2026/
├── app/
│   ├── gallery/
│   │   └── gems/
│   │       └── page.tsx                         [NEW]  route entry; server component
│   └── components/
│       ├── gems/                                [NEW DIR]
│       │   ├── GemsGallery.tsx                  [NEW]  server; SSRs first page
│       │   ├── GemsGalleryClient.tsx            [NEW]  'use client'; state + lightbox coord
│       │   ├── GemsGrid.tsx                     [NEW]  pure grid; takes rows + renderItem
│       │   ├── GemCard.tsx                      [NEW]  variant-driven tile
│       │   ├── GemCardBadges.tsx                [NEW]  pills (camera, activity, special)
│       │   ├── GemCaption.tsx                   [NEW]  draft-labelled caption block
│       │   ├── GemLightbox.tsx                  [NEW]  'use client'; portal modal
│       │   ├── GemMetaTable.tsx                 [NEW]  meta kv table
│       │   ├── GemFilters.tsx                   [NEW]  'use client'; URL-driven chips
│       │   ├── GemsLoadMore.tsx                 [NEW]  'use client'; cursor pagination
│       │   ├── GemsEmpty.tsx                    [NEW]  empty state
│       │   ├── GemsError.tsx                    [NEW]  error state
│       │   └── GemsStatFooter.tsx               [NEW]  tiny "N gems this week" widget
│       ├── guardian/
│       │   └── types.ts                         [EDIT] add image-archive types
│       └── home/
│           └── LatestFlockFrames.tsx            [NEW]  server; reuses GemsGrid
├── lib/
│   ├── gems.ts                                  [NEW]  typed fetchers
│   └── gems-format.ts                           [NEW]  pure formatters
├── app/
│   └── page.tsx                                 [EDIT] insert <LatestFlockFrames />
├── docs/
│   └── FRONTEND-ARCHITECTURE.md                 [EDIT] SSoT table + "how to add a gallery section"
└── CHANGELOG.md                                 [EDIT] v1.7.0 entry
```

### Responsibilities — the modularity contract

| Module | Responsibility | Does NOT |
|---|---|---|
| `lib/gems.ts` | Typed HTTP to `guardian.markbarney.net/api/v1/images/*`. Cache headers, error mapping, cursor plumbing. | Format strings, render UI, interpret metadata. |
| `lib/gems-format.ts` | Pure functions: `cameraLabel(id)`, `activityLabel(a)`, `relativeTime(iso)`, `ageBucket(days)`. Uses `CAMERAS` SSoT from `lib/cameras.ts`. | Fetch, render, carry framework imports. |
| `GemsGallery` (server) | Call `fetchGems` once for the first page, SSR a `GemsGrid`, hand off to `GemsGalleryClient` for interactivity. | Hold client state. |
| `GemsGalleryClient` | Filter state synced to URL search params, load-more, lightbox open/close coordination. | Know about presentational layout (delegates to `GemsGrid`). |
| `GemsGrid` | CSS grid layout, responsive breakpoints, renders whichever `GemCard` variant is passed in. | Fetch, filter, know API shapes. |
| `GemCard` | Single tile presentation; `variant="default" \| "compact"`. Click → calls `onOpen(id)` prop. | Manage modal state, fetch. |
| `GemCardBadges` | Derive hardware-label + activity pills from a `GemRow`. | Anything else. |
| `GemCaption` | Render `caption_draft` with "Draft caption:" visual treatment; muted-weight styling. | Edit, submit, validate. |
| `GemLightbox` | Full-size modal, keyboard handlers, prev/next, metadata panel. Portal to body. | Fetch, change filters. |
| `GemFilters` | Chip group UI, push filter state to URL via Next navigation helpers. | Know where rows come from. |
| `GemsLoadMore` | Submit the cursor, append returned rows. | Re-sort, re-filter. |
| `LatestFlockFrames` | Server-fetch 6 recent rows, render a rail of `GemCard variant="compact"` inside `GemsGrid variant="rail"`. | Anything client-side. |

**Composition check.** No component imports from another component except through props. `lib/gems.ts` and `lib/gems-format.ts` are the only shared horizontal layers. Every client component declares `'use client'` on line 1 per CLAUDE.md rule.

### Data flow

```
Boss's browser                   Next server (Railway)             Mac Mini (Cloudflare tunnel)
───────────────                  ─────────────────────             ──────────────────────────
GET /gallery/gems  ──▶  page.tsx ──▶ GemsGallery (server)
                                     │
                                     └─▶ lib/gems.ts::fetchGems(params)
                                            │
                                            └──▶ https://guardian.markbarney.net/api/v1/images/gems?...
                                                    │
                                                    └──▶ images_api.py on Mini (Guardian)
                                                           │
                                                           └──▶ SQLite (image_archive)

                                     Server-renders first 24 cards
                                     Hydrates → GemsGalleryClient
                                     │
                                     ├─▶ GemFilters (URL state)
                                     ├─▶ GemsGrid → GemCard × 24
                                     └─▶ GemsLoadMore → fetch next cursor page

Click card → GemLightbox opens with full_url image + GemCaption + GemMetaTable
```

### Caching + revalidation

- `fetchGems`, `fetchRecent`, `fetchImageStats` — `next: { revalidate: 300 }` (5-minute SSR cache).
- Image bytes (`thumb_url`, `full_url`) — cached at Cloudflare edge via the `Cache-Control: public, max-age=86400, immutable` the backend emits. Use plain `<img>` not `next/image` — rows are already the right size, and `next/image` chokes on arbitrary remote domains (requires a loader config we'd need to maintain; simpler to serve the backend's own sizes).
- `GemFilters` state pushes to URL query params; Next handles the re-fetch cache dedup.

### The rules that bind — enforcement in code, not vibes

From parent plan Part 2.d. Each maps to a concrete code site:

1. **`has_concerns=1` never reaches public UI.** Enforced three ways:
   - Backend query (`images_api.py` already filters).
   - API type `GemRow` has no `concerns` field — impossible to surface.
   - `GemCard` defensively skips any row where a future shape-change might surface a truthy flag. Unit-test (eyeball with a `?include_concerns=1` fixture once):
2. **Camera labels hardware-only.** `cameraLabel(id)` always returns `CAMERAS.find(c => c.name === id)?.shortLabel` — which `lib/cameras.ts` already enforces with a file-level rule. Grep the built bundle for "brooder", "nestbox", "coop" on output — should appear only in `scene` pill strings (which are GLM-origin, not editorializing).
3. **Captions are drafts.** `GemCaption` always prefixes with a muted "Draft caption:" label. No toggle, no variant that hides it.
4. **No owner name.** Captions come from `caption_draft` — we don't add editorializing. `grep -r 'mark\|barney' app/components/gems/` must return zero matches. Part of the final QA step.
5. **`apparent_age_days = -1` → `null`.** Normalized at the boundary in `lib/gems.ts::fetchGems` mapping; the type already models it as `number | null`.
6. **Offline behavior.** Every fetch wrapped in try/catch; errors return a typed `GemsError` component. Tunnel drop = error state, not a crashed page.

---

## TODOs (ordered, each with a verification step)

### Phase 2 — types + loaders (foundation)

- [ ] **2.1** Extend `app/components/guardian/types.ts` with the types from parent plan Part 2.b. Banner comment points at the parent plan.
  - *Verify:* `tsc --noEmit` clean; no duplicate exports.
- [ ] **2.2** Create `lib/gems.ts` with `fetchGems`, `fetchGem`, `fetchRecent`, `fetchImageStats`. Base URL from `process.env.NEXT_PUBLIC_GUARDIAN_BASE ?? "https://guardian.markbarney.net"`. `apparent_age_days` `-1 → null` normalization at the mapping.
  - *Verify:* hit the live tunnel from a one-off `app/dev-check/page.tsx` that prints the first row; delete the probe after.
- [ ] **2.3** Create `lib/gems-format.ts` — `cameraLabel(id)`, `activityLabel(activity)`, `relativeTime(iso)`, `ageBucket(days)`. All pure; no imports beyond `CAMERAS` and `Intl`.
  - *Verify:* smoke-call from the same probe page.

### Phase 3 — gallery (HIGH priority surface)

- [ ] **3.1** `app/components/gems/GemCardBadges.tsx`, `GemCaption.tsx`, `GemMetaTable.tsx` — the smallest primitives; no client directive needed on these.
- [ ] **3.2** `GemCard.tsx` with `variant` prop. `compact` drops badges + shortens caption preview.
- [ ] **3.3** `GemsGrid.tsx` — responsive grid (1/2/3/4 cols at sm/md/lg/xl); `variant="rail"` flips to horizontal scroll.
- [ ] **3.4** `GemLightbox.tsx` (`'use client'`) — portal modal, ESC + arrow keys, focus trap. Built with a native `<dialog>` element for keyboard accessibility for free.
- [ ] **3.5** `GemFilters.tsx` (`'use client'`) — chips for camera / activity / individual + date range presets. Pushes to URL via `useRouter` + `useSearchParams`.
- [ ] **3.6** `GemsLoadMore.tsx` (`'use client'`) — consumes current cursor from props, fetches next page, merges rows into lifted state.
- [ ] **3.7** `GemsEmpty.tsx`, `GemsError.tsx` — static states. `GemsError` includes "Live feeds still up → /projects/guardian" link per parent plan.
- [ ] **3.8** `GemsGallery.tsx` (server) — orchestrates: parse search params, call `fetchGems`, SSR first page into `GemsGrid`, mount `GemsGalleryClient` with initial rows + cursor.
- [ ] **3.9** `GemsGalleryClient.tsx` (`'use client'`) — filter state ↔ URL, merges load-more results, lightbox open/close.
- [ ] **3.10** `app/gallery/gems/page.tsx` — route entry; reads query params, composes `GemsGallery`. Metadata for OG + Twitter card (thumbnail = first gem's `thumb_url`).
  - *Verify:* `npm run dev`, load `http://localhost:3000/gallery/gems`, confirm real gems render, click opens lightbox, ESC closes, filter chips update URL + re-fetch, load-more appends.

### Phase 4 — homepage rail + stat footer (MEDIUM priority)

- [ ] **4.1** `app/components/home/LatestFlockFrames.tsx` (server) — fetches 6 rows via `fetchRecent({ limit: 6 })`, renders `GemsGrid variant="rail"` with `GemCard variant="compact"`. "See all" link → `/gallery/gems`.
- [ ] **4.2** Insert `<LatestFlockFrames />` into `app/page.tsx` between `FlockPreviewStrip` and `LatestFieldNote`.
- [ ] **4.3** `GemsStatFooter.tsx` — server component; calls `fetchImageStats({ since: 7 days ago })`, shows "N gems this week" line; add to `SiteFooter`.
  - *Verify:* homepage SSR renders the rail with live images; footer shows the stat.

### Phase 5 — docs + changelog

- [ ] **5.1** Update `docs/FRONTEND-ARCHITECTURE.md` — add SSoT table row for `app/components/gems/`; add a "How to add a gallery section" paragraph.
- [ ] **5.2** Update `CHANGELOG.md` — v1.7.0 entry: what/why/how, author "Claude Opus 4.6 (1M context)".
- [ ] **5.3** Grep check: `grep -rE '(mark|barney)' app/components/gems app/gallery` must return zero. No owner name anywhere in built output.

### Phase 6 — live verification

- [ ] **6.1** `npm run build` clean. No lint errors.
- [ ] **6.2** Load `http://localhost:3000/gallery/gems` against the live tunnel; confirm real Birdadette gem shows (id 709 as of writing; will move as pipeline runs).
- [ ] **6.3** Disconnect tunnel (stop cloudflared for 30s) — gallery should show `GemsError`, not crash. Reconnect; next revalidation heals.
- [ ] **6.4** Homepage rail shows 6 recent frames including decent-tier.
- [ ] **6.5** Grep built Railway bundle (`.next/`) for "mark" / "barney" / "brooder" in *string* positions (scene pill is OK; hardcoded header copy is not).

---

## Docs / Changelog touchpoints

- `docs/14-Apr-2026-image-archive-dataset-and-frontend-plan.md` — stays authoritative; this plan is implementation-specific supplement.
- `docs/FRONTEND-ARCHITECTURE.md` — SSoT table + "how to add a gallery section" paragraph.
- `CHANGELOG.md` — v1.7.0 entry when v0.1 ships.
- `README.md` — no change; the gallery is discoverable via the homepage rail.

## Risks + open questions

- **Backend is uncommitted in the worktree.** v2.25.0 runs in-process but hasn't been committed/pushed. If someone bounces Guardian or the Mini reboots before it's committed, the endpoints disappear. **Mitigation:** flag to Boss, commit+push before shipping frontend. Frontend can still be *built* against the live tunnel now, but don't ship to Railway until the backend commit is on GitHub.
- **Cold-cache first paint.** 5-minute `revalidate` means the first post-deploy visitor pays full tunnel latency. Acceptable; the tunnel is ~100-200ms from Railway.
- **Filter explosion.** URL-driven filter state means every filter combination is a separate cache key. Bounded by the chip enum cardinality; not a real problem.
- **`GemLightbox` keyboard focus.** `<dialog>` handles focus trap natively on modern browsers; older mobile Safari may need a polyfill. Accept the degradation.
- **Image byte load.** Without `next/image`, we don't get automatic lazy-loading beyond `<img loading="lazy">`. That's fine for a ≤24-card first page.
