# Plan — Light Brahma estimate note

## Scope
- Add one new field note recording Bubba's breed/sex estimate for the four week-old chicks.
- Record that the four chicks moved to the nesting box on 12-April-2026.
- Stage the two attached chick photos in the website repo and reference them from the note.
- Update the site changelog for the new content entry.

## Out of scope
- No flock roster schema changes.
- No Guardian backend changes.
- No homepage layout or styling changes.

## Architecture
- Reuse the existing `content/field-notes/*.mdx` content pipeline.
- Store the two reference photos under `public/photos/april-2026/`.
- Add a top changelog entry in `CHANGELOG.md` so the content change is durable and visible.

## TODOs
1. Copy the two chick photos into `public/photos/april-2026/`.
2. Add a new field note with the estimate and nesting-box move.
3. Add a changelog entry describing the content update.
4. Run a production build to verify the MDX/content paths resolve.
5. Commit and push to `origin/main`.
