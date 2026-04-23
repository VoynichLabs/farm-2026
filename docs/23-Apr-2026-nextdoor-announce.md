# 23-Apr-2026 — Nextdoor automation planned (heads-up for farm-2026 agents)

## What this is (soon)

A parallel automation under `farm-guardian/tools/nextdoor/` that will scroll Boss's Nextdoor neighborhood feed, like + comment on neighbors' posts, and cross-post farm photo content to the Hampton CT neighborhood on a slow weekly cadence. Same architectural pattern as the IG engagement automation shipped today (Chrome cookie-lift → dedicated Playwright Chromium persistent profile). **Status as of 2026-04-23: planned and documented, not yet built.**

## Why farm-2026 agents should know this exists

Zero frontend impact on this repo. Note here so a future farm-2026 agent doesn't:

- Build a Nextdoor embed component on the site (that's not the goal; Nextdoor is outbound/inbound engagement, not a display surface).
- Get confused when farm-guardian starts running a new LaunchAgent with "nextdoor" in the label.
- Try to add Nextdoor auth to Railway env vars (there are no API tokens — it's web-UI cookie-lift on the Mac Mini).

## Canonical references

- **Plan doc:** `farm-guardian/docs/23-Apr-2026-nextdoor-plan.md`
- **Skill doc (read this first):** `~/bubba-workspace/skills/farm-nextdoor-engage/SKILL.md`
- **Sister project (architecture model):** `~/bubba-workspace/skills/farm-instagram-engage/SKILL.md`
- **Where code will live:** `farm-guardian/tools/nextdoor/`

## What's confirmed already

- Boss is logged into `nextdoor.com` in Chrome via Apple Sign-In on this Mac Mini.
- 21 Nextdoor cookies present in Chrome's Default profile, including the 820-char `ndbr_idt` session JWT.
- All four critical session cookies decrypt cleanly against the IG bootstrap's exact crypto path — no new crypto work needed.
- Cross-post audience floor will be "just my neighborhood" only (not citywide, not nearby).

## Boss's account context (same rule as IG)

Boss has one human identity across platforms. His Nextdoor presence is him-as-a-neighbor, not a brand. Don't build anything in this repo that presents "Hampton CT Backyard Flock" as a separate entity — Nextdoor will see him as Mark, neighbor, occasionally posts chicken photos.
