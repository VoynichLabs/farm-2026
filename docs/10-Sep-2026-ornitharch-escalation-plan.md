# /ornitharch escalation: handoff notes for the next coding agent

**Date:** 10-Sep-2026 · **Author:** Claude Opus 5 · **Status:** NOT APPROVED. Do not build until Boss says go.

## How to work with Boss on this (read this before anything else)

- **Be fast and short.** Keep chat replies to a few lines. No walls of text, no engineer-speak, no narrating your own process. Talk like a person who's in on the joke.
- **Don't over-research.** Everything you need is in this doc. Don't re-read the whole repo, and don't fan out subagents or workflows. The job is writing and charts.
- **Answer the question you were asked, right away.** Then act.
- **Never claim approval you weren't given.** Wait for an explicit "go".

## Read first

- **Another agent has uncommitted work** in `app/ornitharch/page.tsx` and `lib/content.ts`: a per-bird photo filmstrip (`sortedBirdPhotos`, `ageAtPhoto`). Don't revert it and don't overwrite it. Build on top of it.
- Don't commit or push until Boss asks you to.
- The existing rules still apply: file header, CHANGELOG entry, cohort count derived from `getFlockProfiles()` (never a hardcoded 11), and Table 1 row order is load-bearing because the prose cites rows by number.

## Direction

**Cut the prose way down and let the charts carry the page.** Every section should be a headline, one or two flat sentences, and a chart or table. The joke is that the numbers are real and every one of them says the chicken wins. Keep the register deadpan: no winks, no exclamation points.

## Global copy changes

1. **"the Foundation" is a leftover.** The narrator's institution is now **the B'GAWWWK**. Replace every "the Foundation" with "the B'GAWWWK".
2. **Always use the definite article:** "the B'GAWWWK has determined." There are currently 22 mentions without it. Keep the long spelling unless Boss says "B'Gawk".

## New sections

### Model card: ORNITHARCH-27B
The narrator admits how it knows all this: Farm Guardian feeds it tens of thousands of chicken frames a day, and it has been fine-tuning on them. Write it up like a Hugging Face model card.
- Base model: the real local VLM, `qwen3.5-9b` (see the `app/markets/page.tsx` header), grown to 27B "on Ornitharch data".
- Training data: every frame Guardian has scored, using the real camera names.
- Evals table: roost-order prediction, coyote ETA, feed-bucket forecasting, and a band-leg read scored **0/5**, labelled "alignment, not error". The 5-of-5 miss is real.
- Weights: "Not released. The B'GAWWWK holds the weights."

### The misleading-metaphors section
Source: Melanie Mitchell, "Misleading Metaphors, Real Risks", aiguide.substack.com, published 10-Sep-2026. She argues that "rogue", "escaped", "swarm" and "lost control" are misleading ways to describe AI. The B'GAWWWK **agrees with her completely** and says so without irony. Nothing escaped: the chickens are on the premises. Nothing went rogue: everything was measured. Link to the article. Quote at most once, and keep that quote under 15 words.

### P(chicken) survey
A deadpan version of a P(doom) expert survey: a table plus a scatter chart of "probability the dominant megafauna is a chicken by year X". The B'GAWWWK's own estimate is shown as `[REDACTED]`.

### Instrumental-convergence audit
A three-row table mapping the textbook AI-risk drives to real observed behaviour:
- power-seeking → the roost-rail hierarchy
- resource acquisition → the feed bucket
- self-preservation → SETTLED HAND

## Charts (hand-built SVG, no library, colours from the existing `--orn-*` tokens)

| # | Chart | Real numbers to use |
|---|---|---|
| 1 | Energy to produce one intelligence, **log scale** | Birddor 20 kWh · human (gestation + 18 years of food) ~24 MWh · frontier LLM training run ~50 GWh |
| 2 | Offspring per year | hen ~280 eggs · human ~0.9 |
| 3 | Generations per human lifetime (80 years) | chicken ~80 · human ~3.2 |
| 4 | Days to adulthood | ~150 vs ~6,570 |
| 5 | World population | ~33 billion chickens vs 8.2 billion humans |
| 6 | Pallial neuron density, bar chart | 220 vs 40 n/mg (Olkowicz 2016 direction) |
| 7 | ORNITHARCH-27B training loss | the curve drops and then crosses below zero |
| 8 | Coyotes launched, cumulative, with a dollars axis | $58.38 each at the Connecticut residential rate |
| 9 | P(chicken) scatter | from the survey section above |
| 10 | "AGI by 2027"-style extrapolation | y-axis is cohort head count |

Keep the existing Fig. 1 to Fig. 5 charts. Renumber everything once at the end.

## Image prompts (Boss generates the images; place them where they fit)

1. Grainy declassified 1970s government photo: a rooster standing on a desk next to a glowing Mac Mini and an egg incubator, harsh flash, black redaction bars.
2. Formal state oil portrait of a copper-and-grey rooster in military dress uniform, yellow leg band, velvet backdrop, brass nameplate.
3. Black-and-white satellite reconnaissance image of a small backyard chicken pen with a pink tarp roof, targeting brackets and a coordinates overlay.
4. Blueprint cutaway of a backyard electromagnetic railgun aimed straight up, with a coyote silhouette labelled PAYLOAD.
5. A Hugging Face-style model card screenshot for "ORNITHARCH-27B", with a chicken as the avatar, a download count, and a "gated: B'GAWWWK approval required" badge.

## Done means

`npm run build` is green, the page is visually checked once, and there's a CHANGELOG entry (patch bump: this is a single-page rework). Then wait for Boss's go before committing.
