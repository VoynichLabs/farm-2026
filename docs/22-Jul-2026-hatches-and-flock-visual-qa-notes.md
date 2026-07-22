# Visual QA Notes — Hatches & Flock Pages (2026-07-22)

Non-code visual review by Boss. These are observations of what looks wrong on-screen, not implementation instructions — the developer should determine the correct fix.

## `/hatches`

1. **Bad photo cropping.** Multiple hatch photos are cropped incorrectly — bird heads are cut off or the wrong region of the source image is shown. Seen on the Adelbird and Horstabird cards, and the Henridotta hen photo. Crop framing needs to be corrected so the full head/face is visible.

2. **Lost chick must not be listed.** The "(unnamed)" Golden Laced Wyandotte cross entry (ID `2026-06-03-02`) is a chick that was lost. It should not appear on the Hatches page at all — remove it, don't show it as a "photo pending" placeholder card.

## `/flock`

3. **Redundant hero image.** The large photo banner at the top of `/flock` duplicates the site header that already exists elsewhere. Adds no information; should be removed.

4. **Excessive top whitespace.** Large empty margin/padding above the content before anything useful appears.

5. **Low information density overall.** Too much layout space given to decorative elements relative to actual flock data (names, counts, lineage).

6. **Nested/double scrollbars.** A scrollable container sits inside the page's main scroll, producing scrollbar-within-scrollbar behavior. Seen at the hero/top of the page.

7. **Key content pushed below the fold.** Most of the actual roster content requires scrolling down to reach; too much non-content is front-loaded above it.

8. **Image flashing/transition too fast.** Photos (e.g. cohort images) cycle or transition too quickly to comfortably view.

9. **Excessive left/right page margins.** Below the hero, the content column is boxed into a narrow center strip with large unused margins on both sides — same wasted-space problem as item 4, horizontal instead of vertical.

10. **Nested scrollbars again, at the card level.** Each bird card has its own horizontally-scrolling growth-photo strip, itself inside the page's vertical scroll — same scroll-within-scroll pattern as item 6.

11. **Verify age/date fields are computed, not hardcoded.** Fields like "AGE 2 MONTHS" / "AGE 6 WEEKS" under each bird must be calculated live from the hatch date vs. the current date. Confirm there is no hardcoded age string or hardcoded "now"/current-date reference anywhere in this data path. If any age, day-count, or "current" timestamp is static text instead of derived, this is a critical bug — fix it.

12. **AI-slop boilerplate copy repeated on every card.** The "Homestead hybrids like this combine the best traits of both parents: reliable egg production with unique blue egg color" callout appears verbatim on every single bird card in the Birdcatraz section. It reads as generic AI filler and should be removed (or replaced with real per-bird info, not a repeated templated blurb).

13. **Incorrect "VLM pipeline" scoring claim.** Copy in the Birdcatraz section states "every frame below was scored by the VLM pipeline against the cameras watching the compound." This is factually wrong for this content — these are hand-curated photos taken by Boss in-hand with the birds, not VLM-scored camera captures. The claim needs to be corrected or removed.

## Status

Not yet a complete audit — more pages may be reviewed and appended to this doc in follow-up passes.
