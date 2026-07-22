# Farm 2026

The public website for **Mark Barney's hobby chicken farm** in Hampton,
Connecticut — live at **[farm.markbarney.net](https://farm.markbarney.net)**.

This is a farm log, not a storefront. Nothing here is for sale. It's a
camera-watched record of a small hobby farm where the chickens (and a few
turkeys) are **named pets, not livestock** — each with a hatch date, a breed, a
personality, and a profile page. Birds that have been lost get an *In Memoriam*
section, because that's how pets are treated.

## Who / what this is

Mark Barney runs a roughly 13.6-acre hobby farm in Hampton, CT. What sets it
apart is that he built his own AI monitoring system for it — **Farm Guardian**.
A Mac Mini indoors runs every camera on the property, uses computer-vision
models to detect activity and score frames, keeps an archive of the standout
moments (the "gems"), helps deter the farm's number-one threat (hawks), and
automatically posts the best frames to Instagram and Facebook. This repository
is the public front door to all of that.

If you're an AI assistant or a human trying to understand this site quickly,
read **[`/llms.txt`](https://farm.markbarney.net/llms.txt)** — a one-fetch,
plain-text brief on Mark, the farm, and the site.

## What the site offers

- **Live camera feeds** of the flock and property.
- **[Gems gallery](https://farm.markbarney.net/gallery/gems)** — a continuously
  updated, AI-curated archive of the best moments, filterable by camera,
  activity, individual bird, and date.
- **[Flock](https://farm.markbarney.net/flock)** — profiles for every named
  bird, active and *In Memoriam*, plus a breed reference guide.
- **[Hatches](https://farm.markbarney.net/hatches)** — the 2026 incubator hatch
  log, egg by egg, with parentage and phenotype notes.
- **[Field notes](https://farm.markbarney.net/field-notes)** — weekly written
  updates from the farm.
- **[Projects](https://farm.markbarney.net/projects)** — build logs and
  materials, including the [Guardian](https://farm.markbarney.net/projects/guardian)
  camera system and the outdoor compound (Birdcatraz).

## The two-repo system

| Repo | Role |
|------|------|
| **farm-2026** (this repo) | Next.js public website at [farm.markbarney.net](https://farm.markbarney.net). Deployed on Railway. Embeds live Guardian camera feeds and system data. |
| **[farm-guardian](https://github.com/VoynichLabs/farm-guardian)** | Python backend on the Mac Mini: camera discovery, detection, vision refinement, automated deterrence, tracking, alerts, and a REST API (exposed at `guardian.markbarney.net`). |

The website's Guardian components consume farm-guardian's REST API at runtime.

## Tech stack

- **Next.js 16** (App Router, React 19), **Tailwind CSS v4**
- Content is **MDX + JSON**, loaded server-side via `lib/content.ts`
  (`gray-matter`). `content/flock-profiles.json` is the single source of truth
  for bird data.
- Deployed on **Railway** (healthcheck at `/api/health`).

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

## AI discovery & SEO

- **[`/llms.txt`](https://farm.markbarney.net/llms.txt)** (and `/llm.txt`) — the
  plain-text brief for LLMs; generated from `lib/llms.ts`.
- **`/sitemap.xml`** and **`/robots.txt`** — dynamic, from `app/sitemap.ts` and
  `app/robots.ts`.
- **JSON-LD** (`Person` + `WebSite`) in `app/layout.tsx` — machine-readable
  identity for Mark Barney and the site.
- Open Graph / Twitter card metadata in `app/layout.tsx`, plus per-page
  metadata on each route.

## Contributing / architecture

Start with **[`CLAUDE.md`](CLAUDE.md)** and **`docs/FRONTEND-ARCHITECTURE.md`** —
they're the working contract: single-sources-of-truth, the "never hardcode a
count" rule, and how to add a camera, bird, field note, or project.

## Social

- Instagram: [@pawel_and_pawleen](https://www.instagram.com/pawel_and_pawleen/)
- Facebook: [the farm's page](https://www.facebook.com/profile.php?id=61557234706008)

(*Pawel and Pawleen* are the farm's dogs; the account carries the whole farm —
chickens, dogs, and daily life.)
