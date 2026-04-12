# Plan — Guardian SEO image swap

## Scope
- Change the Guardian project SEO/share image to Birdadette freshly hatched on the keyboard.
- Update the changelog for the metadata/content change.
- Verify the site still builds cleanly.

## Out of scope
- No layout changes.
- No content rewrites beyond the SEO image source.
- No backend or Guardian feed changes.

## Architecture
- Reuse the existing `heroPhoto` metadata flow in `content/projects/guardian/index.mdx`.
- Keep the image path on the already-staged Birdadette hatch photo in `public/photos/april-2026/`.
- Record the patch in `CHANGELOG.md`.

## TODOs
1. Point Guardian `heroPhoto` to `birdadette-fresh-hatch.jpg`.
2. Add a patch changelog entry documenting the SEO image swap.
3. Run a production build.
4. Push to `origin/main`.
