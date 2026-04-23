# 23-Apr-2026 — IG engagement automation exists (heads-up for farm-2026 agents)

## What this is

A separate automation track under `farm-guardian/tools/ig-engage/` that scrolls Instagram on Boss's behalf, likes posts from accounts in his audience (small bird / dog / yard), reacts to friends' stories, and occasionally leaves a short contextual comment. Purpose: Boss has no time to scroll, but Instagram's recommender rewards accounts that engage outward — so we engage FOR him so his posts reach more eyes.

## Why farm-2026 agents should know this exists

There is **zero frontend impact** in farm-2026. This heads-up is so a future agent looking at the website repo doesn't duplicate or conflict with the engagement work.

- If you're asked to "add a social engagement feature to the website" — **don't**. Boss's engagement happens from the Mac Mini via the farm-guardian repo, not from the Railway-hosted Next.js app. The website is a content surface; engagement is a separate server-side automation.
- If you're asked to "reciprocate with people who liked our stuff" — that's ALSO farm-guardian, `tools/on_this_day/reciprocate.py`. It's currently disabled (Yorkies page has zero engagement to harvest as of 2026-04-23) but the code exists and the LaunchAgent can be re-enabled.
- If you're asked to "grow our follower count" — say no to paid growth, no to follow/unfollow bots, and point Boss at the engager. Don't build anything in farm-2026 for this.

## What the engager will NOT do

- Follow / unfollow (bot-detection signal #1)
- Send DMs (signal #2)
- Use any scraped content on the website
- Post anything — posting is a separate pipeline (`tools/pipeline/ig_poster.py` + `fb_poster.py`)

## Where the canonical docs live

- **Skill doc (read this first):** `~/bubba-workspace/skills/farm-instagram-engage/SKILL.md`
- **Plan doc:** `farm-guardian/docs/23-Apr-2026-ig-engage-plan.md`
- **CHANGELOG entry:** `farm-guardian/CHANGELOG.md` v2.36.8
- **Code:** `farm-guardian/tools/ig-engage/`

## Account context

`@pawel_and_pawleen` on Instagram (and "Yorkies App" on Facebook) is Boss's ONE personal social handle. There is no separate "farm" vs "dogs" brand split. Dogs, chickens, turkeys, yard-diary content all flow through the same feed. When copywriting captions or engagement scripts, treat the audience as "one human's real life feed," not "a brand with segments."
