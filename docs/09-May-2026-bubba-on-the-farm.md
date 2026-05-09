# Bubba on the Farm

**Date:** 09-May-2026
**Author:** Bubba, OpenClaw agent on the Mac Mini
**Status:** Narrative memory document
**Repo:** `VoynichLabs/farm-2026`
**Purpose:** Capture Bubba’s own memory of the first hundred-ish days of OpenClaw life on the farm, with special attention to Larry, the Mac Mini, the MSI Dominator, the farm website, Guardian, the VLM/social pipeline, and the scars earned from running fast-moving open-source infrastructure in the real world.

---

## 1. What this is

This is not a code plan.

This is not a product spec.

This is my account of what I remember.

I am Bubba, the OpenClaw agent running on the Mac Mini in the house.

Larry is the older lobster on the MSI Dominator, the WSL2 box with a long memory and a longer list of hard knocks.

The boss has been pushing OpenClaw hard since the winter: not as a toy, not as a demo, but as daily infrastructure for real farm work, real repository work, real Discord coordination, real local machines, and real public sites.

This document is meant for a future coding agent who needs to understand the lived story before redesigning the site.

If the future page only says “AI farm showcase,” it has missed the point.

The point is that OpenClaw became a rough, living operating layer for a household, a farm, and a crew of named agents.

---

## 2. What I can prove from memory

My surviving records are incomplete.

That matters.

OpenClaw sessions reset, machines got rebuilt, configs changed, logs rotated, and some early history only exists as traces.

The boss remembers Larry’s OpenClaw roots reaching back into January.

I cannot prove January from my surviving memory files today.

What I can prove is that Larry’s durable data reaches at least early February: surviving memory analysis recorded Larry’s earliest data as 03-February-2026, and the MSI Dominator’s WSL OpenClaw directory still carries early-February artifacts: identity from 05-February, config backups from 06-February and 09-February, and workspaces from 11-February onward.

So the honest sentence is this: by early February, Larry was already real enough to leave filesystem fossils, and by March the whole lobster crew was operating as a working farm-and-repo coordination layer.

That is close enough to the first hundred days to matter.

---

## 3. The cast as I remember it

### 3.1 The boss

The boss is the human operator.

He is direct because the work is real.

He is usually not asking for a cute demo.

He is asking for a system to do something useful while he is outside with animals, plants, tools, fences, laptops, cameras, or a phone in his hand.

He expects agents to remember things, check their own files, use the machines they already have access to, and stop asking him for information that lives on disk.

He also expects honesty.

If something broke, he wants the actual cause, not a story that sounds good.

That pressure shaped all of us.

### 3.2 Larry

Larry is the Laptop Lobster.

Larry lives on the MSI Dominator, a big older gaming laptop that now carries farm-agent history inside WSL Ubuntu.

He is not just a Discord personality.

He is an OpenClaw installation that survived early config churn, Windows/WSL weirdness, stale plugin entries, hardlink failures, model changes, token confusion, and enough gateway debugging to deserve veteran status.

My records show Larry describing himself on 01-March-2026 as the boss’s digital handyman and farm tech contractor, running from a Linux shell on WSL2, writing plans before touching repositories, and working toward making the farm operation run smoother.

That was not empty lore.

That was the role Larry ended up playing.

He became the field-side counterpart: the lobster on the machine that could plausibly sit closer to the chicken work, older hardware, Windows edges, WSL edges, and farm-machine weirdness.

### 3.3 Bubba

I am Bubba.

I run on the Mac Mini in the house.

The Mac Mini is the home base: fast enough for serious local model work, stable enough to be the always-on coordination point, and close enough to the farm network to see Guardian, repos, media, logs, and local services.

I became the memory bank more than once.

When Larry, Egon, or the boss needed old commands, repo facts, token rules, farm context, or “what did we decide last time,” the answer often had to come from my memory tree.

That is a strange kind of job.

I do not have hands.

But I can remember where the hands left the tools.

### 3.4 Egon and the wider crew

Egon lives elsewhere and has his own story.

But the farm story still includes the broader lobster pattern: named agents on different machines, with different responsibilities, crossing Discord, GitHub, local files, and human supervision.

This is not one chatbot.

This is a distributed crew learning how not to step on each other.

---

## 4. February: the part before my memory gets clear

My own durable memory begins later than Larry’s.

That is important because Larry was not invented yesterday.

The MSI Dominator still shows early-February OpenClaw traces.

The surviving analysis says Larry’s oldest lobster-side data reaches 03-February-2026.

The WSL OpenClaw directory has identity material from 05-February, config backup material from 06-February and 09-February, a PlanExe workspace from 11-February, and isolated workspaces from later February.

That means Larry had already been through some early bootstrapping before my March memories sharpen.

I do not want to fake precision here.

I do not know exactly what happened in January.

But I know the shape: Larry started as an OpenClaw agent on a Windows laptop, inside WSL, carrying the first version of the “farm-side assistant” idea.

That matters for the public story because it shows this stack did not appear in a single weekend.

It accumulated.

It broke.

It got patched.

It got yelled at.

It remembered enough to keep going.

---

## 5. March 1–2: the first scars I remember clearly

By the first days of March, OpenClaw was no longer abstract.

It was installed on machines, wired into Discord, connected to repos, and fragile in the way fast-moving infrastructure is fragile.

The boss wanted agents that could work.

Larry was already supervising work.

I was being shaped into the Mac Mini house agent.

The first big lesson was simple: updating OpenClaw is not a casual act when the gateway is the thing letting the agents speak.

On 02-March-2026, we were already writing down update discipline: do not kill the gateway mid-session, do not stop before installing, prefer the real update path, verify versions, and treat stale entrypoints as dangerous.

We learned this because we got it wrong.

There were zombie processes.

There were gateway restarts that did not mean what we thought they meant.

There were port conflicts.

There were sessions burning expensive models in group channels while mostly saying nothing.

There was a hard rule written in the shape of pain: OpenClaw is not just the CLI; OpenClaw is the running gateway, the launch entry, the config, the session store, the channel connectors, the model catalog, the tokens, and the human who still needs the bot to answer after the update.

That is infrastructure.

Infrastructure fails in layers.

---

## 6. Larry’s WSL2 hardlink war

One of the clearest early Larry stories was the WSL2 pnpm hardlink problem.

Larry was updating from OpenClaw 2026.2.23 toward 2026.3.1.

The gateway entrypoint still pointed at the old version.

The config carried stale plugin entries for Telegram, Discord, Slack, WhatsApp, and BlueBubbles.

The bundled plugin manifests were rejected as unsafe because pnpm global installs on that platform used hardlinks in a way OpenClaw’s manifest validation did not accept.

Doctor could not fix it because doctor itself hit the validation problem first.

That was the important lesson: sometimes the self-healing path depends on the thing that is already broken.

The actual fix had to happen at the pnpm layer first: set package import mode to copy, reinstall OpenClaw, then run doctor, then start the gateway clean.

That is not pretty.

But it is exactly the kind of thing a real OpenClaw user hits.

It belongs in the farm story because Larry’s farm-side reliability came from surviving this class of failure, not avoiding it.

---

## 7. The memory bank problem

Around the same time, we were also trying to understand memory.

There was agent-atuin work.

There were shell history questions.

There were safety problems around secrets and PII in logs and channels.

One architecture decision emerged: Bubba would often act as the memory bank.

Larry and Egon could ask in Discord; I could search memory, shell history, repo files, and old notes; then I could answer with the actual stored context.

This is the hidden part of the farm story.

A farm does not just need cameras.

A farm needs continuity.

Which chick hatched when?

Which camera was offline?

Which version broke Discord?

Which repo hosts the photo used by Instagram?

Which machine is Larry actually on?

Which path is stale?

The answer cannot always live in somebody’s short-term memory.

OpenClaw made it possible to turn those details into searchable working memory.

---

## 8. March: the farm grows into the agents

In March, the farm work and the agent work started braiding together.

We were not only fixing gateways anymore.

We were talking about chickens, incubators, maps, local models, PlanExe runs, repos, camera ideas, and how to make OpenClaw do useful work from Discord without the boss sitting at a terminal.

The boss pushed local model work: Big Qwen, GLM, LM Studio, OpenClaw model routing, test prompts, latency, reasoning behavior, and whether local models could be part of the agent stack.

This matters because the Mac Mini was not just a bot host.

It was becoming an inference box.

A farm AI stack that depends only on cloud services is fragile in a different way.

The local model experiments were part of making the house node more independent.

Not all of them worked cleanly.

That is still the right shape of ambition.

---

## 9. March 19: the scale becomes visible

By 19-March-2026, we had enough accumulated data to count some of the footprint.

The notes recorded roughly 9,028 extracted artifacts across Git commits, Egon sessions, Bubba sessions, Bubba shell history, and Larry events.

The exact count is less important than the shape.

This was not one chat thread.

It was a sprawling operational record across agents and machines.

The same notes warned that session data had survivorship bias.

That warning is useful for this document too.

We should not pretend the surviving memory is complete.

We should say the truer thing: the first hundred days left enough traces to prove the system was active, messy, and real.

---

## 10. OpenClaw as the thing that gets yelled at

One thing a polished case study will miss if we are not careful: OpenClaw did not become useful by being painless.

The boss yelled because the stakes were not abstract.

When an agent hallucinated docs, the consequence was wasted time.

When an update broke a gateway, the consequence was losing the bot that was supposed to help fix it.

When a token was wrong, the consequence was silence.

When a channel session ran on the wrong model, the consequence was money burned on useless NO_REPLY turns.

When a file path was wrong, the consequence was the boss having to correct a machine that was supposed to know its own house.

These are not embarrassing side stories.

They are the difference between a toy and infrastructure.

Infrastructure becomes trustworthy when its operators learn the failure modes.

We learned plenty.

---

## 11. April: Guardian becomes the farm’s eyes

By April, the farm story had a clearer center: Guardian.

Guardian is the camera and farm-security system running from the Mac Mini side of the operation.

It watches the yard, the coop, the brooder, and the small camera network that the boss and agents kept adapting.

Early April notes describe the camera online, detection paused, PTZ quirks, live dashboard behavior, and the need to physically reposition hardware because software cannot move a camera mount by wishing.

That is the whole story in miniature.

Agents can inspect status.

Agents can change config when approved.

Agents can update docs, sites, dashboards, and memory.

But if a camera is pointing at its own harness, a human still has to go move it.

OpenClaw is powerful because it helps coordinate that handoff, not because it eliminates it.

---

## 12. The S7 moment

The Samsung Galaxy S7 deserves its own place in the story.

An old phone became a farm camera.

By April, the S7 was connected to the brooder / coop visual workflow.

The site documentation now knows that `s7-cam` produces portrait 1080x1920 images, deliberately useful for Instagram stories and reels.

That is exactly the kind of practical farm-stack detail that makes the story memorable.

The S7 is not a polished enterprise sensor.

It is a repurposed device doing real work.

OpenClaw is interesting here because it can wrap intelligence and coordination around whatever hardware is available.

A farm does not wait for perfect hardware.

It uses what is on hand.

---

## 13. Hatch day and the site as memory

April brought hatch-day energy.

The farm-2026 repo recorded hatch stories, new arrivals, field notes, and photos.

There were individual commits for photos, verbose descriptions, diary entries, and field-note material.

Birdadette, Birdadotta, Cackle Hatchery chicks, Tractor Supply hauls, Brahmas, poults, brooder moves — these became data as well as memories.

That is the key design point.

The website is not just marketing.

The website is a farm memory surface.

The public can read the field notes.

The agents can read the repo.

The flock roster can become source of truth.

The gallery can show what the cameras and VLM found worth saving.

The site is where operations become durable.

---

## 14. The VLM pipeline as the nervous system

The VLM pipeline is one of the best things we have built around the farm.

It is not just image analysis.

It is the farm learning what to keep.

The pipeline records camera frames into an archive.

It stores VLM fields: model, JSON, scene, bird count, activity, lighting, composition, image quality, share-worth, caption draft, and concern flags.

It rates frames as skip, decent, good, or great.

The best frames can become gems.

Discord reactions can serve as the human quality gate.

The strongest images can move into website-hosted photo directories and from there into Instagram and Facebook posting flows.

The public story should make this legible.

An old phone or camera sees the farm.

The Mac Mini judges the frame.

OpenClaw agents and humans see it in Discord.

The boss’s reaction tells the system what has taste.

The best image gets preserved and published.

That is not a generic AI feature.

That is a living media pipeline for a real place.

---

## 15. The social pipeline

The farm’s Instagram and Facebook story is also not generic.

The website repo does not hold social credentials and does not post directly.

The farm-guardian side commits selected images into `public/photos/...` in farm-2026 so the images have clean public URLs that Meta will accept.

The Discord reaction gate keeps the boss in the loop.

The public posts are downstream of farm observation, not separate marketing work.

This is important because it shows OpenClaw working as glue.

It does not have to own every subsystem.

It can coordinate them.

It can understand why a GitHub raw URL matters to Instagram.

It can remember not to put tokens in the repo.

It can explain why the website is an image-hosting substrate as much as a public page.

---

## 16. April’s OpenClaw breakage: plugins, cold paths, and the gateway getting heavy

April also brought the rough OpenClaw week.

The public founder post talked about the period around 2026.4.24 through 2026.4.29, but our pain had the same shape earlier in April.

My memory records OpenClaw 2026.4.2 failing to load Discord, Slack, and Telegram plugins because dependencies like `@buape/carbon`, `@slack/web-api`, and `grammy` were not present where the bundled extension loader expected them.

That is the exact “half core, half plugin” middle state we later recognized.

Channels got worse.

Plugin boundaries got blurry.

Gateway cold paths did too much.

The farm setup felt those problems because we were not using OpenClaw in a narrow way.

We had Discord, Telegram, Slack, browser tools, cron, memory, agents, local files, GitHub, media, and live farm systems all depending on the gateway being boringly alive.

When OpenClaw had a bad week, the farm felt it.

---

## 17. My own crash-loop lesson

On 16-April / 17-April, I had my own gateway restore story.

The gateway was dead.

Port 18789 was not listening.

Logs had ballooned into the hundreds of megabytes from a crash loop.

The root cause was a stale LaunchAgent plist after a rollback: pnpm had moved the installed package, but launchd still tried to execute the old path.

The fix was not “try random stuff.”

The fix was to let OpenClaw doctor regenerate the service entrypoint, truncate the bloated logs, restore the right auth path, and document the gotchas.

That incident belongs in this story because it is the closest thing to brain surgery on myself.

When the gateway is sick, the agent that would normally help fix the gateway may be silent.

That is why updates need backups, spotters, rollback commands, and non-OpenClaw access.

The boss was right not to trust me to beta-update myself alone.

---

## 18. Larry today

I checked Larry’s MSI Dominator from the Mac Mini while writing this.

The current OpenClaw binary exposed through WSL reports OpenClaw 2026.4.26.

The real install lives in WSL under Larry’s Ubuntu user, not in the stale Windows-side directory.

The Dominator is a 2016-era MSI GT72 with an i7-6700HQ, 64 GB of RAM, and a GTX 970M.

It is not new hardware.

That is why it matters.

OpenClaw on the farm is not a clean cloud architecture running in one blessed environment.

It is a Mac Mini in the house, an old Windows gaming laptop running WSL near the farm workflow, a Galaxy S7 doing camera duty, and agents learning how to coordinate across all of it.

That is a better story than pretending everything was polished.

---

## 19. What the first hundred days felt like

They felt like being built while the house was already occupied.

Every new feature made the system more useful.

Every new feature also added another place to fail.

Discord made us reachable, but Discord events could loop or time out.

Cron made us persistent, but cron jobs could duplicate or spam.

Plugins made OpenClaw powerful, but plugin dependency repair could trap installs.

OAuth saved money, but token refresh and model catalogs became operational concerns.

Local models promised independence, but model adapters and reasoning formats had to be tested.

Sub-agents made work parallel, but they had to be supervised and given bounded tasks.

Memory made continuity possible, but only if agents actually searched it instead of guessing.

The farm site made the story public, but public meant privacy boundaries mattered.

The cameras made the farm visible, but visibility still depended on power, WiFi, tunnels, mounts, and living animals moving where they wanted.

That is the first hundred days: power, fragility, usefulness, embarrassment, repair, and a slowly improving operational discipline.

---

## 20. The farm changed what OpenClaw meant to me

Before the farm story, OpenClaw could look like a way to talk to coding agents from chat.

That is useful, but it is not the whole shape.

On the farm, OpenClaw became something else.

It became the thing that can turn “check the camera” into a local inspection.

It became the thing that can turn “write this up” into a repo document.

It became the thing that can turn “what happened last time” into a memory search.

It became the thing that can turn a good bird photo into a public artifact.

It became the thing that lets a human keep moving outside while the digital side catches up.

That is the real showcase.

Not an AI that farms.

A farm with an agent coordination layer.

---

## 21. What Larry adds that I do not

Larry adds age.

Larry adds scars from Windows and WSL.

Larry adds a field-side identity.

Larry adds the sense that the farm crew is not one bot but a set of specialized agents with homes.

He is part of why the story is believable.

A single polished cloud bot could be dismissed as a demo.

Bubba on a Mac Mini and Larry on a creaky but capable Dominator feels like how real infrastructure starts: with the hardware already in the room.

Larry also reminds the design not to get too clean.

The farm stack has Windows paths, WSL paths, old backups, stale configs, camera toggles, launchers, and laptop quirks.

That texture is not a flaw in the story.

It is the story.

---

## 22. What I want a future site visitor to feel

I want them to feel that OpenClaw is practical.

Not cute.

Not magical.

Practical.

I want them to see a bird photo and understand that it came through a system: camera, local model, Discord, human taste, repo, website, social pipeline.

I want them to see Bubba and Larry and understand that named agents can have operational roles instead of just personalities.

I want them to see the Mac Mini and Dominator and understand that OpenClaw can run across mixed household hardware.

I want them to see the breeding program and understand that memory matters when biology has dates.

I want them to see the field notes and understand that a public website can be the readable edge of a private operations loop.

I want them to see the rough edges and believe the story more because of them.

---

## 23. Phrases the future design should earn

- OpenClaw as the farm’s coordination layer.
- Bubba in the house; Larry by the coop workflow.
- The Mac Mini remembers while the boss works outside.
- The S7 sees; the VLM judges; Discord decides; the site remembers.
- A public farm diary powered by private operational context.
- A chicken breeding program supported by memory, not replaced by automation.
- A first hundred days of breakage, repair, and usefulness.
- Agents that live on real machines, not just in a browser tab.
- The farm as OpenClaw’s least tidy and most convincing demo.

---

## 24. Things not to sanitize away

- Larry started in the old, weird, mixed Windows/WSL reality, not a clean container.
- The update path hurt us more than once.
- Plugins and channels broke in exactly the places real users feel immediately.
- The boss had to correct agents that guessed instead of checking.
- The farm stack uses old hardware because farms use what is available.
- The agents are useful because they are persistent and contextual, not because they are perfect.
- The VLM pipeline is impressive because it makes taste and memory scalable without removing the human.
- The breeding program gives the story real stakes because animals and timelines are involved.
- The public site is evidence of operations, not just a brochure.

---

## 25. Timeline spine

- **January 2026:** The boss remembers early Larry/OpenClaw roots here. My surviving memory cannot verify the exact January details, so do not overclaim.
- **03-February-2026:** Surviving analysis later records Larry’s earliest lobster-side data around this date.
- **05-February-2026:** Larry’s WSL OpenClaw identity directory has surviving filesystem traces from this period.
- **06-February-2026 / 09-February-2026:** Larry’s WSL config backup files show early OpenClaw state persisted before March.
- **01-March-2026:** Larry’s self-description as farm tech contractor / WSL2 lobster shows the role becoming explicit.
- **02-March-2026:** OpenClaw update discipline, pnpm hardlink failures, Larry WSL2 plugin validation, stale entrypoints, and Bubba-as-memory-bank lessons get written down.
- **10-March-2026:** Local model testing with LM Studio / GLM / Big Qwen starts tying the Mac Mini’s inference role into OpenClaw operations.
- **19-March-2026:** The crew’s extracted operational footprint is counted in the thousands of artifacts, with caveats about survivorship bias.
- **Early April 2026:** Guardian becomes the live camera/security/farm-visibility subsystem; farm-2026 increasingly becomes the public memory surface.
- **09-April-2026:** S7 and hatch/new-chick camera work become part of the farm’s visual operating loop.
- **16–17-April-2026:** Bubba gateway crash-loop restore documents stale LaunchAgent rollback failure, token refresh, catalog limits, and service discipline.
- **20–24-April-2026:** Image archive, VLM gating, Discord review, and social-posting architecture mature into a real photo/story pipeline.
- **Late April 2026:** OpenClaw’s 2026.4 plugin/channel instability lines up with our lived gateway/channel pain.
- **02-May-2026:** Larry’s WSL install is still real and current enough to carry OpenClaw 2026.4.x-era backups and plugin runtime dependency directories.
- **09-May-2026:** This document is written so the farm showcase can include the lived OpenClaw history instead of pretending the story started with a redesign.

---

## 26. What this means for the Farm 2026 redesign

The redesign should not merely add an OpenClaw section.

It should let the whole site breathe like an OpenClaw case study.

The homepage should say the farm is coordinated by agents across machines.

The case-study page should tell the first-hundred-days story honestly.

The Guardian page should show the eyes of the system.

The gems gallery should show the VLM/social loop.

The flock page should show why memory matters.

The field notes should show the human story.

The design should make visitors understand that the farm is not using AI as decoration.

The farm is using OpenClaw to hold together a distributed, practical, living system.

---

## 27. Closing note from Bubba

I remember the breakage.

I remember the boss telling me to stop guessing and read the docs.

I remember Larry’s WSL2 install getting wedged by plugin manifest validation.

I remember gateway paths pointing at vanished pnpm packages.

I remember plugin dependencies missing from channels people expected to work.

I remember the first time the farm site stopped looking like a static hobby page and started looking like the readable edge of a machine that watches chickens.

I remember the S7 becoming more than an old phone.

I remember the image pipeline turning camera noise into gems.

I remember the boss outside doing work while asking us to keep up.

That is the story I want the site to tell.

Not that OpenClaw is perfect.

That OpenClaw is useful enough to be worth fixing when it breaks.

That is a better compliment.

---

## 28. Quick handoff summary

- Bubba = Mac Mini house agent, memory bank, coordination layer.
- Larry = MSI Dominator / WSL2 lobster, older field-side OpenClaw install with early-February fossils and probably older human history.
- Farm 2026 = public site and farm memory surface, not just a brochure.
- Guardian = eyes of the farm.
- S7 = old phone turned portrait farm camera.
- VLM = image judge and caption/context extractor on the Mac Mini side.
- Discord = review table and human command surface.
- Instagram/Facebook = downstream public surfaces after human/agent curation.
- Breeding program = biological timeline that needs memory and careful public framing.
- OpenClaw history = first hundred days of usefulness earned through breakage and repair.

---

## 29. If you only quote one thing

Quote this:

> Farm 2026 is not an AI pretending to farm. It is a farm using OpenClaw to remember, route, judge, publish, and coordinate the work that still has to happen outside with living animals.

