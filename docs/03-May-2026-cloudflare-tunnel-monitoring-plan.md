# Cloudflare Tunnel Monitoring — Plan

**Date:** 2026-05-03
**Author:** Claude Opus 4.7
**Status:** Proposed — needs Boss's signoff on the service choice before execution
**Target gap:** A2 in `docs/02-May-2026-system-review-and-gap-analysis.md`
**Audience:** The dev who picks this up. No code below — decisions, sequence, and acceptance criteria.

---

## Why this matters

The Cloudflare tunnel from the Mac Mini to `guardian.markbarney.net` is the single ingress for everything the public site does — live cameras, gem archive, status, image archive. When the tunnel drops or the Mini's API process dies, the entire dashboard goes dark. Today there is no alert: the only way Boss finds out is by opening the site or noticing his social pipeline silently stopped.

During active farm season this is a real reliability gap. A three-hour outage at 4 a.m. should not require Boss to discover it manually at 7 a.m.

## What's already in place — don't redo

- **Frontend connectivity banner** (shipped 2026-05-02, refined 2026-05-03 — 1.14.0/1.14.1). When the site can't reach `/api/status` for ~20 seconds, a "Site disconnected — can't reach Guardian on the Mac Mini" banner appears on the dashboard. This handles the **visitor-facing** surface. Visitors know why nothing is working and can stop assuming individual cameras are broken.

What's missing is the **operator-facing** alert. When the tunnel drops, Boss should get a Discord ping the same way he gets predator-detection pings — not learn about it from the website.

## Goal

A Discord alert in Boss's existing farm-alerts channel within ~5 minutes of a sustained tunnel/site outage. The alert should be specific enough to distinguish:

- The tunnel itself is down (no endpoint reachable)
- The tunnel is up but the Mini's API process is dead (`/api/status` 502/timeout)
- The API is up but a specific endpoint is broken (`/api/cameras` failing while `/api/status` succeeds)

A clean "RESOLVED" message when service comes back.

## Recommended approach: external uptime service (free tier)

**Use a free external uptime service** — UptimeRobot, BetterStack, or Healthchecks.io. All have free tiers, all support Discord webhook integration, all run on infra independent of Boss's hardware.

**Why an external service rather than self-hosted:**

- The monitor *must* run on hardware separate from the Mini. If the Mini is down, anything running on the Mini can't tell us. Rules out cron on the Mini, anything in `farm-guardian/scripts/`, etc.
- Running it on another machine Boss owns (the MSI Katana 15 HX, the GWTC laptop) ties tunnel uptime to *that* host's uptime and adds another thing for him to maintain. A free SaaS monitor is simpler and runs on infra he doesn't have to babysit.
- A Cloudflare Worker with a cron trigger is also a fine option (Cloudflare-native, probably free at this scale), but UptimeRobot is faster to set up, gives a public status page for free, and doesn't require a Worker codebase to maintain.

**Recommendation:** UptimeRobot's free tier — 50 monitors at 5-minute intervals, no code, Discord integration is one webhook URL paste. The cheapest paid tier ($7/mo) drops to 1-minute intervals if 5 minutes of detection latency feels too long. For a hobby farm in active season, the free tier is fine to start.

**Alternatives explicitly considered:**

| Option | Pros | Cons |
|---|---|---|
| **UptimeRobot (free)** | 30-min setup; Discord native; free; runs off-Mini | 5-min detection latency on free tier |
| BetterStack | More polish; better dashboards | Free tier has fewer monitors |
| Healthchecks.io | Open-source friendly; "dead man's switch" model | Better suited to "cron job didn't run" than HTTP probes |
| Cloudflare Worker cron | Native to Cloudflare; free at scale | Adds a codebase to maintain |
| GitHub Actions cron | Free; already where the dev workflow lives | 5-min minimum granularity; opening issues isn't great alerting |
| Self-hosted on MSI Katana | Full control | Couples tunnel uptime to a personal machine; more to maintain |

## What to monitor

Three monitors, in priority order. Each should be a separate UptimeRobot HTTP(s) monitor.

1. **`GET https://guardian.markbarney.net/api/status`** — the cheapest, most-load-bearing probe. If this fails, either the tunnel is down or the Mini's API process is. Expected response: HTTP 200, JSON body containing `online: true`. UptimeRobot's "Keyword" monitor can assert the body contains the substring `"online":true`. Failure modes that should alert: non-200, timeout >10s, or body missing the keyword.

2. **`GET https://guardian.markbarney.net/api/cameras`** — checks the camera roster endpoint specifically. If `/api/status` is up but this is failing, `dashboard.py` has a problem distinct from the API process being alive. Expected: HTTP 200, JSON array (UptimeRobot's keyword check on `[` at start is sufficient as a smoke check).

3. **`GET https://guardian.markbarney.net/api/cameras/house-yard/frame`** — one specific camera frame endpoint as a smoke test of the actual data path most visitors care about. Expected: HTTP 200, content-type starts with `image/`. Failure here while #1 and #2 pass means the Reolink-snapshot path specifically is broken — useful diagnostic without adding noise.

**Why only `house-yard` and not the other cameras:** the S7 phone, MBA, GWTC laptop are genuinely intermittent (phone freezes, Windows reboots, recommissions). Monitoring their frame endpoints would page constantly for known operational behavior. The frontend's `is_live` filter already handles per-camera state for visitors. Stick to the Reolink for the third monitor; it's the most reliable hardware in the fleet.

## Alert criteria

- **Threshold:** 3 consecutive failures (UptimeRobot calls this "Down for X checks" — set to 3) before paging. Single transient hiccups don't alert.
- **Recovery:** auto-clear when the next probe succeeds. Send a "RESOLVED" message — UptimeRobot does this by default.
- **Channel:** Discord webhook to Boss's existing farm-alerts channel — the one Guardian's predator-alert plumbing already posts to. Find the webhook URL in `farm-guardian` (likely in `farm-guardian/data/secrets/` or an env file; grep `DISCORD_WEBHOOK` to locate). **Reuse it; don't create a new channel.** Boss already watches that one.
- **Message format:** UptimeRobot's default Discord template includes which monitor failed, the HTTP status or error, and the timestamp. That's enough.

## Step-by-step execution

1. **Confirm the service choice with Boss.** UptimeRobot is recommended; don't sign up for a different one without checking.
2. **Sign up** with whatever operational email Boss prefers. Free tier.
3. **Locate the existing Discord webhook URL** Guardian uses for alerts. Check `farm-guardian/CLAUDE.md` and grep for `DISCORD_WEBHOOK` or `discord.com/api/webhooks` across the backend repo. Note: this is sensitive — don't paste it anywhere public.
4. **Add the three monitors** listed above. Set "Down after" to 3 checks for each.
5. **Configure Discord alerting** on each monitor pointing at the webhook URL. Test the alert immediately by intentionally configuring one monitor with a wrong URL — the dummy alert should land in the channel within minutes; then fix the URL.
6. **Real-failure test:** at a quiet time, deliberately stop `cloudflared` on the Mini (`launchctl bootout gui/$(id -u) com.cloudflare.tunnel.farm-guardian`). Within ~15 minutes the alert should fire. Restart the tunnel and confirm the recovery message arrives. Visitors will see the disconnected banner during the test — keep it under 5 minutes.
7. **Document** in `farm-guardian/docs/cloudflare-tunnel-monitoring.md`. New file. Should cover:
   - What's monitored (the three endpoints)
   - Where alerts go (Discord channel)
   - How to silence during planned maintenance (UptimeRobot's "pause" feature)
   - How to add a new monitor when the API surface grows
   - Who has UptimeRobot login credentials

## Acceptance criteria

The work is done when:

- All three endpoints have UptimeRobot (or chosen-equivalent) monitors configured at the agreed threshold.
- Discord alerts fire after 3 consecutive failures with a clear message.
- A recovery message follows when service returns.
- The real-failure test from step 6 has been performed and the alert + recovery were both observed.
- The setup is documented in `farm-guardian/docs/cloudflare-tunnel-monitoring.md`.
- Boss has confirmed he saw the test alerts in the Discord channel.

## Out of scope — defer to next iteration

- **Per-camera frame monitoring beyond `house-yard`.** S7, MBA, GWTC are intermittent by design. Wait until the watchdog work in gap A3 is uniform before adding noise sources.
- **Public status page** at `status.markbarney.net`. UptimeRobot offers this on the free tier — turn it on if it's wanted, but it's nice-to-have.
- **Alerting on per-camera `is_live: false` from `/api/cameras`.** Same noise concern.
- **SMS or phone alerts** for total outages. Discord is enough for this farm's risk tolerance; revisit only if outages start landing during predator-active dawn/dusk windows.
- **History dashboards** for SLO tracking. UptimeRobot's default uptime graph is fine; if Boss wants more granular analysis later, BetterStack or Grafana on a separate host are the upgrade paths.
- **A1 (LaunchAgent for guardian.py)** is a separate gap and a hard prerequisite for this monitor to be useful — without auto-restart, the alert will fire and stay firing until Boss SSHes in. Recommend wiring A1 first, then adding the monitor; the monitor catches the cases A1 can't (hardware failure, network drop, OS update reboot during which launchd is briefly unavailable).

## Owner

Backend dev — most of the work is web-form configuration and one new docs file. **Total estimated time: 30–60 minutes**, plus the test outage window. Could equally be done by Boss directly if he wants the credentials in his name.

## After this lands

Update gap A2 in `docs/02-May-2026-system-review-and-gap-analysis.md` to mark it implemented (status line at top of that gap entry, and a one-liner in this repo's `CHANGELOG.md` since it changes operational state even though no code lands here).
