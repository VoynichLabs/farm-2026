# Frontend Architecture — the Working Contract

This doc is for the next developer, human or AI, who touches the farm-2026 codebase. It's short on purpose. Read once, then obey.

## The rule that matters most

**Data lives in data files. Prose references data; it never duplicates it.**

If you are about to type a number, a breed, a camera name, or a hardware string into a `.tsx` file or an MDX body, stop. That fact lives in a data file somewhere. Import it, don't retype it. Every sweep of "4 cameras → 5 cameras → 6 cameras" across four files is an instance of this rule being broken.

## Single sources of truth (SSoT)

| Fact | Lives in | Consumed by |
|---|---|---|
| Camera roster, labels, devices, aspect ratios | `lib/cameras.ts` (`CAMERAS`) | `GuardianCameraStage`, `GuardianHomeBadge`, `GuardianHomeSection`, anything else that counts or lists cameras |
| Bird roster + breed reference | `content/flock-profiles.json` | `/flock` page, homepage `FlockPreviewStrip` |
| Field notes (weekly updates) | `content/field-notes/*.mdx` | `/field-notes` feed + slug pages, homepage `LatestFieldNote` |
| Projects | `content/projects/*/index.mdx` | `/projects` list, `/projects/[slug]`, homepage `ActiveProjects` |
| Gallery photos (static) | `content/gallery.json` | `/gallery` |
| Instagram embeds | `content/instagram-posts.json` | homepage `InstagramSection` |
| **Curated image archive (Guardian pipeline)** | **`farm-guardian` SQLite → REST via `guardian.markbarney.net/api/v1/images/*` → `lib/gems.ts`** | **`/gallery/gems`, homepage `LatestFlockFrames`, `/flock/birdadette` retrospective.** See **`docs/14-Apr-2026-image-archive-dataset-and-frontend-plan.md`** — the dataset is large, growing hourly, and NOT obvious from the codebase. Read that plan before touching any curated-photo surface. |

All content loaders live in `lib/content.ts`. Use them. Do not re-implement `fs.readFileSync` in a page file.

## Rules

1. **Never hardcode a count in prose or layout.** `{CAMERAS.length}` is always better than `5`. If you see a literal number describing data that lives in an SSoT, derive it.
2. **Never duplicate data.** The homepage once had eight birds typed inline while `flock-profiles.json` was right there. That is the failure mode this codebase is escaping.
3. **Camera labels are hardware-only.** No "brooder", "nestbox", "coop", "yard" in `label`, `shortLabel`, `device`, or any UI string about a camera. Device names are stable; angles change. See `feedback_camera_naming.md` memory for the history.
4. **No owner name in public files.** `lib/cameras.ts`, `content/*`, `app/**/*.tsx` are public-facing. The external link to markbarney.net is OK; the link text and copyright lines do not carry a person's name. (Field notes are the author's free-form space; first-person is fine there.)
5. **No "built by Claude" self-promotion in public copy.** One tasteful mention is enough; four repetitions is slop. Editorial self-mythologizing was stripped in the 13-Apr-2026 rewrite — don't bring it back.
6. **One component = one responsibility.** Section components live under `app/components/home/`. Reusable primitives live under `app/components/primitives/`. Guardian-specific client components live under `app/components/guardian/`. If a section file is starting to do more than one thing, split it.
7. **Extract a primitive only when a pattern genuinely repeats.** Two uses is probably a coincidence; three or four is a pattern. The current primitives (`SectionHeader`, `BirdCard`) were extracted because they had four and two consumers respectively. Don't pre-extract for imagined reuse.

## How to add things

### A camera

1. Backend: add to `farm-guardian/config.json`, bring the stream up, confirm `https://guardian.markbarney.net/api/cameras/<name>/frame` returns JPEG.
2. Frontend: one edit to `lib/cameras.ts` — add to the `CameraName` union and append a `CameraMeta` entry. Fields are **hardware only** (see rule 3). No location words.
3. That's it. Homepage thumb, stage chooser, offline-badge count, system panel all update from the registry.

### A bird

Edit `content/flock-profiles.json`. Add to `flock_birds[]`. If `status: "active"` and there's a `photo`, the homepage strip picks it up automatically (up to 8 tiles).

### A field note

Drop a new `.mdx` in `content/field-notes/`. Frontmatter: `title`, `date` (YYYY-MM-DD), `cover`, optional `photos[]` and `tags[]`. The feed, the slug page, and the homepage "Latest from the Farm" block all discover it via `getAllFieldNotes()`.

### A project

New folder under `content/projects/<slug>/` with `index.mdx`. Frontmatter: `title`, `status` (`planning`/`active`/`complete`/`shelved`), `description`, `heroPhoto`, `tags[]`, `startDate`, `location`. Optional `entries/*.mdx` and `materials.json` are picked up by the slug page if present.

### A homepage section

Create a server component under `app/components/home/`. Consume data via `lib/content.ts`. Compose from `SectionHeader` and any applicable primitives. Add one `<NewSection />` line to `app/page.tsx`.

### A gallery section that uses the curated image archive

The image archive (`guardian.markbarney.net/api/v1/images/*`) already has a frontend surface under `app/components/gems/` — read `docs/14-Apr-2026-frontend-gems-implementation-plan.md` first, then:

1. Fetch via `lib/gems.ts` helpers (`fetchGems` / `fetchGem` / `fetchRecent` / `fetchImageStats`). Never call `fetch()` against the tunnel directly — it gets you past the `apparent_age_days = -1 → null` normalisation and the typed error handling for free.
2. Format via `lib/gems-format.ts` (`cameraLabel`, `activityLabel`, `sceneLabel`, `individualLabel`, `relativeTime`, `absoluteTime`, `ageBucket`). Never hard-code a label string for a backend enum; add it here if missing.
3. Render via the gems component set. `GemCard` has `variant="default"` (card with caption) or `variant="compact"` (thumb-only; hover badges overlay). `GemsGrid` has `variant="gallery"` (responsive grid) or `variant="rail"` (horizontal scroll). The homepage rail `LatestFlockFrames` composes grid-rail + card-compact; the gallery composes grid-gallery + card-default. A new surface composes whichever fits.
4. Boss-sensitive rules are enforced in types + components already (no `has_concerns` field, draft-caption affordance in `GemCaption`, hardware-only labels via `CAMERAS` SSoT). Don't work around them.

### A reusable primitive

Only if the pattern shows up at least three times and the extraction reduces code, not just moves it. Put it in `app/components/primitives/`. Typed props, no side effects, no data fetching.

## File headers

Every TypeScript / JavaScript / Python file must start with the header block documented in `CLAUDE.md` (`Author` / `Date` / `PURPOSE` / `SRP/DRY check`). Update the header any time you touch the file. JSON and MDX don't support comments — skip the header there.

## Don'ts — specific anti-patterns this rewrite fixed

- Don't re-export data that's already importable. A `lib/site.ts` that exports `CAMERA_COUNT = CAMERAS.length` is indirection without a benefit; import `CAMERAS` directly.
- Don't create an editorial-strings module (`lib/copy.ts`) for single-use taglines. One string used once doesn't need abstraction.
- Don't hand-maintain backend truths on the frontend. The stale "v2.15" version tag in the system panel was stale *because* it was a hand-maintained constant. If a backend fact matters, fetch it from `/api/status`; if it doesn't matter, don't display it.
- Don't build a `<CameraRoster />` MDX component for a table that changes quarterly. Hand-written documentation is fine when it doesn't drift in between.
- Don't add a stat bar with hand-crafted numbers. This is a farm log, not a SaaS landing page.

## History

- `docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md` — the rewrite plan (spec of record for the 1.5.x → 1.6.0 transition).
- `CHANGELOG.md` `[1.5.0]` — mba-cam addition that exposed the DRY failure.
- `CHANGELOG.md` `[1.6.0]` — the rewrite itself (five commits, roughly one per phase).
