# Facebook Page Rebrand Plan

**Date:** 17-Jul-2026
**Goal:** Turn the dead "Yorkies App" FB Page (`page_id=614607655061302`) into a real, coherent farm page so cross-posted content actually reaches people.

## The problem (measured this session)
- FB Page "Yorkies App": **0 followers, 0 views on every reel, 0 reactions/comments/shares.**
- Posting pipeline is **not** broken — reels land, are public, and resolve (HTTP 200).
- Page is a leftover: wrong name, no username/vanity URL, no bio/links, generic profile.
- Root cause of 0 views = **no audience** (FB won't distribute reels from a 0-follower page). No code fixes that.
- For contrast: same content on IG reached ~4,120 accounts / 195 interactions last 30 days.

## Decision made
- **Rebrand the existing page in place** (keep the ID — already linked to IG + pipeline). Not creating a new page.

## The blocker
- Both Meta tokens on the Mini can **post and read** but lack `pages_manage_metadata`.
- That one permission gates *every* rebrand action: name, username, bio, links, category, profile/cover photo.
- Facebook requires the page owner to grant it — **no API-only or automated path around it.**

## Plan

### Step 1 — Grant permission (Mark, ~2 min, one time)
- Open an authorization link (Claude generates it) and approve `pages_manage_metadata` for the app.
- This is the only manual step.

### Step 2 — Rebrand via API (Claude, automated after Step 1)
- Set username / vanity URL.
- Rewrite bio + description.
- Add website links (farm.markbarney.net + Instagram).
- Fix category.
- Upload profile photo + cover from farm photos.

### Step 3 — Name change (Claude submits, Facebook decides)
- Submit "Yorkies App" → new name.
- **Caveat:** FB reviews name changes and may reject a large jump. Only item not fully in our control.

## Alternative route (if avoiding the permission grant)
- Claude drives the Facebook UI directly in Mark's logged-in browser (no grant needed).
- Trade-off: less reliable, operates the live account, same name-review caveat.

## Explicitly out of scope
- **Audience building** (invites, Groups, cross-promo, paid boost). This is the real driver of views, is manual, un-automatable, and has modest payoff for a hobby page. Not part of this rebrand.
- Any change to the IG side or the posting pipeline code.

## Status
- Not started. Awaiting Mark to pick a route and do Step 1 when ready.
