"use client";
/**
 * Author: Claude Opus 5 (prev Claude Fable 5; Claude Opus 4.7 (1M context); orig Claude Opus 4.6, 15-Apr-2026)
 * Date: 15-Aug-2026
 * PURPOSE: Reusable camera feed via snapshot polling. Fetches a single JPEG from
 *   Guardian's /api/cameras/{name}/frame endpoint every ~1.2s and swaps the img src.
 *   Replaced persistent MJPEG streaming because browsers limit concurrent HTTP/1.1
 *   connections per domain (~6), and 4 MJPEG streams + API polling through the
 *   Cloudflare tunnel exceeded that limit — causing feeds to starve and show only
 *   one camera at a time. Snapshot polling uses short-lived requests that work with
 *   HTTP/2 multiplexing and don't hold connections open. The feed stays visible
 *   unless its own snapshot polling fails; shared `/api/status` hiccups should not
 *   blank healthy camera frames.
 *
 *   v1.16.1 (10-May-2026): cold-load "looks dead" fix.
 *     - A tile that's never had a frame yet stays in CONNECTING forever
 *       until the first frame lands. The previous behavior flipped to
 *       OFFLINE after just 3 failed snapshots (~3.6s) — so any cold tunnel
 *       round-trip > ~3s painted every tile red on first load and Boss
 *       saw the dashboard as "always offline." OFFLINE is now reserved
 *       for tiles that *had* a frame and lost it (the OFFLINE_THRESHOLD
 *       path is unchanged — that one is correct evidence of a downed
 *       camera). The roster's `is_live` gate already filters out genuinely
 *       dead cameras upstream, so a tile we render is one the backend
 *       said is producing frames; "still trying" is the honest state for
 *       a tile we just haven't received bytes from yet.
 *     - Polling is now serialized via chained setTimeout instead of
 *       setInterval, so when the tunnel is slow (frame endpoint can take
 *       10+ s on cold start) requests don't pile up faster than they
 *       complete. Each fetch carries its own AbortController capped at
 *       FRAME_FETCH_TIMEOUT_MS so a hung fetch can't block the chain.
 *
 *   13-Apr-2026 tweak: the reconnecting state no longer blackouts the image with
 *   a centered modal — it shows a thin bottom strip so the last good frame stays
 *   visible. It also no longer flips on a single missed snapshot — a threshold
 *   of a few consecutive failures must pass before the strip appears, so normal
 *   one-off tunnel hiccups don't flicker the UI.
 *   v1.26.0 (06-Jul-2026): frames are now requested display-sized via the
 *     backend's `max_width` + `q` params (see farm-guardian dashboard.py)
 *     instead of at native resolution. Root cause of "the Duo 2 isn't on the
 *     site": its dual-lens panoramic snapshot is ~4MB, which takes longer
 *     than FRAME_FETCH_TIMEOUT_MS to cross the Cloudflare tunnel, so every
 *     poll aborted and the tile sat in CONNECTING forever. A 1280px/q75
 *     duo2 frame is ~120KB / ~0.6s. Width arrives via the `maxWidth` prop
 *     (stage tiles get more pixels than thumbnails); the backend only
 *     re-encodes when the source is wider, so small cams are pass-through.
 *   15-Apr-2026: `FeedState` is now exported and the `onStatusChange` callback
 *   reports the full state string (not just a live boolean) so parent layouts
 *   can distinguish "connecting" (still trying — keep visible) from "offline"
 *   (give up — hide). See docs/15-Apr-2026-smart-camera-visibility-plan.md.
 *
 *   15-Aug-2026: ORPHANED POLL CHAIN fix — "the Duo 2 box keeps flipping
 *     between the two Reolinks."
 *     The poll chain's liveness guard used to be `mountedRef`, a ref, which
 *     is scoped to the *component* rather than to the *effect run*. When
 *     `cameraName` changed on a mounted tile, React ran the cleanup
 *     (`mountedRef.current = false`) and then immediately ran the new effect
 *     body (`mountedRef.current = true`) — so the previous chain's in-flight
 *     fetch, resolving a moment later, saw `true`, wrote the OLD camera's
 *     blob into the shared `frameUrl`, and re-armed its own
 *     `setTimeout(fetchFrame, …)` on the OLD closure. That timer lived in
 *     the superseded run's local `nextTick`, which the current cleanup can
 *     never reach: the old chain became unreachable and immortal. Two chains,
 *     one `frameUrl`, alternating writes at ~1.2s.
 *     Observed on `/?cam=duo2`: 27 live polls of `house-yard` at the *stage*
 *     width while house-yard was only a thumbnail, and 41 of 42 samples of
 *     the Duo 2 tile painted with a 16:9 house-yard frame.
 *     The guard is now a run-scoped `let cancelled` declared inside the
 *     effect, so a superseded run's token stays false forever and its chain
 *     dies at the next checkpoint. Cleanup also aborts the in-flight fetch
 *     rather than letting it occupy a per-host connection until it resolves.
 *     NOTE: this must be fixed at the guard, not papered over with a React
 *     `key` on camera name — `maxWidth` is also an effect dep and legitimately
 *     changes (1600 on the stage, 800 on a thumb) without the camera changing.
 *     See docs/15-Aug-2026-duo2-camera-tile-flip-plan.md.
 * SRP/DRY check: Pass — single responsibility: camera feed display for any camera.
 */

import { useEffect, useState, useRef } from "react";
import { GUARDIAN_API } from "./types";

// How often to fetch a new snapshot (ms) — measured from the end of the
// previous fetch, so requests serialize cleanly even when the tunnel is slow.
const POLL_INTERVAL = 1200;
// Per-fetch ceiling: if a single snapshot fetch hasn't completed in this
// long, abort it and let the next tick try fresh. Without this, a hung
// Cloudflare tunnel can leave a fetch in flight for minutes and the chain
// would never advance. 12s is generous for cold-start round-trips while
// still keeping the chain responsive.
const FRAME_FETCH_TIMEOUT_MS = 12000;
// Consecutive misses on a live feed before we show the "reconnecting" strip.
// One hiccup is normal; we don't want the overlay flickering on and off.
// 5 misses ≈ 6 seconds — long enough to avoid bursty-jitter flapping but
// short enough to communicate a real problem promptly.
const RECONNECT_SHOW_THRESHOLD = 5;
// Misses before we give up on a live feed and go full OFFLINE. This path
// only fires *after* we've had a successful frame at least once — i.e.,
// we have positive evidence the camera was producing bytes and now isn't.
// A tile that has never had a frame yet stays in CONNECTING indefinitely
// (see fetchFrame's catch block) — "no bytes yet" is not the same as
// "definitely down."
const OFFLINE_THRESHOLD = 10;
// Minimum time (ms) the "reconnecting" strip stays visible once shown,
// even if a frame fetch succeeds. Prevents flicker when failures arrive in
// bursts: 5 misses → strip shown → 1 success → strip would otherwise
// disappear → 5 more misses → strip shown again. Holding the strip for a
// few seconds smooths that into a single visible "reconnecting" period.
const RECONNECT_MIN_VISIBLE_MS = 4000;
// Default snapshot width when the parent doesn't specify one. 1280 is plenty
// for any tile on the page and keeps even the panoramic Duo 2 frame near
// ~120KB — comfortably inside FRAME_FETCH_TIMEOUT_MS through the tunnel.
const DEFAULT_MAX_WIDTH = 1280;
// JPEG re-encode quality for downscaled frames. 75 is visually clean for
// live-monitoring tiles and roughly halves the payload vs the backend's
// default of 85.
const FRAME_JPEG_QUALITY = 75;

export type FeedState = "connecting" | "live" | "reconnecting" | "offline";

export default function GuardianCameraFeed({
  cameraName,
  label,
  online,
  onStatusChange,
  maxWidth = DEFAULT_MAX_WIDTH,
}: {
  cameraName: string;
  label: string;
  online: boolean | null;
  onStatusChange?: (cameraName: string, state: FeedState) => void;
  // Display-size hint forwarded to the backend as `max_width`. The backend
  // only re-encodes when the source frame is wider than this, so it's safe
  // to pass for every camera regardless of native resolution.
  maxWidth?: number;
}) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [feedState, setFeedState] = useState<FeedState>("connecting");
  const consecutiveErrors = useRef(0);
  const hadFrameRef = useRef(false);
  // Tracks when the tile last entered "reconnecting" so a single post-streak
  // success doesn't immediately flip it back to "live" — see
  // RECONNECT_MIN_VISIBLE_MS.
  const reconnectingShownAt = useRef<number | null>(null);
  // Mirrors the blob: URL currently in `frameUrl` so teardown can revoke it
  // without routing a side effect through a state updater. Updater functions
  // must stay pure — React may invoke them more than once, which would
  // double-revoke.
  const objectUrlRef = useRef<string | null>(null);

  // Poll for snapshots — chained setTimeout, not setInterval, so a slow
  // Cloudflare tunnel can't pile up requests faster than they complete.
  useEffect(() => {
    // Run-scoped liveness token. This deliberately is NOT a ref: a ref is
    // shared across effect runs, so a superseded run would observe the *new*
    // run's `true` and resurrect its own poll chain — the orphaned-chain bug
    // documented in this file's header. A `let` in the effect body belongs to
    // exactly one run and stays false for that run forever once cleaned up.
    let cancelled = false;
    let nextTick: ReturnType<typeof setTimeout> | null = null;
    let inFlight: AbortController | null = null;

    // This effect re-runs whenever the tile switches camera (or snapshot
    // width). Every piece of state below describes the *previous* camera, so
    // it all resets here — otherwise the incoming camera inherits the
    // outgoing camera's frame and its error history, and a fresh tile could
    // skip CONNECTING and go straight to OFFLINE on its first failed poll.
    consecutiveErrors.current = 0;
    hadFrameRef.current = false;
    reconnectingShownAt.current = null;
    setFeedState("connecting");
    setFrameUrl(null);

    // Swap in a new frame and revoke the one it replaces. Revoking the
    // previous URL only after the new one is committed avoids ever pointing
    // the <img> at a revoked blob.
    const showFrame = (blob: Blob) => {
      const previous = objectUrlRef.current;
      const next = URL.createObjectURL(blob);
      objectUrlRef.current = next;
      setFrameUrl(next);
      if (previous) URL.revokeObjectURL(previous);
    };

    const fetchFrame = async () => {
      if (cancelled) return;

      const ac = new AbortController();
      inFlight = ac;
      const abortTimer = setTimeout(
        () => ac.abort(),
        FRAME_FETCH_TIMEOUT_MS,
      );

      try {
        // max_width/q keep the payload display-sized: native frames (4K
        // Reolink ~1.4MB, panoramic Duo 2 ~4MB) can't reliably cross the
        // tunnel inside FRAME_FETCH_TIMEOUT_MS at 1.2s cadence.
        const res = await fetch(
          `${GUARDIAN_API}/api/cameras/${cameraName}/frame?max_width=${maxWidth}&q=${FRAME_JPEG_QUALITY}&t=${Date.now()}`,
          { signal: ac.signal },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        // Checkpoint after every await: if this run was superseded while the
        // bytes were in flight, they belong to a camera this tile no longer
        // shows. Drop them.
        if (cancelled) return;

        showFrame(blob);
        hadFrameRef.current = true;
        consecutiveErrors.current = 0;

        // If we recently flipped to "reconnecting", hold that state until the
        // dwell window has elapsed. A frame just landed (the underlying
        // tunnel is actually working), but flipping immediately back to
        // "live" causes flicker when failures come in bursts. After the
        // dwell, the next success snaps back to "live".
        if (reconnectingShownAt.current !== null) {
          const heldFor = Date.now() - reconnectingShownAt.current;
          if (heldFor < RECONNECT_MIN_VISIBLE_MS) {
            // Stay on "reconnecting" — but the frame *did* update so the
            // visible image is fresh.
            return;
          }
          reconnectingShownAt.current = null;
        }
        setFeedState("live");
      } catch {
        // Same checkpoint on the failure path — a superseded run must not
        // report errors against the camera that replaced it. (Cleanup aborts
        // the in-flight fetch, so this branch is also where that abort lands.)
        if (cancelled) return;
        consecutiveErrors.current++;

        if (!hadFrameRef.current) {
          // First-load failure: stay in CONNECTING indefinitely. We have
          // no positive evidence this camera is offline (the roster's
          // is_live gate already vouched for it). The amber spinner is
          // the honest "still trying" affordance; flipping to red OFFLINE
          // here would lie to the user about what we know.
          setFeedState("connecting");
          return;
        }

        // Stay on "live" through small hiccups so the UI doesn't flicker; only
        // surface "reconnecting" after several consecutive failures.
        if (consecutiveErrors.current >= OFFLINE_THRESHOLD) {
          setFeedState("offline");
          reconnectingShownAt.current = null;
        } else if (consecutiveErrors.current >= RECONNECT_SHOW_THRESHOLD) {
          if (reconnectingShownAt.current === null) {
            reconnectingShownAt.current = Date.now();
          }
          setFeedState("reconnecting");
        }
        // else: stay on whatever we were (typically "live"); below threshold.
      } finally {
        clearTimeout(abortTimer);
        if (inFlight === ac) inFlight = null;
        // Re-arm only while this run still owns the tile. This is the line
        // that used to resurrect superseded chains: gated on the shared
        // `mountedRef`, it re-armed a timer stored in *this* run's `nextTick`,
        // which the current cleanup closes over a different binding of and
        // therefore can never clear.
        if (!cancelled) {
          nextTick = setTimeout(fetchFrame, POLL_INTERVAL);
        }
      }
    };

    fetchFrame();

    return () => {
      cancelled = true;
      if (nextTick) clearTimeout(nextTick);
      // Drop the superseded request immediately rather than leaving it to
      // occupy one of the browser's per-host connections until it resolves.
      // The abort surfaces in fetchFrame's catch, which the `cancelled`
      // checkpoint turns into a no-op.
      inFlight?.abort();
      inFlight = null;
      // Release the rendered blob. Covers both teardown paths: on unmount
      // nothing else would free it, and on a camera switch the effect body
      // has already blanked `frameUrl` for the incoming camera.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [cameraName, maxWidth]);

  useEffect(() => {
    if (online === true && feedState === "offline") {
      consecutiveErrors.current = 0;
      reconnectingShownAt.current = null;
      setFeedState(frameUrl ? "live" : "connecting");
    }
  }, [online, feedState, frameUrl]);

  const showFeed = frameUrl !== null && feedState !== "offline";
  const isConnecting = feedState === "connecting";
  const isReconnecting = feedState === "reconnecting";
  const isOffline = feedState === "offline";

  useEffect(() => {
    onStatusChange?.(cameraName, feedState);
  }, [feedState, cameraName, onStatusChange]);

  const indicatorClass =
    feedState === "live"
      ? "bg-emerald-500 animate-pulse"
      : feedState === "offline"
        ? "bg-red-500"
        : "bg-amber-400 animate-pulse";

  const overlayTextClass =
    feedState === "live"
      ? "text-emerald-400"
      : feedState === "offline"
        ? "text-red-400"
        : "text-amber-300";

  const overlayLabel =
    feedState === "live"
      ? "LIVE"
      : feedState === "offline"
        ? "OFFLINE"
        : isReconnecting
          ? "RECONNECTING"
          : "CONNECTING";

  return (
    <div
      className="min-w-0 w-full h-full rounded border border-guardian-border overflow-hidden relative"
      style={{ background: "#0a0f1e" }}
    >
      {showFeed ? (
        // Plain <img> is intentional: frameUrl is a blob: URL created from
        // createObjectURL every ~1.2s. next/image expects stable remote
        // sources it can optimize at the CDN; routing every snapshot through
        // its optimization pipeline would just add overhead for no gain.
        // eslint-disable-next-line @next/next/no-img-element -- blob: URL from snapshot polling, not CDN-optimizable
        <img
          src={frameUrl!}
          alt={`Live farm camera — ${label}`}
          className="w-full h-full object-contain block"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center min-h-[80px]">
          <div className="text-center px-4 flex flex-col items-center gap-2">
            {isConnecting && (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
                <div className="text-amber-300 text-sm font-mono">CONNECTING…</div>
                <div className="text-guardian-muted text-[0.65rem] max-w-[180px] leading-snug">
                  First frame can take a few seconds — the snapshot
                  travels through the Cloudflare tunnel back from the
                  Mac Mini.
                </div>
              </>
            )}
            {isOffline && (
              <div className="text-red-500/70 text-sm">OFFLINE</div>
            )}
            <div className="text-guardian-muted text-[0.7rem]">{label}</div>
          </div>
        </div>
      )}

      {showFeed && isReconnecting && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-center pointer-events-none">
          <span className="text-amber-300 text-[0.65rem] font-mono tracking-wider">
            RECONNECTING · holding last good frame
          </span>
        </div>
      )}

      {/* Feed overlay — width-capped so a long/unmapped camera name (see
          resolveCameraMeta's fallback in lib/cameras.ts) truncates instead
          of growing wide enough to cover the whole thumbnail. */}
      <div className="absolute top-1.5 right-1.5 max-w-[calc(100%-0.75rem)] bg-black/70 rounded px-2 py-0.5 text-[0.65rem] flex items-center gap-1.5 font-mono">
        <span
          className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${indicatorClass}`}
        />
        <span className="text-slate-300 truncate min-w-0">{label}</span>
        <span className={`shrink-0 ${overlayTextClass}`}>{overlayLabel}</span>
      </div>
    </div>
  );
}
