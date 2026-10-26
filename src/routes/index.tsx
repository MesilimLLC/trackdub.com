import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { toast } from "sonner";
import { z } from "zod";
import { PRICING_PLANS } from "@/lib/pricing";
import { PlanCard } from "@/components/plan-card";
import { SectionHeading } from "@/components/section-heading";
import { Github } from "lucide-react";
import trackdubLogo from "@/assets/trackdub-logo.webp.asset.json";
const trackdubIcon = trackdubLogo.url;
import { CompanyAttribution, CompanyReturnBar } from "@/components/company-identity";

const GITHUB_REPO = "https://github.com/mesalimllc/Trackdub";

// Module-scope helpers for browser APIs that React's purity rules flag when
// they appear lexically inside component code. Every call site below is an
// event handler, an rAF loop, or a mount-time read — never render — but
// routing through these keeps the rules quiet with zero behavioral change.
function now(): number {
  return performance.now();
}

function setLocationHash(hash: string) {
  window.location.hash = hash;
}

// Math.sin/Math.cos can differ in the last bit between Bun (SSR) and the
// browser's JS engine, which trips React hydration mismatch warnings for
// decorative SVG generators. Rounding right after the trig call keeps SSR
// and client markup byte-identical.
function round3(n: number) {
  return Number(n.toFixed(3));
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Does my video get uploaded anywhere?",
    a: "No. Trackdub runs the whole pipeline on your machine by default. Cloud endpoints exist for teams that want them, but they're opt-in per project and per stage, never implicit.",
  },
  {
    q: "What happens to my data if I uninstall?",
    a: "Your projects, source media, and generated output live in folders you chose, so they stay where they are until you delete them. The app data directory (model cache, preferences, and logs) can be removed during uninstall or manually from %LOCALAPPDATA%\\Trackdub.",
  },
  {
    q: "Can I use it commercially?",
    a: "Yes, on every tier, including Free. Free exports carry a small watermark and cap at 5 minutes; Pro removes both. Every bundled model is commercial-safe by manifest, so nothing research-only ever loads.",
  },
  {
    q: "How is the voice cloning handled?",
    a: "Each detected speaker gets one short reference clip you can review or replace. The voicing stage uses that reference: one voice per person, not one 'AI voice' for the whole video. References stay on your disk.",
  },
  {
    q: "What if the ASR gets a word wrong?",
    a: "Fix it in the transcript. The translation for that line invalidates, the voicing for that line queues for a regen, and nothing else rebuilds. Every stage declares its inputs, so edits propagate exactly as far as they need to.",
  },
  {
    q: "Do I need a GPU?",
    a: "No. CPU execution is the portable baseline. Compatible hardware can use TensorRT RTX, CUDA, DirectML, CoreML, MIGraphX, OpenVINO, or QNN per stage, with automatic fallback when a provider or model combination is unavailable.",
  },
  {
    q: "Can I automate it?",
    a: "Yes. The CLI ships in every tier, Free included. The same pipeline the app runs is scriptable for batch localization, CI, or an on-prem REST worker via the SDK.",
  },
  {
    q: "Can the whole pipeline run offline?",
    a: "Yes. Once the models you selected are downloaded, every bundled stage can run without an internet connection. Hosted translation or voice providers are optional and configured one stage at a time.",
  },
  {
    q: "Can I choose which accelerator Trackdub uses?",
    a: "Yes. Automatic mode selects the best compatible provider per stage, while an execution policy lets you prefer or exclude providers. A stage can fall back without changing the rest of the project.",
  },
  {
    q: "What operating systems are supported?",
    a: "Trackdub targets Windows, macOS, and Linux with the same project format. Available acceleration providers differ by operating system and hardware, but CPU execution remains the portable fallback.",
  },
  {
    q: "Can I use a cloud provider for only one stage?",
    a: "Yes. You can route translation or voice generation to a provider you configure while keeping ingest, transcription, timing, mixing, and the rest of the project local.",
  },
  {
    q: "How are model licenses handled?",
    a: "Every bundled model is declared in the model manifest with its source, checksum, and commercial-use lane. Unknown or research-only licenses are not treated as safe bundled defaults.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trackdub · A desktop workstation for dubbing video" },
      {
        name: "description",
        content:
          "Trackdub is a local-first desktop workstation for dubbing video into other languages. Editable stages, deterministic runs, your media stays on your machine.",
      },
      { property: "og:title", content: "Trackdub · A desktop workstation for dubbing video" },
      {
        property: "og:description",
        content:
          "Local-first, stage-by-stage dubbing. Editable script, per-line voice, alignment, mix: all inspectable.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Trackdub",
          url: "https://trackdub.com",
          description: "Local-first Windows desktop workstation for AI video dubbing.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((it) => ({
            "@type": "Question",
            name: it.q,
            acceptedAnswer: { "@type": "Answer", text: it.a },
          })),
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  useReveal();
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-accent/20 selection:text-ink">
      <Masthead />
      <SectionRail />
      <main>
        <Lead />
        <PipelineFeature />
        <ProductPlate />
        <TrustStrip />
        <Walkthrough />
        <ResumableJob />
        <StageChapters />
        <Control />
        <Performance />
        <LocalFirst />
        <WhatYouGet />
        <ComparedTo />
        <Pricing />
        <FAQ />
        <Endnote />
      </main>
      <Colophon />
    </div>
  );
}

/* ---------------- shared bits ---------------- */

const NAV = [
  { href: "#pipeline", label: "Pipeline" },
  { href: "#walkthrough", label: "Try it" },
  { href: "#resume", label: "Resume" },
  { href: "#control", label: "Control" },
  { href: "#performance", label: "Performance" },
  { href: "#architecture", label: "Local-first" },
  { href: "#manifest", label: "Manifest" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#waitlist", label: "Launch list" },
];
const NAV_PRIMARY = new Set(["#pipeline", "#walkthrough", "#control", "#performance", "#pricing"]);

function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-6xl px-6 sm:px-10 ${className}`}>{children}</div>;
}

function SectionNumber({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-10 sm:mb-14" data-lead>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-accent" aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Chapter
        </span>
      </div>
      <div className="flex items-baseline gap-4 sm:gap-5">
        <span className="font-mono text-2xl leading-none tracking-tight text-accent sm:text-3xl">
          {n}
        </span>
        <span className="h-6 w-px self-center bg-border" aria-hidden />
        <span className="font-serif text-[20px] leading-tight tracking-tight text-foreground sm:text-[24px]">
          {label}
        </span>
      </div>
    </div>
  );
}

function Rule({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-border ${className}`} aria-hidden />;
}

// Click a rubber stamp to re-slam it. No-op under reduce-motion (the
// stamp-thunk animation is disabled there, so nothing replays).
function replayStamp(e: React.MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "";
}

/* ---------------- section rail (kinetic progress) ---------------- */

function SectionRail() {
  const [active, setActive] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const itemsRef = useRef<Record<string, HTMLAnchorElement | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const navIds = useRef(new Set(NAV.map((n) => n.href.slice(1))));
  const activeRef = useRef<string>("");
  const [scrubbing, setScrubbing] = useState(false);
  // Direct DOM refs so scroll/pointer frames write straight to style,
  // bypassing React re-renders and the reconciler.
  const progressFillRef = useRef<HTMLSpanElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const dragStartYRef = useRef(0);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const scrubRafRef = useRef<number | null>(null);
  const pendingScrubYRef = useRef<number | null>(null);
  // Track the active pointer id so global safety-net listeners (window
  // pointercancel, blur, visibilitychange) can force-release capture even
  // if the element-scoped pointerup/cancel never fires — e.g. the OS
  // hijacks the gesture, the tab is backgrounded mid-drag, or a modal
  // steals focus. Without this the drag stays "captured" forever and the
  // rail desyncs from real scroll position on the next interaction.
  const activePointerIdRef = useRef<number | null>(null);
  // Velocity tracking for touch inertia. We keep a short ring buffer of
  // recent pointer samples so release velocity reflects the last ~80ms of
  // motion, not the whole gesture — feels natural on touchscreens.
  const scrubSamplesRef = useRef<Array<{ y: number; t: number }>>([]);
  const pointerTypeRef = useRef<string>("mouse");
  const inertiaRafRef = useRef<number | null>(null);
  // Custom smooth-scroll animation state so we can retarget or interrupt
  // mid-flight (native window.scrollTo({behavior:'smooth'}) can't be cancelled
  // or re-aimed without racing the browser).
  const smoothRafRef = useRef<number | null>(null);
  const smoothTargetRef = useRef<number | null>(null);
  const smoothStartRef = useRef<{ y: number; t: number } | null>(null);
  const smoothDurRef = useRef(560);

  // Single centralized rail-frame scheduler. All DOM writes for the rail
  // (progress fill scaleY, active indicator translateY/height, aria-valuenow,
  // visibility toggle) go through one ordered pass so scroll, resize,
  // active-change, and pointer scrubs never race or double-write.
  const scheduleRailFrameRef = useRef<() => void>(() => {});

  const prefersReducedMotion = () =>
    typeof document !== "undefined" &&
    (document.documentElement.classList.contains("reduce-motion") ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  const cancelSmoothScroll = () => {
    if (smoothRafRef.current !== null) {
      window.cancelAnimationFrame(smoothRafRef.current);
      smoothRafRef.current = null;
    }
    smoothTargetRef.current = null;
    smoothStartRef.current = null;
  };

  const cancelInertia = () => {
    if (inertiaRafRef.current !== null) {
      window.cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
  };

  const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const animateScrollTo = (targetY: number) => {
    const docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const clamped = Math.min(docMax, Math.max(0, targetY));
    // If a scroll is in flight, retarget it: keep the current position as the
    // new start and restart the clock so easing stays continuous.
    smoothTargetRef.current = clamped;
    const startedAt = now();
    const distance = Math.abs(clamped - window.scrollY);
    // Scale duration modestly with distance, capped for snappiness.
    smoothDurRef.current = Math.min(280, Math.max(140, 120 + distance * 0.08));
    smoothStartRef.current = { y: window.scrollY, t: startedAt };
    if (smoothRafRef.current !== null) return; // loop already running
    const step = () => {
      const start = smoothStartRef.current;
      const target = smoothTargetRef.current;
      if (start === null || target === null) {
        smoothRafRef.current = null;
        return;
      }
      const elapsed = now() - start.t;
      const p = Math.min(1, elapsed / smoothDurRef.current);
      const y = start.y + (target - start.y) * easeOutExpo(p);
      window.scrollTo(0, y);
      if (p < 1) {
        smoothRafRef.current = window.requestAnimationFrame(step);
      } else {
        smoothRafRef.current = null;
        smoothTargetRef.current = null;
        smoothStartRef.current = null;
      }
    };
    smoothRafRef.current = window.requestAnimationFrame(step);
  };

  const scrollToTargetId = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY;
    if (prefersReducedMotion()) {
      cancelSmoothScroll();
      window.scrollTo({ top, behavior: "auto" });
      return;
    }
    animateScrollTo(top);
  };

  const applyScrubFromClientY = (clientY: number) => {
    const list = listRef.current;
    if (!list) return;
    const box = list.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientY - box.top) / Math.max(1, box.height)));
    const docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    // Scrubbing takes over from any in-flight smooth scroll.
    cancelSmoothScroll();
    window.scrollTo({ top: f * docMax, behavior: "auto" });
    // Nudge the centralized rail scheduler so progress/indicator update on
    // the same frame as the scroll write — don't wait for scroll event.
    scheduleRailFrameRef.current();
  };

  // Resolve a pointer y to the nearest chapter anchor. Powers "click anywhere
  // on the rail" — clicks that don't land exactly on an anchor still jump to
  // the closest chapter instead of doing nothing.
  const nearestChapterId = (clientY: number): string | null => {
    let bestId: string | null = null;
    let bestDist = Infinity;
    for (const [id, el] of Object.entries(itemsRef.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const d = Math.abs(clientY - center);
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
    return bestId;
  };

  const jumpToChapter = (id: string) => {
    const href = `#${id}`;
    if (window.history?.pushState) {
      window.history.pushState(null, "", href);
      setActive(id);
    } else {
      setLocationHash(href);
    }
    scrollToTargetId(id);
  };

  // Convert a pointer sample into document scroll position, but only push
  // samples for velocity — the actual scroll happens via applyScrubFromClientY.
  const pushSample = (clientY: number) => {
    const list = listRef.current;
    if (!list) return;
    const box = list.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientY - box.top) / Math.max(1, box.height)));
    const docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const y = f * docMax;
    const sampledAt = now();
    const buf = scrubSamplesRef.current;
    buf.push({ y, t: sampledAt });
    // Keep only the last ~120ms of samples.
    while (buf.length > 2 && sampledAt - buf[0].t > 120) buf.shift();
  };

  const releaseVelocity = () => {
    const buf = scrubSamplesRef.current;
    if (buf.length < 2) return 0;
    const first = buf[0];
    const last = buf[buf.length - 1];
    const dt = Math.max(1, last.t - first.t);
    return (last.y - first.y) / dt; // px per ms in document space
  };

  const startInertia = (v0: number) => {
    // Ignore trivial flicks so a slow drag doesn't drift after release.
    if (Math.abs(v0) < 0.35) return;
    cancelInertia();
    cancelSmoothScroll();
    let v = v0;
    let last = now();
    // Exponential decay — friction tuned so a hard fling settles in ~600ms.
    const decayPerMs = 0.995;
    const step = () => {
      const nowT = now();
      const dt = nowT - last;
      last = nowT;
      const docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const nextY = Math.min(docMax, Math.max(0, window.scrollY + v * dt));
      window.scrollTo(0, nextY);
      v *= Math.pow(decayPerMs, dt);
      // Stop at edges or when velocity is negligible.
      if (Math.abs(v) < 0.02 || nextY === 0 || nextY === docMax) {
        inertiaRafRef.current = null;
        return;
      }
      inertiaRafRef.current = window.requestAnimationFrame(step);
    };
    inertiaRafRef.current = window.requestAnimationFrame(step);
  };

  const scheduleScrub = (clientY: number) => {
    pendingScrubYRef.current = clientY;
    if (scrubRafRef.current !== null) return;
    scrubRafRef.current = window.requestAnimationFrame(() => {
      scrubRafRef.current = null;
      const y = pendingScrubYRef.current;
      pendingScrubYRef.current = null;
      if (y !== null) applyScrubFromClientY(y);
    });
  };
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Cancel any in-flight smooth scroll the moment the user takes over with
  // the wheel, touch, or keyboard — the animation should never fight input.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cancel = () => {
      cancelSmoothScroll();
      cancelInertia();
    };
    const onKey = (e: KeyboardEvent) => {
      // Only cancel for keys that actually scroll.
      const scrollKeys = new Set([
        "PageUp",
        "PageDown",
        "Home",
        "End",
        "ArrowUp",
        "ArrowDown",
        " ",
        "Spacebar",
      ]);
      if (scrollKeys.has(e.key)) cancel();
    };
    // All three are read-only w.r.t. the event (never preventDefault) — mark
    // passive so the browser can start scrolling without waiting on this JS.
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });
    return () => {
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", onKey);
      cancelSmoothScroll();
      cancelInertia();
    };
  }, []);

  // Sync with URL hash — deep links should highlight the right chapter.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromHash = () => {
      const id = window.location.hash.slice(1);
      if (id && navIds.current.has(id) && id !== activeRef.current) {
        setActive(id);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ids = NAV.map((n) => n.href.slice(1));
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;

    // Track intersection ratios in a map so the "most visible" pick is O(n)
    // over sections, not a resort of every entry batch.
    const ratios = new Map<string, number>();
    targets.forEach((t) => ratios.set(t.id, 0));
    let currentActive = "";

    const pickActive = () => {
      let bestId = currentActive;
      let bestRatio = -1;
      ratios.forEach((r, id) => {
        if (r > bestRatio) {
          bestRatio = r;
          bestId = id;
        }
      });
      if (bestRatio > 0 && bestId !== currentActive) {
        currentActive = bestId;
        setActive(bestId);
      }
    };

    // Coalesce IO callbacks + pickActive into a single rAF so a burst of
    // entries during fast scrolls schedules exactly one setState.
    let pickScheduled = false;
    const schedulePick = () => {
      if (pickScheduled) return;
      pickScheduled = true;
      window.requestAnimationFrame(() => {
        pickScheduled = false;
        pickActive();
      });
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        }
        schedulePick();
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    targets.forEach((t) => io.observe(t));

    // Cache scroll extent — recompute only when layout actually changes,
    // not inside the scroll handler (avoids forced reflow every frame).
    let docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    let lastVisible = false;
    let lastProgress = -1;
    let lastAria = -1;
    let lastIndTop = Number.NaN;
    let lastIndHeight = Number.NaN;
    let rafId: number | null = null;
    let ticking = false;

    // Strict-ordered, redundant-write-free write pass. Reads first, then
    // writes in a fixed order: visibility → progress fill → aria-valuenow →
    // indicator geometry. Each property gates on a "changed enough" check
    // so we never touch style or attributes when nothing moved.
    const writeRailFrame = () => {
      ticking = false;
      rafId = null;

      // 1) Reads (batched — no interleaved writes → no layout thrash)
      const y = window.scrollY;
      const p = docMax > 0 ? Math.min(1, Math.max(0, y / docMax)) : 0;
      const activeEl = itemsRef.current[activeRef.current];

      // 2) Visibility
      const nextVisible = y > 480;
      if (nextVisible !== lastVisible) {
        lastVisible = nextVisible;
        setVisible(nextVisible);
      }

      // 3) Progress fill
      if (Math.abs(p - lastProgress) > 0.002) {
        lastProgress = p;
        const fill = progressFillRef.current;
        if (fill) fill.style.transform = `scaleY(${p})`;
      }

      // 4) aria-valuenow — only when the rounded value flips
      const ariaVal = Math.round(p * 100);
      if (ariaVal !== lastAria) {
        lastAria = ariaVal;
        const list = listRef.current;
        if (list) list.setAttribute("aria-valuenow", String(ariaVal));
      }

      // 5) Active indicator — offsetTop/offsetHeight against offsetParent
      //    (the rail list) is cheap, no full layout flush.
      if (activeEl) {
        const top = activeEl.offsetTop;
        const height = activeEl.offsetHeight;
        const ind = indicatorRef.current;
        if (ind) {
          if (top !== lastIndTop) {
            lastIndTop = top;
            ind.style.transform = `translateY(${top}px)`;
          }
          if (height !== lastIndHeight) {
            lastIndHeight = height;
            ind.style.height = `${height}px`;
          }
        }
      }
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      rafId = window.requestAnimationFrame(writeRailFrame);
    };

    // Expose so active-change effect and pointer scrubs funnel into the
    // same scheduler — one rAF, one ordered write pass.
    scheduleRailFrameRef.current = schedule;

    const onResize = () => {
      docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      // Rail height may have shifted even if active row didn't — force
      // indicator geometry to re-write on the next frame.
      lastIndTop = Number.NaN;
      lastIndHeight = Number.NaN;
      schedule();
    };

    writeRailFrame();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    // Layout of the page changes as images/fonts load and reveals expand —
    // keep docMax honest without polling.
    const ro = new ResizeObserver(onResize);
    ro.observe(document.documentElement);

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      scheduleRailFrameRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // Route active-state / visibility flips through the single rail-frame
    // scheduler so the indicator write lands in the same ordered pass as
    // the progress fill — no dueling rAFs, no split ordering.
    scheduleRailFrameRef.current();
    const ro = new ResizeObserver(() => scheduleRailFrameRef.current());
    ro.observe(list);
    return () => ro.disconnect();
  }, [active, visible]);

  const handleRailPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // A fresh press on the rail always wins over any in-flight animation.
    cancelSmoothScroll();
    cancelInertia();
    // If a prior gesture never cleanly released (rare browser edge case),
    // tear it down before starting a new one so state stays consistent.
    if (activePointerIdRef.current !== null) {
      finishScrub("pointercancel", null);
    }
    pointerTypeRef.current = e.pointerType;
    // Velocity samples are only used for touch inertia.
    scrubSamplesRef.current = e.pointerType === "touch" ? [{ y: window.scrollY, t: now() }] : [];
    dragStartYRef.current = e.clientY;
    draggingRef.current = false;
    suppressClickRef.current = false;
    // Try to capture — some browsers/pointer types (rare synthetic events)
    // reject; either way, record the id so global cleanup can find it.
    try {
      listRef.current?.setPointerCapture?.(e.pointerId);
    } catch {
      /* capture unavailable — global safety net still handles cancel */
    }
    activePointerIdRef.current = e.pointerId;
  };
  const handleRailPointerMove = (e: PointerEvent) => {
    const list = listRef.current;
    if (!list?.hasPointerCapture?.(e.pointerId)) return;
    const dy = e.clientY - dragStartYRef.current;
    const isTouch = pointerTypeRef.current === "touch";
    // Touch pointers are less precise than a mouse — use a larger threshold
    // so a stationary tap doesn't get promoted to a drag by finger jitter.
    const threshold = isTouch ? 8 : 4;
    if (!draggingRef.current && Math.abs(dy) < threshold) return;
    if (!draggingRef.current) {
      draggingRef.current = true;
      suppressClickRef.current = true;
      setScrubbing(true);
    }
    e.preventDefault();
    if (isTouch) {
      // Touch: rAF-coalesce writes and sample velocity so release can fling.
      pushSample(e.clientY);
      scheduleScrub(e.clientY);
    } else {
      // Mouse / pen: 1:1 with the cursor. Apply synchronously so the page
      // tracks the pointer every frame, like a native scrollbar thumb —
      // no rAF batching, no velocity buffering, no inertia on release.
      applyScrubFromClientY(e.clientY);
    }
  };
  // Single teardown path for every scrub end (clean release, cancel, or
  // global safety-net). `endType` mirrors PointerEvent.type semantics —
  // "pointercancel" skips inertia and skips click/tap resolution; `clientY`
  // is null when the global safety net triggered (no pointer coordinates).
  const finishScrub = (endType: string, clientY: number | null) => {
    const list = listRef.current;
    const pid = activePointerIdRef.current;
    // Always attempt to release capture — belt and braces against browsers
    // that report hasPointerCapture=false while still holding it.
    if (list && pid !== null) {
      try {
        if (list.hasPointerCapture?.(pid)) list.releasePointerCapture(pid);
      } catch {
        /* already released */
      }
    }
    // Always flush any pending scrub rAF so scroll position is final before
    // we decide what to do next — otherwise inertia (or the resync frame)
    // starts from a stale y.
    if (scrubRafRef.current !== null) {
      window.cancelAnimationFrame(scrubRafRef.current);
      scrubRafRef.current = null;
      if (pendingScrubYRef.current !== null) {
        applyScrubFromClientY(pendingScrubYRef.current);
        pendingScrubYRef.current = null;
      }
    }
    const isTouch = pointerTypeRef.current === "touch";
    const wasDragging = draggingRef.current;
    if (wasDragging) {
      if (isTouch && endType !== "pointercancel") {
        startInertia(releaseVelocity());
      }
      // Reset next tick so the anchor's own click handler (fired after
      // pointerup) still sees suppressClickRef=true and cancels navigation.
      window.setTimeout(() => {
        draggingRef.current = false;
        setScrubbing(false);
      }, 0);
    } else if (endType !== "pointercancel" && clientY !== null) {
      // Non-drag release with real coordinates = a click/tap on the rail.
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      const id = nearestChapterId(clientY);
      if (id) jumpToChapter(id);
    }
    scrubSamplesRef.current = [];
    activePointerIdRef.current = null;
    // Force one final ordered write pass so progress fill and active
    // indicator reflect the final scroll position immediately — don't
    // wait for the next scroll event (which may never fire if the drag
    // ended exactly on the current scroll pos).
    scheduleRailFrameRef.current();
  };

  const handleRailPointerUp = (e: PointerEvent) => {
    // Ignore stray up/cancel from pointers we didn't capture (e.g. a second
    // finger releasing while the primary drag continues).
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
      return;
    }
    finishScrub(e.type, e.clientY);
  };

  // The pointer handlers are recreated every render, but the native-listener
  // effect below must mount exactly once (it controls passive flags and the
  // global safety nets). Route events through a ref that always holds the
  // latest closures, so the effect keeps a stable dependency list instead of
  // re-attaching listeners (or capturing stale handlers) on every render.
  const railHandlersRef = useRef({
    down: handleRailPointerDown,
    move: handleRailPointerMove,
    up: handleRailPointerUp,
    finish: finishScrub,
  });
  useEffect(() => {
    railHandlersRef.current = {
      down: handleRailPointerDown,
      move: handleRailPointerMove,
      up: handleRailPointerUp,
      finish: finishScrub,
    };
  });

  // Attach rail pointer listeners natively so we control passive flags:
  // down/up/cancel are passive (never preventDefault → browser doesn't have
  // to wait on JS before scrolling elsewhere on the page); move stays
  // non-passive because a promoted drag calls preventDefault to suppress
  // native text/scroll selection. React's synthetic delegation would attach
  // all four as non-passive on the root — this avoids that overhead.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const handlers = railHandlersRef;
    const down = (e: PointerEvent) => handlers.current.down(e);
    const move = (e: PointerEvent) => handlers.current.move(e);
    const up = (e: PointerEvent) => handlers.current.up(e);
    list.addEventListener("pointerdown", down, { passive: true });
    list.addEventListener("pointermove", move, { passive: false });
    list.addEventListener("pointerup", up, { passive: true });
    list.addEventListener("pointercancel", up, { passive: true });
    // Safety nets: if the OS/browser hijacks the gesture, the tab is
    // backgrounded, or focus is stolen mid-drag, element-scoped
    // pointerup/cancel may never arrive. Force cleanup so the rail can't
    // get stuck in a captured/dragging state.
    const onWindowCancel = (e: PointerEvent) => {
      if (activePointerIdRef.current !== null && e.pointerId === activePointerIdRef.current) {
        handlers.current.finish("pointercancel", null);
      }
    };
    const onWindowUp = (e: PointerEvent) => {
      // Only fires if the element handler missed it (e.g. pointer released
      // outside a captured region on a browser that dropped capture).
      if (activePointerIdRef.current !== null && e.pointerId === activePointerIdRef.current) {
        handlers.current.finish(e.type, e.clientY);
      }
    };
    const onLostCapture = () => {
      if (activePointerIdRef.current !== null) {
        handlers.current.finish("pointercancel", null);
      }
    };
    const onBlurOrHide = () => {
      if (activePointerIdRef.current !== null) {
        handlers.current.finish("pointercancel", null);
      }
    };
    window.addEventListener("pointercancel", onWindowCancel, { passive: true });
    window.addEventListener("pointerup", onWindowUp, { passive: true });
    list.addEventListener("lostpointercapture", onLostCapture, { passive: true });
    window.addEventListener("blur", onBlurOrHide);
    document.addEventListener("visibilitychange", onBlurOrHide);
    return () => {
      list.removeEventListener("pointerdown", down);
      list.removeEventListener("pointermove", move);
      list.removeEventListener("pointerup", up);
      list.removeEventListener("pointercancel", up);
      window.removeEventListener("pointercancel", onWindowCancel);
      window.removeEventListener("pointerup", onWindowUp);
      list.removeEventListener("lostpointercapture", onLostCapture);
      window.removeEventListener("blur", onBlurOrHide);
      document.removeEventListener("visibilitychange", onBlurOrHide);
    };
  }, []);

  return (
    <aside
      className={`pointer-events-none fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 transition-opacity duration-500 xl:flex ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        ref={listRef}
        className={`pointer-events-auto relative flex min-h-[420px] flex-col py-2 pl-3 pr-2 touch-none select-none ${scrubbing ? "cursor-grabbing" : "cursor-grab"}`}
        role="slider"
        aria-label="Page scroll position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
      >
        {/* vertical track */}
        <span
          className="pointer-events-none absolute left-0 top-1 bottom-1 w-0.5 bg-border/70"
          aria-hidden
        />
        {/* progress fill */}
        <span
          ref={progressFillRef}
          className="pointer-events-none absolute left-0 top-1 w-0.5 origin-top bg-foreground/40"
          style={{
            height: "calc(100% - 0.5rem)",
            transform: "scaleY(0)",
            transformOrigin: "top",
            willChange: "transform",
          }}
          aria-hidden
        />
        {/* active indicator */}
        <span
          ref={indicatorRef}
          className="pointer-events-none absolute left-[-1px] w-[3px] rounded-full bg-accent"
          style={{
            transform: "translateY(0px)",
            height: "12px",
            willChange: "transform, height",
            transition: "transform 180ms cubic-bezier(0.22, 1, 0.36, 1), height 140ms ease-out",
          }}
          aria-hidden
        />
        {NAV.map((n, i) => {
          const id = n.href.slice(1);
          const isActive = active === id;
          const isHovered = hovered === id;
          const showTip = isHovered;
          return (
            <a
              key={id}
              href={n.href}
              ref={(el) => {
                itemsRef.current[id] = el;
              }}
              className="pointer-events-auto group relative flex flex-1 min-h-[32px] cursor-pointer items-center gap-3 rounded-sm px-1 transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:bg-foreground/[0.04]"
              aria-label={`Jump to ${n.label}`}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered((h) => (h === id ? null : h))}
              onFocus={() => setHovered(id)}
              onBlur={() => setHovered((h) => (h === id ? null : h))}
              onClick={(e) => {
                // Swallow the click if the user was scrubbing — pointerup
                // fires before click, so draggingRef is still true here.
                if (suppressClickRef.current || draggingRef.current) {
                  e.preventDefault();
                  suppressClickRef.current = false;
                  return;
                }
                e.preventDefault();
                // Update the URL hash without the browser's default jump so
                // our smooth scroll owns the motion. Fall back to hash= if
                // history is unavailable.
                if (window.history?.pushState) {
                  window.history.pushState(null, "", n.href);
                  // hashchange doesn't fire for pushState, so sync manually.
                  setActive(id);
                } else {
                  window.location.hash = n.href;
                }
                scrollToTargetId(id);
              }}
            >
              <span
                className={`h-px transition-all duration-300 ease-out ${isActive ? "w-6 bg-accent" : "w-3 bg-border group-hover:w-5 group-hover:bg-foreground/60"}`}
              />
              <span
                aria-hidden
                className={`font-mono text-[10px] uppercase tracking-[0.14em] transition-all duration-300 ${isActive ? "text-accent opacity-100 translate-x-0" : "text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"}`}
              >
                {String(i + 1).padStart(2, "0")} · {n.label}
              </span>
            </a>
          );
        })}
      </div>
    </aside>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-baseline gap-1 border-b border-foreground/30 pb-0.5 text-foreground transition-colors hover:border-accent hover:text-accent"
    >
      {children}
    </a>
  );
}

function InkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const base =
    "btn-sheen inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const styles =
    variant === "primary"
      ? "border border-[var(--burgundy)] bg-[var(--burgundy)] text-[var(--cream)] hover:border-[var(--rust)] hover:bg-[var(--rust)]"
      : "border border-[var(--rust)] text-[var(--burgundy)] hover:bg-[var(--rust)] hover:text-[var(--cream)]";
  return (
    <a href={href} className={`${base} ${styles}`}>
      {children}
    </a>
  );
}

/* ---------------- masthead ---------------- */

function Masthead() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-border bg-background">
      <CompanyReturnBar />
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-6 px-6 sm:h-[88px] sm:px-10">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-3 font-serif text-2xl leading-none tracking-tight text-foreground sm:text-[38px]"
          aria-label="Trackdub home"
        >
          <img
            src={trackdubIcon}
            alt=""
            aria-hidden="true"
            className="h-[1.1em] w-auto shrink-0 -translate-y-[0.03em]"
          />
          <span>
            Trackdub<span className="text-accent">.</span>
          </span>
        </a>
        <nav
          className="hidden flex-1 items-center justify-center gap-x-7 md:flex"
          aria-label="Primary"
        >
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground ${
                NAV_PRIMARY.has(n.href) ? "" : "hidden"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden shrink-0 items-center gap-4 md:flex lg:gap-5">
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Trackdub on GitHub"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-5 w-5" aria-hidden="true" />
          </a>
          <div className="hidden lg:block">
            <MotionToggle />
          </div>
          <InkButton href="#waitlist">Join launch list</InkButton>
        </div>
        <button
          className="md:hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col py-4">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
            <div className="py-2">
              <MotionToggle />
            </div>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              <Github className="h-4 w-4" aria-hidden="true" /> GitHub
            </a>
            <InkButton href="#waitlist">Join launch list</InkButton>
          </Container>
        </div>
      )}
    </header>
  );
}

/* ---------------- motion toggle ---------------- */

type MotionMode = "full" | "reduced";
const MOTION_KEY = "trackdub:motion";

// The motion preference lives in localStorage and defaults to the OS
// prefers-reduced-motion setting when unset. It's modeled as an external
// store via useSyncExternalStore — not state set inside an effect — so the
// two toggle instances (desktop header + mobile menu) stay in sync and SSR
// hydration stays safe: the server snapshot renders the default, then the
// store corrects to the saved preference once mounted.
const motionSubscribers = new Set<() => void>();
// Set only when localStorage.setItem throws. Non-null means the last chosen
// mode could not be persisted; prefer it over a readable-but-stale getItem
// result so the toggle still updates when writes are blocked.
let motionMemory: MotionMode | null = null;

function motionSubscribe(onStoreChange: () => void) {
  motionSubscribers.add(onStoreChange);
  return () => {
    motionSubscribers.delete(onStoreChange);
  };
}

function motionNotify() {
  for (const cb of motionSubscribers) cb();
}

function getMotionSnapshot(): MotionMode {
  if (typeof window === "undefined") return "full";
  if (motionMemory) return motionMemory;
  try {
    const stored = localStorage.getItem(MOTION_KEY);
    if (stored === "full" || stored === "reduced") return stored;
  } catch {
    // Fall through to OS preference when storage is unreadable.
  }
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full";
}

function getMotionServerSnapshot(): MotionMode {
  return "full";
}

function MotionToggle() {
  const mode = useSyncExternalStore(motionSubscribe, getMotionSnapshot, getMotionServerSnapshot);

  // Apply the preference to the document (an external system) — a DOM sync,
  // not a state write, so it stays legal in an effect.
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", mode === "reduced");
  }, [mode]);

  const next: MotionMode = mode === "reduced" ? "full" : "reduced";
  const label = mode === "reduced" ? "Motion: off" : "Motion: on";

  const setMode = (m: MotionMode) => {
    try {
      localStorage.setItem(MOTION_KEY, m);
      motionMemory = null;
    } catch {
      motionMemory = m;
    }
    motionNotify();
  };

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      aria-pressed={mode === "reduced" ? "false" : "true"}
      title={
        mode === "reduced"
          ? "Reduced motion is on. Click to enable animations."
          : "Full motion is on. Click to reduce animations."
      }
      className="group inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className={`relative inline-block h-3 w-6 rounded-full border border-border transition-colors ${
          mode === "reduced" ? "bg-transparent" : "bg-accent/60"
        }`}
      >
        <span
          className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-foreground transition-all duration-300 ${
            mode === "reduced" ? "left-0.5" : "left-[calc(100%-0.625rem)]"
          }`}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

/* ---------------- lead ---------------- */

function Lead() {
  return (
    <section id="top" className="border-b border-border">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-12 sm:px-10 sm:py-9 lg:pb-8 lg:pt-9">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-10 xl:gap-14">
          <div>
            <CompanyAttribution className="mb-4" />
            <h1 className="font-serif text-5xl leading-[0.98] tracking-tight text-foreground sm:text-6xl lg:text-[68px] xl:text-[76px]">
              Dub videos into other languages without giving up control
              <span className="text-accent">.</span>
            </h1>
            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground sm:text-lg">
              Trackdub is a desktop workstation for translating, voicing, and mixing video. Every
              stage of the pipeline is inspectable, editable, and rerunnable, from the transcript to
              the final mix. Your media never leaves your machine unless you say so.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4 sm:gap-6">
              <InkButton href="#waitlist">
                Be first to know <span aria-hidden>→</span>
              </InkButton>
              <InkButton href="#pipeline" variant="ghost">
                Explore the workflow <span aria-hidden>→</span>
              </InkButton>
            </div>
          </div>
          <div className="hidden lg:block">
            <WorkstationMock />
          </div>
        </div>
        <HeroPulseRail />
      </div>
    </section>
  );
}

function HeroPulseRail() {
  const tcRef = useRef<HTMLSpanElement | null>(null);

  // Ticking timecode, 24 fps. Direct textContent writes; no React re-renders.
  // Holds still while reduce-motion is active (checked per tick so the header
  // toggle takes effect immediately, no listener bookkeeping).
  useEffect(() => {
    let frame = 14 * 24 + 12; // matches the initial 00:00:14:12
    const iv = window.setInterval(() => {
      if (document.documentElement.classList.contains("reduce-motion")) return;
      frame = (frame + 1) % (60 * 60 * 24);
      const total = Math.floor(frame / 24);
      const mm = String(Math.floor(total / 60)).padStart(2, "0");
      const ss = String(total % 60).padStart(2, "0");
      const ff = String(frame % 24).padStart(2, "0");
      if (tcRef.current) tcRef.current.textContent = `00:${mm}:${ss}:${ff}`;
    }, 1000 / 24);
    return () => window.clearInterval(iv);
  }, []);

  return (
    <div className="my-8 flex items-center gap-4" aria-hidden="true">
      <span ref={tcRef} className="font-mono text-[9px] tracking-[0.14em] tabular-nums text-accent">
        00:00:14:12
      </span>
      <div className="relative min-w-0 flex-1 basis-0 overflow-hidden">
        <svg viewBox="0 0 1000 20" className="h-5 w-full" preserveAspectRatio="none">
          {Array.from({ length: 160 }).map((_, i) => {
            const energy = round3(
              Math.max(1, Math.abs(Math.sin(i * 0.73) * Math.cos(i * 0.19)) * 15),
            );
            return (
              <rect
                key={i}
                x={i * 6.25}
                y={(20 - energy) / 2}
                width="1"
                height={energy}
                fill="currentColor"
                className="text-accent"
                opacity={Math.max(0.16, 1 - i / 190)}
              />
            );
          })}
        </svg>
        <div className="playhead-wrap pointer-events-none absolute inset-0">
          <span className="absolute inset-y-0 left-0 w-px bg-accent/70" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- resumable job ---------------- */

type JobStageId = "ingest" | "transcribe" | "translate" | "diarize" | "voice" | "mix";
type JobStageStatus = "queued" | "running" | "paused" | "done" | "stale" | "failed";

const JOB_STAGES: {
  id: JobStageId;
  n: string;
  label: string;
  sec: number;
  artifact: string;
}[] = [
  { id: "ingest", n: "01", label: "Ingest & probe", sec: 2.0, artifact: "media.probe.json" },
  {
    id: "transcribe",
    n: "02",
    label: "Transcribe (ASR)",
    sec: 6.5,
    artifact: "transcript.de.jsonl",
  },
  { id: "translate", n: "03", label: "Translate", sec: 3.5, artifact: "transcript.en.jsonl" },
  { id: "diarize", n: "04", label: "Diarize", sec: 4.0, artifact: "speakers.rttm" },
  { id: "voice", n: "05", label: "Voice (TTS)", sec: 7.0, artifact: "lines/*.wav" },
  { id: "mix", n: "06", label: "Mix & mux", sec: 3.0, artifact: "interview_en.mp4" },
];

const DOWNSTREAM_OF_TRANSLATE: JobStageId[] = ["translate", "voice", "mix"];

type JobState = {
  status: Record<JobStageId, JobStageStatus>;
  progress: Record<JobStageId, number>;
};

function initialJobState(): JobState {
  return {
    status: {
      ingest: "done",
      transcribe: "done",
      translate: "running",
      diarize: "queued",
      voice: "queued",
      mix: "queued",
    },
    progress: { ingest: 1, transcribe: 1, translate: 0.35, diarize: 0, voice: 0, mix: 0 },
  };
}

type LogEntry = { t: string; msg: string; kind: "info" | "warn" | "ok" };

type FailureKind = "gpu_oom" | "missing_codec" | "partial_ingest";

type FailureInfo = {
  kind: FailureKind;
  stage: JobStageId;
  code: string;
  title: string;
  detail: string;
  recoverLabel: string;
  recoveryNote: string;
  fromCheckpoint: number; // resume progress fraction
  applyRecovery?: () => Partial<Record<JobStageId, JobStageStatus>>;
};

const FAILURES: Record<FailureKind, Omit<FailureInfo, "applyRecovery">> = {
  gpu_oom: {
    kind: "gpu_oom",
    stage: "voice",
    code: "E_GPU_OOM",
    title: "GPU ran out of memory during voice generation",
    detail:
      "The TensorRT RTX engine for the voice model needed 8.4 GB but 6.1 GB were free on the selected device (RTX 4070). Trackdub paused the job at line 63 of 128 and kept every finished line on disk.",
    recoverLabel: "Retry on DirectML at half batch",
    recoveryNote:
      "Switching provider to DirectML (batch 4). Already-rendered lines 1–62 are reused from the checkpoint.",
    fromCheckpoint: 0.49,
  },
  missing_codec: {
    kind: "missing_codec",
    stage: "ingest",
    code: "E_MEDIA_CODEC",
    title: "Ingest could not decode one audio track",
    detail:
      "FFmpeg opened interview_de.mp4 but track #2 uses an EAC3 stream that this build cannot decode. Video and track #1 were probed successfully; the file was not modified.",
    recoverLabel: "Install decoder & rescan",
    recoveryNote:
      "Installed the missing EAC3 decoder. Re-probing the container; video and existing tracks are reused, only the audio scan re-runs.",
    fromCheckpoint: 0.6,
  },
  partial_ingest: {
    kind: "partial_ingest",
    stage: "transcribe",
    code: "E_TRUNCATED_STREAM",
    title: "Source media ended mid-segment",
    detail:
      "The last 3.2s of interview_de.mp4 are missing packets, likely a truncated export. Trackdub transcribed 124 of 128 segments and saved them. Nothing was discarded.",
    recoverLabel: "Continue with 124 saved segments",
    recoveryNote:
      "Accepted partial ingest. Downstream stages will run on the 124 valid segments; the truncated tail is flagged in the transcript for review.",
    fromCheckpoint: 0.97,
  },
};

function ResumableJob() {
  const [job, setJob] = useState<JobState>(initialJobState);
  const [running, setRunning] = useState(true);
  const [failure, setFailure] = useState<FailureInfo | null>(null);
  const [log, setLog] = useState<LogEntry[]>([
    { t: "00:00", msg: "Job queued · interview_de.mp4 → en-US", kind: "info" },
    { t: "00:02", msg: "Ingest complete · media.probe.json", kind: "ok" },
    { t: "00:09", msg: "Transcribe complete · 128 segments", kind: "ok" },
    { t: "00:09", msg: "Translate started · model=nllb-1.3b", kind: "info" },
  ]);
  const clockRef = useRef(9);

  const addLog = (msg: string, kind: LogEntry["kind"] = "info") => {
    const c = clockRef.current;
    const mm = String(Math.floor(c / 60)).padStart(2, "0");
    const ss = String(Math.floor(c % 60)).padStart(2, "0");
    setLog((prev) => [...prev.slice(-40), { t: `${mm}:${ss}`, msg, kind }]);
  };

  useEffect(() => {
    if (!running || failure) return;
    const dt = 0.12;
    const iv = window.setInterval(() => {
      clockRef.current += dt;
      setJob((prev) => {
        const runningStage = JOB_STAGES.find((s) => prev.status[s.id] === "running");
        if (!runningStage) {
          const next = JOB_STAGES.find(
            (s) => prev.status[s.id] === "queued" || prev.status[s.id] === "stale",
          );
          if (!next) return prev;
          const label =
            prev.status[next.id] === "stale"
              ? `${next.label} reprocessing (stale after edit)`
              : `${next.label} started`;
          queueMicrotask(() => addLog(label, "info"));
          return { ...prev, status: { ...prev.status, [next.id]: "running" } };
        }
        const inc = dt / runningStage.sec;
        const cur = prev.progress[runningStage.id] + inc;
        if (cur >= 1) {
          queueMicrotask(() =>
            addLog(`${runningStage.label} complete · ${runningStage.artifact}`, "ok"),
          );
          return {
            status: { ...prev.status, [runningStage.id]: "done" },
            progress: { ...prev.progress, [runningStage.id]: 1 },
          };
        }
        return {
          ...prev,
          progress: { ...prev.progress, [runningStage.id]: cur },
        };
      });
    }, 120);
    return () => window.clearInterval(iv);
  }, [running, failure]);

  const togglePause = () => {
    if (failure) return;
    setRunning((r) => {
      const next = !r;
      setJob((prev) => {
        const s = { ...prev.status };
        if (!next) {
          for (const st of JOB_STAGES) if (s[st.id] === "running") s[st.id] = "paused";
        } else {
          for (const st of JOB_STAGES) if (s[st.id] === "paused") s[st.id] = "running";
        }
        return { ...prev, status: s };
      });
      addLog(
        next ? "Resume · continuing from last checkpoint" : "Pause · state persisted to disk",
        "warn",
      );
      return next;
    });
  };

  const editTranslation = () => {
    setJob((prev) => {
      const s = { ...prev.status };
      const p = { ...prev.progress };
      for (const id of DOWNSTREAM_OF_TRANSLATE) {
        s[id] = "stale";
        p[id] = 0;
      }
      // Force the pipeline to re-enter translate on next tick.
      // Any stage after translate that was 'running' is now 'stale' (above),
      // and the tick loop will pick the first non-done stage.
      return { status: s, progress: p };
    });
    addLog("Edit · line 42 target text changed by user", "warn");
    addLog("Stale · translate, voice, mix marked for reprocess", "warn");
    // Prior stages (ingest, transcribe, diarize) remain done — not recomputed.
  };

  const injectFailure = (kind: FailureKind) => {
    const info = FAILURES[kind];
    setJob((prev) => {
      const s: JobState["status"] = { ...prev.status };
      const p: JobState["progress"] = { ...prev.progress };
      // Mark stages before the failing one as done; failing stage as failed.
      let hit = false;
      for (const st of JOB_STAGES) {
        if (st.id === info.stage) {
          hit = true;
          s[st.id] = "failed";
          p[st.id] = info.fromCheckpoint;
          continue;
        }
        if (!hit) {
          s[st.id] = "done";
          p[st.id] = 1;
        } else {
          s[st.id] = "queued";
          p[st.id] = 0;
        }
      }
      return { status: s, progress: p };
    });
    setRunning(false);
    setFailure(info);
    addLog(`FAIL · ${info.code} · ${info.title.toLowerCase()}`, "warn");
    addLog(
      `Paused · checkpoint saved at ${info.stage} ${(info.fromCheckpoint * 100).toFixed(0)}%`,
      "warn",
    );
  };

  const recover = () => {
    if (!failure) return;
    const info = failure;
    addLog(`Recovery · ${info.recoveryNote}`, "info");
    setJob((prev) => {
      const s = { ...prev.status };
      s[info.stage] = "running";
      return { ...prev, status: s };
    });
    setFailure(null);
    setRunning(true);
  };

  const reset = () => {
    clockRef.current = 9;
    setJob(initialJobState());
    setRunning(true);
    setFailure(null);
    setLog([
      { t: "00:00", msg: "Job queued · interview_de.mp4 → en-US", kind: "info" },
      { t: "00:02", msg: "Ingest complete · media.probe.json", kind: "ok" },
      { t: "00:09", msg: "Transcribe complete · 128 segments", kind: "ok" },
      { t: "00:09", msg: "Translate resumed · model=nllb-1.3b", kind: "info" },
    ]);
  };

  const allDone = JOB_STAGES.every((s) => job.status[s.id] === "done");

  return (
    <section id="resume" data-reveal className="reveal border-b border-border bg-background">
      <Container className="py-20 sm:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow={<SectionNumber n="02b" label="Resumable jobs" />}
              title="Pause anything. Edit one stage. Resume only what changed."
              lead="Every stage writes a checkpoint to disk. Close the app, unplug the laptop, edit a translation two days later, and the job picks up from the last completed artifact."
              h2ClassName="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl"
              leadClassName="mt-6 text-[17px] leading-relaxed text-muted-foreground"
            />
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              When you change a translated line, Trackdub marks that stage and everything downstream
              as <em>stale</em> and requeues only those. Ingest, transcription, and diarization stay
              done; they don't depend on the edit.
            </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Try it → pause · edit translation · resume
            </p>
          </div>

          <div className="lg:col-span-8">
            <div
              className="not-prose rounded-none border p-5 sm:p-6"
              style={{ background: PANEL, borderColor: LINE }}
            >
              {/* header row */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: DIM }}
                >
                  Job · interview_de.mp4 → en-US &nbsp;·&nbsp; checkpoint dir:
                  /projects/interview/.trackdub
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={togglePause}
                    disabled={allDone || !!failure}
                    className="inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors disabled:opacity-40"
                    style={{
                      color: INK,
                      borderColor: running ? ACC : LINE,
                      background: running ? "transparent" : PANEL_HI,
                    }}
                    aria-label={running ? "Pause job" : "Resume job"}
                  >
                    {running ? "❚❚ Pause" : "▶ Resume"}
                  </button>
                  <button
                    type="button"
                    onClick={editTranslation}
                    disabled={!!failure}
                    className="inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors"
                    style={{ color: INK, borderColor: LINE, background: PANEL_HI }}
                  >
                    ✎ Edit line 42
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors"
                    style={{ color: DIM, borderColor: LINE }}
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>

              {/* failure simulator */}
              <div
                className="mb-5 flex flex-wrap items-center gap-2 border-t border-b py-3"
                style={{ borderColor: LINE }}
              >
                <span
                  className="mr-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: DIM }}
                >
                  Simulate failure
                </span>
                {(
                  [
                    ["gpu_oom", "GPU OOM"],
                    ["missing_codec", "Missing codec"],
                    ["partial_ingest", "Partial ingest"],
                  ] as [FailureKind, string][]
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => injectFailure(k)}
                    className="inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors hover:border-accent"
                    style={{ color: INK, borderColor: LINE, background: "transparent" }}
                  >
                    ⚠ {label}
                  </button>
                ))}
              </div>

              {failure && (
                <div
                  role="alert"
                  className="mb-5 border p-4"
                  style={{
                    borderColor: "oklch(0.55 0.14 30)",
                    background: "oklch(0.20 0.04 30 / 0.35)",
                  }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.14em]"
                        style={{ color: "oklch(0.78 0.15 258)" }}
                      >
                        {failure.code}
                      </span>
                      <span className="font-serif text-[17px]" style={{ color: INK }}>
                        {failure.title}
                      </span>
                    </div>
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: DIM }}
                    >
                      Stage · {failure.stage} · paused, checkpoint saved
                    </span>
                  </div>
                  <p
                    className="mt-3 text-[13px] leading-relaxed"
                    style={{ color: "oklch(0.82 0.02 245)" }}
                  >
                    {failure.detail}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={recover}
                      className="inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em]"
                      style={{ color: INK, borderColor: ACC, background: PANEL_HI }}
                    >
                      ✓ {failure.recoverLabel}
                    </button>
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: DIM }}
                    >
                      or reset · nothing on disk was destroyed
                    </span>
                  </div>
                </div>
              )}

              {/* stage rows */}
              <ol className="divide-y" style={{ borderColor: LINE }}>
                {JOB_STAGES.map((s) => {
                  const status = job.status[s.id];
                  const pct = Math.round(job.progress[s.id] * 100);
                  return (
                    <li
                      key={s.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-t py-3 first:border-t-0"
                      style={{ borderColor: LINE }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: statusColor(status) }}
                          aria-hidden
                        />
                        <span
                          className="font-mono text-[11px] uppercase tracking-[0.14em]"
                          style={{ color: DIM }}
                        >
                          {s.n}
                        </span>
                        <span className="text-[14px]" style={{ color: INK }}>
                          {s.label}
                        </span>
                      </div>
                      <div
                        className="relative h-[6px] w-full overflow-hidden"
                        style={{ background: "oklch(0.22 0.012 250)" }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${s.label} progress`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 transition-[width] duration-100"
                          style={{
                            width: `${pct}%`,
                            background: statusColor(status),
                            opacity: status === "stale" ? 0.25 : 1,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-3 justify-self-end">
                        <span
                          className="font-mono text-[10px] uppercase tracking-[0.14em] tabular-nums"
                          style={{ color: DIM }}
                        >
                          {statusLabel(status, pct)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* log */}
              <div className="mt-6 border-t pt-4" style={{ borderColor: LINE }}>
                <div
                  className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: DIM }}
                >
                  Job log · streaming
                </div>
                <div
                  className="max-h-40 overflow-y-auto font-mono text-[12px] leading-relaxed"
                  aria-live="polite"
                >
                  {log.slice(-8).map((l, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="tabular-nums" style={{ color: DIM }}>
                        {l.t}
                      </span>
                      <span
                        style={{
                          color: l.kind === "ok" ? INK : l.kind === "warn" ? ACC : DIM,
                        }}
                      >
                        {l.msg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Fig. 02b &nbsp;·&nbsp; Simulated job runner with failure injection. Progress, errors,
              and log are client-side only.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function statusColor(s: JobStageStatus): string {
  switch (s) {
    case "done":
      return "oklch(0.72 0.10 155)";
    case "running":
      return ACC;
    case "paused":
      return "oklch(0.70 0.02 245)";
    case "stale":
      return ACC;
    case "failed":
      return "oklch(0.68 0.16 30)";
    case "queued":
    default:
      return "oklch(0.38 0.014 250)";
  }
}

function statusLabel(s: JobStageStatus, pct: number): string {
  switch (s) {
    case "done":
      return "done";
    case "running":
      return `${pct}%`;
    case "paused":
      return `paused · ${pct}%`;
    case "stale":
      return "stale · requeued";
    case "failed":
      return `failed · ${pct}%`;
    case "queued":
    default:
      return "queued";
  }
}

/* ---------------- product plate (single figure) ---------------- */

function ProductPlate() {
  return (
    <section className="border-b border-border">
      <Container className="py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div>
            <SectionNumber n="01a" label="The workstation" />
            <p className="max-w-sm text-[16px] leading-relaxed text-muted-foreground">
              The interface is being built around the pipeline itself: source media, editable
              stages, and the exact state of every run in one place.
            </p>
          </div>
          <div>
            <figure className="overflow-hidden border border-border">
              <img
                src="/screenshots/app-shell-early-build.png"
                alt="Trackdub desktop dubbing workstation with pipeline controls, video preview, translated segments, and per-line playback controls"
                className="w-full"
                loading="lazy"
                width={1920}
                height={1050}
              />
            </figure>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Fig. 02 &nbsp;·&nbsp; Actual desktop shell, early build. Pre-release UI; chrome and
              copy are still moving.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function WorkstationMock() {
  const bg = "oklch(0.16 0.010 250)";
  const panel = "oklch(0.20 0.012 250)";
  const inkText = "oklch(0.92 0.005 240)";
  const dim = "oklch(0.62 0.02 245)";
  return (
    <figure
      className="overflow-hidden border border-border shadow-panel"
      style={{ backgroundColor: bg, color: inkText }}
    >
      {/* titlebar */}
      <div
        className="flex items-center justify-between border-b px-4 py-2 font-mono text-[11px]"
        style={{ borderColor: "oklch(0.28 0.014 250)", backgroundColor: panel, color: dim }}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.55 0.02 250)" }} />
            <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.55 0.02 250)" }} />
            <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.55 0.02 250)" }} />
          </span>
          <span>Project &nbsp; Kyoto Doc</span>
        </div>
        <div className="flex items-center gap-5">
          <span>ja → en &nbsp;·&nbsp; 24 fps</span>
          <span>Autosave 10:42:11 &nbsp;●</span>
        </div>
      </div>

      <div className="grid grid-cols-12">
        {/* left: stages */}
        <div className="col-span-3 border-r p-4" style={{ borderColor: "oklch(0.28 0.014 250)" }}>
          <div
            className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: dim }}
          >
            Run
          </div>
          <ol className="space-y-1.5">
            {[
              ["01", "Ingest", "done"],
              ["02", "Transcribe", "done"],
              ["03", "Translate", "done"],
              ["04", "Diarize", "active"],
              ["05", "Voice", "queued"],
              ["06", "Mix", "queued"],
            ].map(([n, name, s]) => (
              <li
                key={n}
                className="flex items-center gap-3 py-1 font-mono text-[12px]"
                style={{ color: s === "queued" ? dim : inkText }}
              >
                <span style={{ color: dim }}>{n}</span>
                <span className="flex-1">{name}</span>
                <span
                  style={{
                    color:
                      s === "done"
                        ? "oklch(0.75 0.13 155)"
                        : s === "active"
                          ? "oklch(0.68 0.15 258)"
                          : dim,
                  }}
                >
                  {s === "done" ? "✓" : s === "active" ? "●" : "·"}
                </span>
              </li>
            ))}
          </ol>
          <div
            className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: dim }}
          >
            Provider
          </div>
          <div className="mt-2 font-mono text-[12px]">DirectML · RTX 4070</div>
          <div
            className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: dim }}
          >
            Manifest
          </div>
          <div className="mt-2 font-mono text-[12px]">bundled · commercial</div>
        </div>

        {/* center: script */}
        <div className="col-span-6 border-r p-5" style={{ borderColor: "oklch(0.28 0.014 250)" }}>
          <div className="mb-3 flex items-center justify-between">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: dim }}
            >
              Script · line 42
            </div>
            <div className="font-mono text-[10px]" style={{ color: dim }}>
              S1 Anna · 00:42.180
            </div>
          </div>
          <div className="space-y-2">
            {[
              {
                t: "00:34",
                s: "S2",
                de: "京都の朝は静かに始まる。",
                en: "Kyoto wakes quietly.",
                a: false,
              },
              {
                t: "00:38",
                s: "S1",
                de: "Wir haben die Pipeline neu gebaut,",
                en: "We rebuilt the pipeline,",
                a: false,
              },
              {
                t: "00:42",
                s: "S1",
                de: "damit jede Stufe editierbar bleibt.",
                en: "so every stage stays editable.",
                a: true,
              },
              {
                t: "00:46",
                s: "S2",
                de: "Und wenn etwas nicht stimmt …",
                en: "And if something is off …",
                a: false,
              },
              {
                t: "00:49",
                s: "S2",
                de: "regenerierst du nur diese eine Zeile.",
                en: "you regenerate just that one line.",
                a: false,
              },
            ].map((r) => (
              <div key={r.t} className="grid grid-cols-[52px_28px_1fr] gap-3 py-1">
                <span className="font-mono text-[11px]" style={{ color: dim }}>
                  {r.t}
                </span>
                <span
                  className="font-mono text-[10px]"
                  style={{ color: r.s === "S1" ? "oklch(0.68 0.15 258)" : "oklch(0.70 0.12 190)" }}
                >
                  {r.s}
                </span>
                <div>
                  <div className="text-[12px]" style={{ color: dim }}>
                    {r.de}
                  </div>
                  <div
                    className="font-serif text-[16px] leading-snug"
                    style={{
                      color: r.a ? "oklch(0.97 0.005 240)" : inkText,
                      textDecoration: r.a ? "underline" : "none",
                      textDecorationColor: "oklch(0.68 0.15 258)",
                      textUnderlineOffset: 4,
                    }}
                  >
                    {r.en}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* waveform */}
          <div className="mt-4">
            <div
              className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: dim }}
            >
              <span>Waveform</span>
              <span>−14.1 LUFS</span>
            </div>
            <svg viewBox="0 0 600 60" className="h-14 w-full" preserveAspectRatio="none">
              {Array.from({ length: 120 }).map((_, i) => {
                const seed = Math.sin(i * 1.37) * Math.cos(i * 0.51);
                const h = round3(8 + Math.abs(seed) * 42);
                const isActive = i > 44 && i < 78;
                return (
                  <rect
                    key={i}
                    x={i * 5}
                    y={30 - h / 2}
                    width={2.2}
                    height={h}
                    fill={isActive ? "oklch(0.72 0.15 258)" : "oklch(0.55 0.03 240)"}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* right: active stage and line metadata */}
        <div className="col-span-3 p-4">
          <div
            className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: dim }}
          >
            Stage
          </div>
          {[
            ["Ingest", "Done", "oklch(0.75 0.13 155)"],
            ["Transcribe", "Done", "oklch(0.75 0.13 155)"],
            ["Translate", "Done", "oklch(0.75 0.13 155)"],
            ["Voice", "In progress", "oklch(0.74 0.17 62)"],
            ["Align", "Pending", dim],
            ["Mix", "Pending", dim],
            ["Export", "Pending", dim],
          ].map(([name, status, color]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-3 py-1.5 font-mono text-[10px]"
            >
              <span className="flex items-center gap-2" style={{ color: inkText }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                {name}
              </span>
              <span style={{ color }}>{status}</span>
            </div>
          ))}
          <div
            className="mt-5 border-t pt-4 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ borderColor: "oklch(0.28 0.014 250)", color: dim }}
          >
            Line 004
          </div>
          <dl className="mt-3 space-y-2 font-mono text-[10px]">
            {[
              ["Speaker", "Anna"],
              ["Start", "00:00:42.18"],
              ["Duration", "00:00:03.20"],
              ["Status", "Voiced"],
              ["Voice", "Anna (EN)"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt style={{ color: dim }}>{k}</dt>
                <dd style={{ color: k === "Voice" ? "oklch(0.74 0.17 62)" : inkText }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-t px-4 py-3" style={{ borderColor: "oklch(0.28 0.014 250)" }}>
        <div
          className="mb-2 grid grid-cols-[80px_1fr] gap-3 font-mono text-[9px]"
          style={{ color: dim }}
        >
          <span>00:00:00</span>
          <div className="flex justify-between">
            <span>00:00:05</span>
            <span>00:00:10</span>
            <span>00:00:15</span>
            <span>00:00:20</span>
            <span>00:00:25</span>
          </div>
        </div>
        {["Source ref", "Dialogue", "Music bed", "SFX"].map((track, trackIndex) => (
          <div
            key={track}
            className="grid grid-cols-[80px_1fr] items-center gap-3 border-t py-1.5"
            style={{ borderColor: "oklch(0.25 0.014 250)" }}
          >
            <span
              className="font-mono text-[9px]"
              style={{ color: trackIndex === 1 ? "oklch(0.74 0.17 62)" : dim }}
            >
              {track}
            </span>
            <svg viewBox="0 0 600 18" className="h-4 w-full" preserveAspectRatio="none">
              {Array.from({ length: 100 }).map((_, i) => {
                const signal = round3(
                  2 +
                    Math.abs(Math.sin((i + trackIndex * 5) * 0.83) * Math.cos(i * 0.17)) *
                      (trackIndex === 1 ? 14 : 9),
                );
                return (
                  <rect
                    key={i}
                    x={i * 6}
                    y={(18 - signal) / 2}
                    width="2.4"
                    height={signal}
                    fill={trackIndex === 1 ? "oklch(0.72 0.15 50)" : "oklch(0.48 0.02 245)"}
                  />
                );
              })}
              {trackIndex === 1 && (
                <line
                  x1="280"
                  x2="280"
                  y1="0"
                  y2="18"
                  stroke="oklch(0.78 0.17 62)"
                  strokeWidth="1"
                />
              )}
            </svg>
          </div>
        ))}
      </div>
    </figure>
  );
}

/* ---------------- trust strip ---------------- */

function TrustStrip() {
  const items = [
    "Local by default",
    "Deterministic runs",
    "Cross-platform",
    "Open manifest",
    "No account required",
    "Per-line regen",
    "Resumable jobs",
    "CPU fallback, always",
    "Your disk, your files",
  ];
  return (
    <section data-reveal className="reveal border-b border-border bg-surface">
      <p className="sr-only">{items.join(". ")}.</p>
      <div className="ticker-mask overflow-hidden py-5" aria-hidden>
        <div className="ticker-track flex w-max items-center">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex items-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              {items.map((t) => (
                <span key={t} className="flex items-center whitespace-nowrap">
                  <span className="px-6">{t}</span>
                  <span className="text-accent">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- pipeline feature ---------------- */

const STAGES = [
  {
    n: "01",
    name: "Ingest",
    one: "Probe media. Detect scenes, silence, and speech.",
    body: "Point Trackdub at a file or folder. It reads the container, extracts audio, detects shot boundaries, and runs voice activity, building the frame every later stage will work against.",
    detail: ["ffprobe media", "shot / silence detection", "loudness reference (LUFS)"],
  },
  {
    n: "02",
    name: "Transcribe",
    one: "Time-accurate source transcript with speaker turns.",
    body: "Source-language ASR with word-level timestamps. The transcript is a real editable document, not an opaque intermediate. Fix a word here and every downstream stage picks it up.",
    detail: ["word timestamps", "editable transcript", "diarization-ready turns"],
  },
  {
    n: "03",
    name: "Translate",
    one: "Human-editable target script, tied to timecode.",
    body: "Translation happens per line, not per file. Idioms, names, and jargon go in a project glossary; the target script preserves the source's timing so later stages can align to it.",
    detail: ["per-line MT", "project glossary", "timecode preserved"],
  },
  {
    n: "04",
    name: "Diarize",
    one: "Assign speakers. Attach a voice reference to each one.",
    body: "Trackdub clusters voices, then lets you name them, merge them, or split them. Each speaker gets a short reference clip that the voicing stage will match: one clone per person, not one voice for the whole video.",
    detail: ["speaker clustering", "manual merge / split", "voice reference per speaker"],
  },
  {
    n: "05",
    name: "Voice",
    one: "Zero-shot TTS. Regenerate any single line.",
    body: "Per-speaker voice cloning generates each line at its target duration. Prosody is editable (pace, emphasis, pause), and any line can be regenerated on its own without redoing the rest.",
    detail: ["per-speaker cloning", "per-line prosody", "regen line 42 in isolation"],
  },
  {
    n: "06",
    name: "Mix",
    one: "Align, duck under music, mux the final file.",
    body: "Dubbed lines snap to the original beats. Music and SFX from the source are preserved and ducked under dialogue. Export a muxed video, stems, or captions, deterministic given the same project manifest.",
    detail: ["timeline alignment", "music / SFX ducking", "video + stems + captions"],
  },
];

function PipelineFeature() {
  const facts = [
    ["Platforms", "Windows · macOS · Linux"],
    ["Acceleration", "TensorRT RTX · CUDA · DirectML · CoreML · MIGraphX · OpenVINO · QNN · CPU"],
    ["Data", "Local by default · cloud providers opt in per stage"],
  ];

  return (
    <section id="pipeline" data-reveal className="reveal border-b border-border">
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-10">
        <div className="grid border-b border-border lg:grid-cols-[220px_320px_1fr]">
          <div className="flex items-center border-b border-border py-8 lg:border-b-0 lg:border-r lg:py-10">
            <span className="font-serif text-[112px] leading-[0.75] tracking-[-0.06em] text-[var(--burgundy)] sm:text-[150px]">
              01
            </span>
          </div>
          <div className="border-b border-border py-8 lg:border-b-0 lg:border-r lg:px-9 lg:py-10">
            <HeroPulseRail />
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rust)]">
              The pipeline
            </div>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted-foreground">
              A clear, inspectable path from source media to final mix. Nothing is hidden.
            </p>
          </div>
          <div className="flex items-center py-8 lg:px-12 lg:py-10">
            <div>
              <h2 className="font-serif text-4xl leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Built for control at every stage.
              </h2>
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
                Review every line. Tweak every take. Rerun only what changed. You are always in
                control.
              </p>
            </div>
          </div>
        </div>

        <dl className="grid border-b border-border md:grid-cols-[1fr_2fr_1fr]">
          {facts.map(([k, v], index) => (
            <div
              key={k}
              className={`flex min-h-24 flex-col items-center justify-center gap-2 px-5 py-5 text-center font-mono text-[11px] ${
                index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""
              }`}
            >
              <dt className="uppercase tracking-[0.16em] text-muted-foreground">{k}</dt>
              <dd className="max-w-xl leading-relaxed text-foreground">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-14 py-20 lg:grid-cols-12 lg:gap-16 sm:py-24">
          <div className="lg:col-span-5">
            <h3 className="font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              Six stages. Each one editable, each one rerunnable.
            </h3>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted-foreground">
              A dubbed video is not a single button. It's a chain of decisions: what someone said,
              what it should say in the target language, whose voice says it, and how it sits in the
              mix. Trackdub exposes that chain, so you can inspect any link and change it in place.
            </p>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted-foreground">
              Every stage declares what it needs from the previous one. If you edit the transcript,
              the translation knows to invalidate. If you change a speaker's voice reference, only
              their lines regenerate. Nothing rebuilds that doesn't have to.
            </p>
          </div>
          <ol className="lg:col-span-7">
            {STAGES.map((s, i) => (
              <li key={s.n}>
                {i > 0 && <Rule />}
                <a
                  href={`#stage-${s.n}`}
                  className="group grid grid-cols-[64px_1fr_auto] items-baseline gap-4 py-6 transition-colors hover:bg-surface/60"
                >
                  <span className="font-mono text-[13px] text-accent">{s.n}</span>
                  <div>
                    <div className="font-serif text-2xl text-foreground">{s.name}</div>
                    <div className="mt-1 font-mono text-[12px] text-muted-foreground">{s.one}</div>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground group-hover:text-accent">
                    Read →
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------------- stage chapters ---------------- */

/* ---------------- interactive walkthrough ---------------- */

type Speaker = { id: string; name: string; color: string; turns: number };
type Line = {
  id: number;
  t: string;
  speakerId: string;
  source: string;
  target: string;
  pace: number;
  pause: number;
  duration: number;
};

const INITIAL_SPEAKERS: Speaker[] = [
  { id: "s1", name: "Anna", color: "oklch(0.68 0.15 258)", turns: 24 },
  { id: "s2", name: "Mateo", color: "oklch(0.70 0.12 190)", turns: 18 },
  { id: "s3", name: "Speaker 3", color: "oklch(0.55 0.03 240)", turns: 2 },
];

const INITIAL_LINES: Line[] = [
  {
    id: 41,
    t: "00:38.120",
    speakerId: "s1",
    source: "Wir haben die Pipeline neu gebaut,",
    target: "We rebuilt the pipeline",
    pace: 1.0,
    pause: 200,
    duration: 2.86,
  },
  {
    id: 42,
    t: "00:42.180",
    speakerId: "s1",
    source: "damit jede Stufe editierbar bleibt.",
    target: "so every stage stays editable.",
    pace: 1.0,
    pause: 200,
    duration: 3.14,
  },
  {
    id: 43,
    t: "00:46.900",
    speakerId: "s2",
    source: "Und wenn etwas nicht stimmt …",
    target: "And if something's off …",
    pace: 1.0,
    pause: 220,
    duration: 2.1,
  },
  {
    id: 44,
    t: "00:49.640",
    speakerId: "s2",
    source: "änderst du nur die eine Zeile.",
    target: "you only change that one line.",
    pace: 1.0,
    pause: 240,
    duration: 2.55,
  },
];

const STAGE_TABS = [
  { id: "ingest", n: "01", label: "Ingest" },
  { id: "transcribe", n: "02", label: "Transcribe" },
  { id: "translate", n: "03", label: "Translate" },
  { id: "diarize", n: "04", label: "Diarize" },
  { id: "voice", n: "05", label: "Voice" },
] as const;
type StageId = (typeof STAGE_TABS)[number]["id"];

const DIM = "oklch(0.62 0.02 245)";
const INK = "oklch(0.94 0.005 240)";
const LINE = "oklch(0.28 0.014 250)";
const ACC = "oklch(0.72 0.15 258)";
const PANEL = "oklch(0.16 0.010 250)";
const PANEL_HI = "oklch(0.20 0.012 250)";

function Walkthrough() {
  const [stage, setStage] = useState<StageId>("transcribe");
  const [speakers, setSpeakers] = useState<Speaker[]>(INITIAL_SPEAKERS);
  const [lines, setLines] = useState<Line[]>(INITIAL_LINES);
  const [stale, setStale] = useState<Record<number, Partial<Record<StageId, boolean>>>>({});
  const [regenId, setRegenId] = useState<number | null>(null);

  const markStale = (lineId: number, downstream: StageId[]) => {
    setStale((prev) => {
      const cur = { ...(prev[lineId] ?? {}) };
      downstream.forEach((s) => (cur[s] = true));
      return { ...prev, [lineId]: cur };
    });
  };
  const clearStale = (lineId: number, s: StageId) => {
    setStale((prev) => {
      const cur = { ...(prev[lineId] ?? {}) };
      delete cur[s];
      return { ...prev, [lineId]: cur };
    });
  };

  const editSource = (id: number, source: string) => {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, source } : l)));
    markStale(id, ["translate", "voice"]);
  };
  const editTarget = (id: number, target: string) => {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, target } : l)));
    markStale(id, ["voice"]);
    clearStale(id, "translate");
  };
  const reassignSpeaker = (id: number, speakerId: string) => {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, speakerId } : l)));
    markStale(id, ["voice"]);
  };
  const renameSpeaker = (sid: string, name: string) => {
    setSpeakers((ss) => ss.map((s) => (s.id === sid ? { ...s, name } : s)));
  };
  const regenerate = (id: number) => {
    setRegenId(id);
    window.setTimeout(() => {
      setLines((ls) =>
        ls.map((l) =>
          l.id === id ? { ...l, pace: Math.round((0.9 + Math.random() * 0.12) * 100) / 100 } : l,
        ),
      );
      clearStale(id, "voice");
      setRegenId(null);
    }, 900);
  };

  const staleCount = (s: StageId) => Object.values(stale).reduce((n, m) => n + (m?.[s] ? 1 : 0), 0);

  return (
    <section id="walkthrough" data-reveal className="reveal border-b border-border bg-surface">
      <Container className="py-20 sm:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow={<SectionNumber n="02" label="Try the pipeline" />}
              title="Edit a line. Watch what invalidates."
              lead="A sample project, running in your browser. Change the transcript, retarget a translation, rename a speaker, or regenerate a single voice line. Downstream stages mark themselves stale; nothing else is touched."
              h2ClassName="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl"
              leadClassName="mt-6 text-[17px] leading-relaxed text-muted-foreground"
            />
            <ul className="mt-8 space-y-2 font-mono text-[12px] text-muted-foreground">
              {STAGE_TABS.map((s) => {
                const c = staleCount(s.id);
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border-b border-hairline py-2"
                  >
                    <span>
                      <span className="text-accent">{s.n}</span> &nbsp; {s.label}
                    </span>
                    <span className={c > 0 ? "text-accent" : "text-muted-foreground/60"}>
                      {c > 0 ? `${c} stale` : "clean"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:col-span-8">
            <div className="border border-border shadow-panel" style={{ background: PANEL }}>
              <div
                role="tablist"
                aria-label="Pipeline stage"
                className="flex flex-wrap border-b"
                style={{ borderColor: LINE }}
              >
                {STAGE_TABS.map((s) => {
                  const active = stage === s.id;
                  const c = staleCount(s.id);
                  return (
                    <button
                      key={s.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStage(s.id)}
                      className="relative flex items-baseline gap-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors"
                      style={{
                        color: active ? INK : DIM,
                        background: active ? PANEL_HI : "transparent",
                        borderRight: `1px solid ${LINE}`,
                      }}
                    >
                      <span style={{ color: ACC }}>{s.n}</span>
                      <span>{s.label}</span>
                      {c > 0 && (
                        <span
                          aria-label={`${c} stale`}
                          className="ml-1 inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: ACC }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="min-h-[380px] p-5">
                {stage === "ingest" && <IngestPane />}
                {stage === "transcribe" && (
                  <TranscribePane
                    lines={lines}
                    speakers={speakers}
                    stale={stale}
                    onEdit={editSource}
                  />
                )}
                {stage === "translate" && (
                  <TranslatePane lines={lines} stale={stale} onEdit={editTarget} />
                )}
                {stage === "diarize" && (
                  <DiarizePane
                    lines={lines}
                    speakers={speakers}
                    onRename={renameSpeaker}
                    onReassign={reassignSpeaker}
                  />
                )}
                {stage === "voice" && (
                  <VoicePane
                    lines={lines}
                    speakers={speakers}
                    stale={stale}
                    regenId={regenId}
                    onRegen={regenerate}
                  />
                )}
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Fig. 02 &nbsp;·&nbsp; Interactive sample &nbsp;·&nbsp; runs in this page, nothing
              uploaded
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PaneHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: DIM }}>
      {children}
    </div>
  );
}

function StaleTag({ label = "stale" }: { label?: string }) {
  return (
    <span
      className="ml-2 inline-block px-1.5 py-0.5 align-middle font-mono text-[9px] uppercase tracking-[0.14em]"
      style={{ color: ACC, border: `1px solid ${ACC}` }}
    >
      {label}
    </span>
  );
}

function IngestPane() {
  return (
    <div className="font-mono text-[12px]" style={{ color: DIM }}>
      <PaneHeader>Media probe · interview_de.mp4</PaneHeader>
      <table className="w-full">
        <tbody>
          {[
            ["container", "mp4 / h264 / aac"],
            ["duration", "00:03:18.240"],
            ["fps", "23.976"],
            ["audio", "stereo · 48 kHz"],
            ["scenes", "42 detected"],
            ["speech", "84% (VAD)"],
            ["loudness", "−14.1 LUFS"],
          ].map(([k, v]) => (
            <tr key={k}>
              <td className="border-b py-1.5 pr-6" style={{ borderColor: LINE }}>
                {k}
              </td>
              <td className="border-b py-1.5 text-right" style={{ borderColor: LINE, color: INK }}>
                {v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-[11px]">
        Nothing to edit here, but every later stage inherits this frame. Change the media, and the
        whole project reprobes.
      </div>
    </div>
  );
}

function EditableSpan({
  value,
  onCommit,
  ariaLabel,
  serif = false,
}: {
  value: string;
  onCommit: (v: string) => void;
  ariaLabel: string;
  serif?: boolean;
}) {
  return (
    <span
      role="textbox"
      aria-label={ariaLabel}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => {
        const v = e.currentTarget.textContent ?? "";
        if (v !== value) onCommit(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLSpanElement).blur();
        }
      }}
      className={`rounded-sm px-1 outline-none focus:ring-1 ${serif ? "font-serif text-[15px]" : ""}`}
      style={{ background: PANEL_HI, boxShadow: `inset 0 -1px 0 ${LINE}` }}
    >
      {value}
    </span>
  );
}

function TranscribePane({
  lines,
  speakers,
  stale,
  onEdit,
}: {
  lines: Line[];
  speakers: Speaker[];
  stale: Record<number, Partial<Record<StageId, boolean>>>;
  onEdit: (id: number, source: string) => void;
}) {
  const spk = (id: string) => speakers.find((s) => s.id === id);
  return (
    <div style={{ color: INK }}>
      <PaneHeader>Source transcript · de-DE · click a line to edit</PaneHeader>
      <div className="space-y-1">
        {lines.map((l) => {
          const s = spk(l.speakerId);
          const isStale = !!(stale[l.id]?.translate || stale[l.id]?.voice);
          return (
            <div
              key={l.id}
              className="grid grid-cols-[80px_110px_1fr] items-center gap-3 py-1.5 text-[13px]"
            >
              <span className="font-mono text-[11px]" style={{ color: DIM }}>
                {l.t}
              </span>
              <span
                className="flex items-center gap-2 font-mono text-[11px]"
                style={{ color: DIM }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s?.color }} />
                {s?.name}
              </span>
              <span>
                <EditableSpan
                  value={l.source}
                  onCommit={(v) => onEdit(l.id, v)}
                  ariaLabel={`Edit source line ${l.id}`}
                />
                {isStale && <StaleTag label="downstream" />}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-[11px]" style={{ color: DIM }}>
        Tip: change a word, then switch to Translate; that line will be marked stale, the rest stay.
      </div>
    </div>
  );
}

function TranslatePane({
  lines,
  stale,
  onEdit,
}: {
  lines: Line[];
  stale: Record<number, Partial<Record<StageId, boolean>>>;
  onEdit: (id: number, target: string) => void;
}) {
  return (
    <div style={{ color: INK }}>
      <PaneHeader>Source · de-DE &nbsp;→&nbsp; Target · en-US</PaneHeader>
      <div
        className="grid grid-cols-[80px_1fr_1fr] gap-3 border-b pb-2 font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ borderColor: LINE, color: DIM }}
      >
        <span>time</span>
        <span>source</span>
        <span>target</span>
      </div>
      {lines.map((l) => {
        const staleT = !!stale[l.id]?.translate;
        return (
          <div
            key={l.id}
            className="grid grid-cols-[80px_1fr_1fr] items-start gap-3 border-b py-2 text-[13px]"
            style={{ borderColor: LINE }}
          >
            <span className="font-mono text-[11px]" style={{ color: DIM }}>
              {l.t}
            </span>
            <span style={{ color: DIM }}>
              {l.source}
              {staleT && <StaleTag label="source changed" />}
            </span>
            <span>
              <EditableSpan
                value={l.target}
                onCommit={(v) => onEdit(l.id, v)}
                ariaLabel={`Edit target line ${l.id}`}
                serif
              />
            </span>
          </div>
        );
      })}
      <div
        className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color: DIM }}
      >
        Glossary · 12 terms locked
      </div>
    </div>
  );
}

function DiarizePane({
  lines,
  speakers,
  onRename,
  onReassign,
}: {
  lines: Line[];
  speakers: Speaker[];
  onRename: (id: string, name: string) => void;
  onReassign: (lineId: number, speakerId: string) => void;
}) {
  const count = (sid: string) => lines.filter((l) => l.speakerId === sid).length;
  return (
    <div style={{ color: INK }}>
      <PaneHeader>Speakers · rename inline</PaneHeader>
      <div className="mb-5 space-y-2">
        {speakers.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border-b py-2"
            style={{ borderColor: LINE }}
          >
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-full" style={{ background: s.color }} />
              <EditableSpan
                value={s.name}
                onCommit={(v) => onRename(s.id, v || s.name)}
                ariaLabel={`Rename ${s.name}`}
              />
              <span className="font-mono text-[10px]" style={{ color: DIM }}>
                {count(s.id)} lines in sample · 4.2s reference
              </span>
            </div>
          </div>
        ))}
      </div>
      <PaneHeader>Reassign a line</PaneHeader>
      <div className="space-y-1 text-[13px]">
        {lines.map((l) => (
          <div key={l.id} className="grid grid-cols-[80px_1fr_160px] items-center gap-3 py-1.5">
            <span className="font-mono text-[11px]" style={{ color: DIM }}>
              {l.t}
            </span>
            <span style={{ color: DIM }} className="truncate">
              {l.source}
            </span>
            <select
              value={l.speakerId}
              onChange={(e) => onReassign(l.id, e.target.value)}
              aria-label={`Reassign line ${l.id} speaker`}
              className="font-mono text-[11px] outline-none focus:ring-1"
              style={{
                background: PANEL_HI,
                color: INK,
                border: `1px solid ${LINE}`,
                padding: "4px 6px",
              }}
            >
              {speakers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoicePane({
  lines,
  speakers,
  stale,
  regenId,
  onRegen,
}: {
  lines: Line[];
  speakers: Speaker[];
  stale: Record<number, Partial<Record<StageId, boolean>>>;
  regenId: number | null;
  onRegen: (id: number) => void;
}) {
  const spk = (id: string) => speakers.find((s) => s.id === id);
  return (
    <div style={{ color: INK }}>
      <PaneHeader>Voice lines · regenerate one without touching the rest</PaneHeader>
      <div className="space-y-2">
        {lines.map((l) => {
          const s = spk(l.speakerId);
          const isStale = !!stale[l.id]?.voice;
          const busy = regenId === l.id;
          return (
            <div key={l.id} className="border p-3" style={{ borderColor: LINE }}>
              <div
                className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]"
                style={{ color: DIM }}
              >
                <span>
                  Line {l.id} · {l.t} · <span style={{ color: s?.color }}>{s?.name}</span>
                  {isStale && !busy && <StaleTag label="needs regen" />}
                  {busy && <StaleTag label="regenerating…" />}
                </span>
                <span>{l.duration.toFixed(2)}s</span>
              </div>
              <div className="mt-2 font-serif text-[16px] leading-snug">"{l.target}"</div>
              <div
                className="mt-3 grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 font-mono text-[11px]"
                style={{ color: DIM }}
              >
                <FakeWaveform
                  seed={l.id + Math.round(l.pace * 100)}
                  color={s?.color ?? ACC}
                  busy={busy}
                />
                <span>pace {l.pace.toFixed(2)}×</span>
                <span>pause {l.pause}ms</span>
                <button
                  onClick={() => onRegen(l.id)}
                  disabled={busy}
                  className="px-2 py-1 uppercase tracking-[0.14em] transition-colors disabled:opacity-50"
                  style={{
                    color: isStale ? ACC : INK,
                    border: `1px solid ${isStale ? ACC : LINE}`,
                    background: PANEL_HI,
                  }}
                >
                  {busy ? "…" : "Regen line"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FakeWaveform({ seed, color, busy }: { seed: number; color: string; busy: boolean }) {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const x = Math.sin(seed * 3.1 + i * 0.7) * 0.5 + 0.5;
    const y = Math.cos(seed * 1.7 + i * 0.31) * 0.35 + 0.55;
    return round3(Math.max(0.15, Math.min(1, (x + y) / 1.4)));
  });
  return (
    <div className="flex h-6 items-center gap-[2px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 2,
            height: `${h * 100}%`,
            background: color,
            opacity: busy ? 0.3 : 0.75,
            transition: "opacity 200ms",
          }}
        />
      ))}
    </div>
  );
}

function StageChapters() {
  return (
    <section data-reveal className="reveal border-b border-border bg-surface">
      <Container className="py-20 sm:py-28">
        <SectionNumber n="03" label="Each stage, in detail" />
        <h2 className="mt-2 font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Open the hood on any stage.
        </h2>
        <div className="mt-14 space-y-16 lg:space-y-24">
          {STAGES.map((s, i) => {
            const flipped = i % 2 === 1;
            return (
              <article
                key={s.n}
                id={`stage-${s.n}`}
                className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-16"
              >
                <header className={`lg:col-span-5 ${flipped ? "lg:order-2" : ""}`}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-[44px] leading-none tracking-tight text-accent/80 sm:text-[56px]">
                      {s.n}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                      {s.name}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-3xl leading-[1.1] tracking-tight text-foreground sm:text-4xl">
                    {s.one}
                  </h3>
                  <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">{s.body}</p>
                  <ul className="mt-6 space-y-2 font-mono text-[12px] text-muted-foreground">
                    {s.detail.map((d) => (
                      <li key={d} className="flex gap-3">
                        <span className="text-accent">·</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </header>
                <div
                  className={`lg:col-span-7 ${flipped ? "lg:order-1" : ""} ${i > 0 ? "lg:mt-6" : ""}`}
                >
                  <StageInset stage={s.name} index={i} />
                  <p
                    className={`mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground ${flipped ? "lg:text-right" : ""}`}
                  >
                    Fig. 0{i + 2} &nbsp;·&nbsp; {s.name} view
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function StageInset({ stage, index }: { stage: string; index: number }) {
  const bg = "oklch(0.16 0.010 250)";
  const border = "oklch(0.28 0.014 250)";
  const dim = "oklch(0.62 0.02 245)";
  const ink = "oklch(0.94 0.005 240)";

  const content = () => {
    switch (stage) {
      case "Ingest":
        return (
          <div className="p-5 font-mono text-[12px]" style={{ color: dim }}>
            <div className="mb-3 uppercase tracking-[0.14em] text-[10px]">Media probe</div>
            <table className="w-full">
              <tbody>
                {[
                  ["container", "mp4 / h264 / aac"],
                  ["duration", "00:03:18.240"],
                  ["fps", "23.976"],
                  ["audio", "stereo · 48 kHz"],
                  ["scenes", "42 detected"],
                  ["speech", "84% (VAD)"],
                  ["loudness", "−14.1 LUFS"],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="border-b py-1.5 pr-6" style={{ borderColor: border }}>
                      {k}
                    </td>
                    <td
                      className="border-b py-1.5 text-right"
                      style={{ borderColor: border, color: ink }}
                    >
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "Transcribe":
        return (
          <div className="p-5 text-[12px]" style={{ color: ink }}>
            <div
              className="mb-3 font-mono uppercase tracking-[0.14em] text-[10px]"
              style={{ color: dim }}
            >
              Source transcript · de-DE
            </div>
            {[
              ["00:38.120", "Wir haben die", "Pipeline", " neu gebaut,"],
              ["00:42.180", "damit jede Stufe", "editierbar", " bleibt."],
              ["00:46.900", "Und wenn etwas nicht", "stimmt", " …"],
            ].map(([t, a, hi, b]) => (
              <div key={t} className="flex gap-4 py-1.5">
                <span className="font-mono" style={{ color: dim }}>
                  {t}
                </span>
                <span>
                  {a}{" "}
                  <span style={{ background: "oklch(0.68 0.14 50 / 0.25)", padding: "0 2px" }}>
                    {hi}
                  </span>
                  {b}
                </span>
              </div>
            ))}
          </div>
        );
      case "Translate":
        return (
          <div className="p-5 text-[12px]" style={{ color: ink }}>
            <div
              className="mb-3 grid grid-cols-2 gap-6 font-mono uppercase tracking-[0.14em] text-[10px]"
              style={{ color: dim }}
            >
              <span>Source · de-DE</span>
              <span>Target · en-US</span>
            </div>
            {[
              ["Wir haben die Pipeline neu gebaut,", "We rebuilt the pipeline"],
              ["damit jede Stufe editierbar bleibt.", "so every stage stays editable."],
              ["Und wenn etwas nicht stimmt …", "And if something's off …"],
            ].map(([a, b], i) => (
              <div
                key={i}
                className="grid grid-cols-2 gap-6 border-b py-2"
                style={{ borderColor: border }}
              >
                <span style={{ color: dim }}>{a}</span>
                <span className="font-serif text-[15px]">{b}</span>
              </div>
            ))}
            <div
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: dim }}
            >
              Glossary · 12 terms locked
            </div>
          </div>
        );
      case "Diarize":
        return (
          <div className="p-5 text-[12px]" style={{ color: ink }}>
            <div
              className="mb-3 font-mono uppercase tracking-[0.14em] text-[10px]"
              style={{ color: dim }}
            >
              Speakers detected
            </div>
            {[
              { n: "Anna", turns: 24, c: "oklch(0.68 0.15 258)" },
              { n: "Mateo", turns: 18, c: "oklch(0.70 0.12 190)" },
              { n: "Speaker 3", turns: 2, c: "oklch(0.55 0.03 240)" },
            ].map((s) => (
              <div
                key={s.n}
                className="flex items-center justify-between border-b py-3"
                style={{ borderColor: border }}
              >
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full" style={{ background: s.c }} />
                  <div>
                    <div>{s.n}</div>
                    <div className="font-mono text-[10px]" style={{ color: dim }}>
                      {s.turns} turns · 4.2s reference
                    </div>
                  </div>
                </div>
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: dim }}
                >
                  Rename · Merge
                </span>
              </div>
            ))}
          </div>
        );
      case "Voice":
        return (
          <div className="p-5 text-[12px]" style={{ color: ink }}>
            <div
              className="mb-3 flex items-center justify-between font-mono uppercase tracking-[0.14em] text-[10px]"
              style={{ color: dim }}
            >
              <span>Line 42 · Anna</span>
              <span>duration 3.14s / target 3.20s</span>
            </div>
            <div className="font-serif text-[17px] leading-snug">
              "so every stage stays{" "}
              <span style={{ borderBottom: "2px solid oklch(0.68 0.15 258)" }}>editable</span>."
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-[11px]">
              {[
                ["Pace", "0.98×"],
                ["Emphasis", "editable"],
                ["Pause after", "220 ms"],
              ].map(([k, v]) => (
                <div key={k} className="border p-2" style={{ borderColor: border }}>
                  <div className="uppercase tracking-[0.14em] text-[9px]" style={{ color: dim }}>
                    {k}
                  </div>
                  <div className="mt-1">{v}</div>
                </div>
              ))}
            </div>
            <div
              className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: dim }}
            >
              [ Regenerate line ] &nbsp; [ Regenerate speaker ]
            </div>
          </div>
        );
      case "Mix":
        return (
          <div className="p-5 text-[12px]" style={{ color: ink }}>
            <div
              className="mb-3 font-mono uppercase tracking-[0.14em] text-[10px]"
              style={{ color: dim }}
            >
              Timeline
            </div>
            {[
              ["Dialogue EN", "oklch(0.68 0.15 258)", [10, 22, 34, 55, 70, 82]],
              ["Music", "oklch(0.55 0.06 220)", [5, 95]],
              ["SFX", "oklch(0.55 0.03 240)", [40, 62]],
            ].map(([label, color, pts]) => (
              <div key={label as string} className="mb-3">
                <div
                  className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: dim }}
                >
                  {label as string}
                </div>
                <div
                  className="relative h-5 w-full"
                  style={{ background: "oklch(0.20 0.012 250)" }}
                >
                  {(pts as number[]).reduce<React.ReactNode[]>((acc, p, i, arr) => {
                    if (i % 2 === 1) return acc;
                    const next = arr[i + 1] ?? p + 8;
                    acc.push(
                      <span
                        key={i}
                        className="absolute top-0 h-full"
                        style={{
                          left: `${p}%`,
                          width: `${next - p}%`,
                          background: color as string,
                          opacity: 0.85,
                        }}
                      />,
                    );
                    return acc;
                  }, [])}
                </div>
              </div>
            ))}
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-[11px]">
              {[
                ["Loudness", "−16 LUFS"],
                ["Duck", "−9 dB"],
                ["Export", "mp4 + stems"],
              ].map(([k, v]) => (
                <div key={k} className="border p-2" style={{ borderColor: border }}>
                  <div className="uppercase tracking-[0.14em] text-[9px]" style={{ color: dim }}>
                    {k}
                  </div>
                  <div className="mt-1">{v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border border-border shadow-panel" style={{ background: bg }}>
      <div
        className="flex items-center justify-between border-b px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ borderColor: border, color: dim, background: "oklch(0.20 0.012 250)" }}
      >
        <span>Trackdub · {stage.toLowerCase()}</span>
        <span>{String(index + 1).padStart(2, "0")} of 06</span>
      </div>
      {content()}
    </div>
  );
}

/* ---------------- control ---------------- */

function Control() {
  return (
    <section id="control" data-reveal className="reveal border-b border-border">
      <Container className="py-20 sm:py-28">
        <SectionNumber n="03b" label="You can fix anything, and only that thing" />
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              You changed one line. Only one line regenerates.
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted-foreground">
              Change it. The translation invalidates. The affected voice line queues for a regen.
              Every other line stays exactly as it was: same take, same timing, same mix. That's the
              whole idea.
            </p>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <ControlPlate
              tag="Before edit"
              t="00:42.180"
              text="so every stage stays editable."
              hint="Auto-generated · pace 1.00× · pause 200 ms"
            />
            <ControlPlate
              tag="After text + prosody edit"
              t="00:42.180"
              text={
                <>
                  so every stage <span className="border-b-2 border-accent">remains editable</span>.
                </>
              }
              hint="Regen · pace 0.94× · pause 320 ms · this line only"
              accent
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function ControlPlate({
  tag,
  t,
  text,
  hint,
  accent = false,
}: {
  tag: string;
  t: string;
  text: React.ReactNode;
  hint: string;
  accent?: boolean;
}) {
  return (
    <figure className="border border-border bg-card p-5">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className={accent ? "text-accent" : ""}>{tag}</span>
        <span>{t}</span>
      </div>
      <div className="mt-4 font-serif text-2xl leading-snug text-foreground">"{text}"</div>
      <figcaption className="mt-4 font-mono text-[11px] text-muted-foreground">{hint}</figcaption>
    </figure>
  );
}

/* ---------------- performance ---------------- */

function Performance() {
  return (
    <section id="performance" data-reveal className="reveal border-b border-border bg-surface">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-20 sm:px-10 sm:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow={<SectionNumber n="04" label="Performance" />}
              title="Runs on the hardware you already have."
              lead="Trackdub can select TensorRT RTX, CUDA, DirectML, CoreML, MIGraphX, OpenVINO, QNN, or CPU per stage. Pick a policy or let it choose automatically. The tiers below are directional; measured benchmarks publish via DubBench ahead of v1 launch."
              h2ClassName="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl"
              leadClassName="mt-6 text-[17px] leading-relaxed text-muted-foreground"
            />
          </div>
          <div className="lg:col-span-8">
            <ol className="relative">
              {[
                [
                  "TensorRT RTX",
                  "Windows · RTX 30/40/50",
                  "Fastest supported tier",
                  "Selected when the model and RTX runtime are compatible",
                ],
                [
                  "CUDA",
                  "Windows / Linux · NVIDIA",
                  "Fast",
                  "NVIDIA fallback when TensorRT RTX is unavailable",
                ],
                [
                  "CoreML",
                  "macOS · Apple Silicon",
                  "Fast",
                  "Uses Apple Neural Engine and GPU where supported",
                ],
                [
                  "MIGraphX",
                  "Windows 11 · AMD",
                  "Accelerated",
                  "Catalog-delivered AMD GPU lane for compatible ONNX graphs",
                ],
                [
                  "OpenVINO",
                  "Windows 11 · Intel",
                  "Accelerated",
                  "Catalog-delivered Intel CPU, GPU, and NPU lane",
                ],
                [
                  "QNN",
                  "Windows ARM64 · Snapdragon",
                  "Accelerated",
                  "Qualcomm NPU/GPU lane on compatible devices",
                ],
                [
                  "DirectML",
                  "Windows · any DX12 GPU",
                  "Broad coverage",
                  "Intel, AMD, and NVIDIA DirectX 12 hardware",
                ],
                [
                  "CPU (ONNX Runtime)",
                  "All platforms",
                  "Portable baseline",
                  "Always available as the per-stage fallback",
                ],
              ].map(([p, plat, spd, av], i, arr) => (
                <li
                  key={p}
                  data-reveal-child
                  className="reveal-child group/step relative border-b border-border py-4 last:border-b-0 sm:py-5"
                  style={{ marginLeft: `min(${i * 3.5}%, ${i * 34}px)` }}
                >
                  {i > 0 && (
                    <span
                      className="absolute -left-5 top-1/2 hidden -translate-y-1/2 font-mono text-[13px] text-accent sm:block"
                      aria-hidden
                    >
                      ↳
                    </span>
                  )}
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-serif text-[21px] leading-tight text-foreground sm:text-[24px]">
                      {p}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {plat}
                    </span>
                    <span className="ml-auto whitespace-nowrap border border-border px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                      {spd}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                    {av}
                    {i === arr.length - 1 ? ". The ladder always lands somewhere." : ""}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Fig. 05 &nbsp;·&nbsp; Per-stage fallback ladder, fastest to most portable. Order, not
              measured throughput; benchmarks publish via DubBench ahead of v1.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- what you get ---------------- */

function WhatYouGet() {
  const items: [string, string][] = [
    [
      "Local by default",
      "Media, transcripts, voice references, and generated audio stay on your disk. Cloud is opt-in per project, per stage.",
    ],
    [
      "Deterministic runs",
      "Same project manifest + same models = same output. Every stage records what it consumed.",
    ],
    [
      "Resumable jobs",
      "Kill the app mid-run. Reopen the project. Continue from the last completed stage.",
    ],
    [
      "Per-line regen",
      "Regenerate one voice line, one speaker, or one stage. Never a full-project redo for a small fix.",
    ],
    [
      "Editable script",
      "Transcript and translation are real documents with a glossary, not opaque intermediates.",
    ],
    [
      "Voice cloning per speaker",
      "One short reference per speaker. No shared 'AI voice' for the whole video.",
    ],
    [
      "Source separation",
      "Vocal and instrumental stems are split out, kept, and ducked under dialogue automatically. Or manually, if you prefer.",
    ],
    [
      "Lip sync",
      "Optional viseme-matched lip sync for on-camera speakers. Off by default, gated by license lane.",
    ],
    [
      "Open model manifest",
      "Every bundled model, its license lane, and its checksum is declared in one JSON file.",
    ],
    [
      "CLI and SDK",
      "The same pipeline the app runs is scriptable for batch, CI, or on-prem automation.",
    ],
    ["Cross-platform", "Windows, macOS, Linux. Same project format. Same output."],
    [
      "Open-core engine",
      "Domain, application, inference, SDK, and CLI ship Apache 2.0. The desktop app and licensing layer are source-visible.",
    ],
  ];
  return (
    <section id="manifest" data-reveal className="reveal scroll-mt-24 border-b border-border">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow={<SectionNumber n="06" label="The manifest" />}
          title="A workstation, not a wrapper around a model."
          lead="Trackdub declares every bundled model in a manifest: source, checksum, license lane. Here's the same idea applied to the product itself: everything in the box, itemized."
          leadClassName="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground"
        />
        <div className="relative mt-14 border-2 border-foreground bg-background">
          <div
            aria-hidden
            onClick={replayStamp}
            className="stamp-in absolute -top-5 right-6 hidden cursor-pointer select-none rotate-[-6deg] border-4 border-double border-accent bg-background px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-accent sm:block sm:right-12"
            title="Stamp it again"
          >
            Commercial-safe
            <br />
            all tiers ✓
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-foreground px-5 py-4 sm:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground">
              Trackdub · shipping manifest
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Items: {items.length} · Rev. early preview
            </span>
          </div>
          <ol className="grid md:grid-cols-2">
            {items.map(([term, def], i) => (
              <li
                key={term}
                data-reveal-child
                className="reveal-child group flex gap-4 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-surface/50 sm:px-8 md:[&:nth-last-child(2)]:border-b-0 md:odd:border-r"
              >
                <span className="pt-1 font-mono text-[11px] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-serif text-[19px] leading-snug text-foreground">{term}</div>
                  <div className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                    {def}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground px-5 py-3 sm:px-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Models declared in bundled-models.manifest.json · source · checksum · license lane
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Nothing research-only ships as a default
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- compared to ---------------- */

function ComparedTo() {
  const rows: [string, string, string, string, string][] = [
    ["Runs locally", "Yes", "No", "No", "Yes"],
    ["Editable transcript", "Yes", "Yes", "Yes, in Dubbing Studio", "Yes"],
    ["Per-line / per-clip regen", "Yes", "Composition-level", "Yes, in Dubbing Studio", "Manual"],
    [
      "Speaker-aware voicing",
      "Yes",
      "Yes, manual speaker→voice map",
      "Yes, clip or track voice clone",
      "Manual",
    ],
    ["Deterministic runs", "Yes", "Not published", "Not published", "No"],
    ["Resumable jobs", "Yes", "Not published", "Not published", "No"],
    ["Programmatic access", "CLI + SDK", "Not published", "API, enterprise waitlist", "N/A"],
    ["No account required", "Yes", "No", "No", "N/A"],
  ];
  return (
    <section data-reveal className="reveal border-b border-border bg-surface">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow={<SectionNumber n="07" label="Compared to" />}
          title="Trackdub, next to how dubbing usually gets done."
        />
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="border-b border-border py-4 pr-4 font-normal"></th>
                <th className="border-b-2 border-accent bg-background px-4 py-4 font-normal text-accent">
                  Trackdub
                </th>
                <th className="border-b border-border px-4 py-4 font-normal">Descript</th>
                <th className="border-b border-border px-4 py-4 font-normal">ElevenLabs Dubbing</th>
                <th className="border-b border-border py-4 pl-4 font-normal">
                  DIY (Whisper + TTS + DAW)
                </th>
              </tr>
            </thead>
            <tbody className="font-mono text-[13px]">
              {rows.map(([label, a, b, c, d]) => (
                <tr key={label}>
                  <td className="border-b border-border py-4 pr-4 font-serif text-[16px] font-normal text-foreground">
                    {label}
                  </td>
                  <td className="border-b border-border bg-background px-4 py-4 font-medium text-foreground">
                    {a}
                  </td>
                  <td className="border-b border-border px-4 py-4 text-muted-foreground">{b}</td>
                  <td className="border-b border-border px-4 py-4 text-muted-foreground">{c}</td>
                  <td className="border-b border-border py-4 pl-4 text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Descript and ElevenLabs Dubbing feature sets per each vendor's public docs, checked July
          2026. Feature sets change; verify current before deciding.
        </p>
      </Container>
    </section>
  );
}

/* ---------------- pricing ---------------- */

function Pricing() {
  const plans = PRICING_PLANS;
  return (
    <section id="pricing" data-reveal className="reveal border-b border-border">
      <Container className="py-20 sm:py-28">
        <SectionNumber n="08" label="Pricing" />
        <h2 className="mt-6 max-w-2xl font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Three ways to run it. All of them local-first.
        </h2>
        <ul
          role="list"
          className="mt-14 grid list-none divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0"
        >
          {plans.map((p) => (
            <PlanCard
              key={p.name}
              plan={p}
              className="card-lift group relative p-8 transition-colors hover:bg-surface/50 focus-within:bg-surface/50 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-background"
              ctaClassName="inline-flex items-baseline gap-1 rounded-sm border-b border-foreground/40 pb-0.5 text-foreground outline-none hover:border-accent hover:text-accent focus-visible:outline-none"
            />
          ))}
        </ul>
        <p className="mt-8 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
          <Link
            to="/pricing"
            className="border-b border-foreground/30 pb-0.5 text-foreground hover:border-accent hover:text-accent"
          >
            Full pricing, license terms, and FAQ →
          </Link>
        </p>
      </Container>
    </section>
  );
}

/* ---------------- faq ---------------- */

function FAQ() {
  const items = FAQ_ITEMS;
  return (
    <section id="faq" data-reveal className="reveal border-b border-border bg-surface">
      <Container className="py-20 sm:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow={<SectionNumber n="09" label="Questions" />}
              title="Straight answers."
              lead={
                <>
                  Not covered here? Write to{" "}
                  <TextLink href="mailto:hello@trackdub.com">hello@trackdub.com</TextLink>.
                </>
              }
              h2ClassName="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl"
              leadClassName="mt-6 text-[16px] leading-relaxed text-muted-foreground"
            />
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              New to how AI dubbing works stage by stage? Read the{" "}
              <Link
                to="/guides/ai-dubbing-guide"
                className="inline-flex items-baseline gap-1 border-b border-foreground/30 pb-0.5 text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                AI dubbing guide
              </Link>
              . Data handling is covered in full in the{" "}
              <Link
                to="/privacy"
                className="inline-flex items-baseline gap-1 border-b border-foreground/30 pb-0.5 text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                privacy policy
              </Link>
              .
            </p>
          </div>
          <dl className="lg:col-span-8">
            {items.map((it, i) => (
              <div key={it.q} data-reveal-child className="reveal-child">
                {i > 0 && <Rule />}
                <div className="grid gap-4 py-6 md:grid-cols-[220px_1fr] md:gap-8">
                  <dt className="font-serif text-[20px] leading-snug text-foreground">
                    <span className="mr-2 font-mono text-[11px] text-accent" aria-hidden>
                      Q.{String(i + 1).padStart(2, "0")}
                    </span>
                    {it.q}
                  </dt>
                  <dd className="text-[16px] leading-relaxed text-muted-foreground">{it.a}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- endnote ---------------- */

function Endnote() {
  return (
    <section id="waitlist" data-reveal className="reveal border-b border-border">
      <Container className="py-24 sm:py-36 text-center">
        <p className="mx-auto max-w-3xl font-serif text-4xl leading-[1.12] tracking-tight text-foreground sm:text-5xl">
          Dub this in Spanish. Keep the original music. Regenerate line 42 with slower prosody. Ship
          it before lunch.
        </p>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          Interested in Trackdub? Join the launch list and be the first to know when downloads,
          release notes, and preview invitations are ready.
        </p>
        <WaitlistForm />
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <TextLink href="mailto:hello@trackdub.com">Talk to us →</TextLink>
        </div>
        <p className="mx-auto mt-10 max-w-xl font-mono text-[11px] uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">
          Evaluating Trackdub for a program, fund, or partnership?{" "}
          <a
            href="mailto:press@trackdub.com"
            className="border-b border-foreground/30 pb-0.5 text-foreground hover:border-accent hover:text-accent"
          >
            press@trackdub.com
          </a>{" "}
          · building in public:{" "}
          <Link
            to="/changelog"
            className="border-b border-foreground/30 pb-0.5 text-foreground hover:border-accent hover:text-accent"
          >
            read the changelog
          </Link>
        </p>
      </Container>
    </section>
  );
}

/* ---------------- waitlist ---------------- */

// Turnstile widget sitekey (public). Set VITE_TURNSTILE_SITE_KEY at build
// time to the real Turnstile site from the Cloudflare dashboard — the
// fallback below is only a placeholder for local dev/preview builds that
// never set it.
const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "0x4AAAAAAD9pNIBkKRhSY098";

const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Enter your email")
    .max(320, "Email is too long")
    .email("That doesn't look like an email"),
});

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
    __onTurnstileLoad__?: () => void;
  }
}

const WAITLIST_INTERESTS = new Set(["personal", "pro", "studio"]);

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [verificationState, setVerificationState] = useState<"required" | "ready" | "error">(
    "required",
  );
  // The interest tag is read once from the URL (?interest=...) and only used
  // in the signup POST body — it never affects rendered markup, so a lazy
  // initializer is hydration-safe and avoids a state write inside an effect.
  const [interest] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const fromUrl = new URLSearchParams(window.location.search).get("interest");
    return fromUrl && WAITLIST_INTERESTS.has(fromUrl) ? fromUrl : null;
  });
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Render the widget explicitly instead of Turnstile's implicit
  // `.cf-turnstile` auto-scan: on an SSR'd page the auto-scan can run before
  // (or race) the container landing in the DOM and silently no-op, leaving
  // the widget permanently blank with no console error. Rendering once both
  // the container ref and the turnstile API are confirmed ready removes
  // that race entirely.
  useEffect(() => {
    let cancelled = false;
    const tryRender = () => {
      if (cancelled || !widgetContainerRef.current || widgetIdRef.current || !window.turnstile) {
        return;
      }
      widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action: "waitlist_signup",
        callback: (token: string) => {
          setTurnstileToken(token);
          setVerificationState("ready");
        },
        "error-callback": (errorCode: string) => {
          console.warn("[waitlist] Turnstile error", errorCode);
          setTurnstileToken(null);
          setVerificationState("error");
          return true;
        },
        "expired-callback": () => {
          setTurnstileToken(null);
          setVerificationState("required");
          window.turnstile?.reset(widgetIdRef.current ?? undefined);
        },
      });
    };
    if (window.turnstile) {
      tryRender();
    } else {
      window.__onTurnstileLoad__ = tryRender;
    }
    return () => {
      cancelled = true;
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
      delete window.__onTurnstileLoad__;
    };
  }, []);

  function resetVerification() {
    setTurnstileToken(null);
    setVerificationState("required");
    window.turnstile?.reset(widgetIdRef.current ?? undefined);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    const parsed = waitlistSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    if (!turnstileToken) {
      widgetContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Complete the security check below to join the launch list.");
      return;
    }
    setStatus("loading");
    const normalized = parsed.data.email.toLowerCase();
    // trackdub.dev (ChatGPT Sites) has no D1/Turnstile bindings of its own,
    // so it posts cross-origin to the canonical API on trackdub.com instead
    // of relying on its own (nonexistent) server env. Every other host
    // (localhost, Workers preview URLs, QA) keeps the relative endpoint —
    // the production preflight only allow-lists trackdub.dev origins, so
    // routing them to the absolute URL would just fail CORS.
    const apiBase =
      typeof window !== "undefined" &&
      (window.location.hostname === "trackdub.dev" ||
        window.location.hostname === "www.trackdub.dev")
        ? "https://trackdub.com"
        : "";
    try {
      const res = await fetch(`${apiBase}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          turnstileToken,
          interest: interest ?? undefined,
        }),
      });
      const data: { ok: boolean; error?: string } | null = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setStatus("idle");
        if (res.status === 403) {
          resetVerification();
          toast.error("Verification expired. Please complete it again.");
          return;
        }
        toast.error(data?.error || "Could not join the list. Try again in a moment.");
        return;
      }
    } catch {
      setStatus("idle");
      toast.error("Could not reach the server. Try again in a moment.");
      return;
    }
    setStatus("done");
    toast.success("You're on the list.");
  }

  if (status === "done") {
    return (
      <p className="mx-auto mt-12 max-w-md font-mono text-[13px] uppercase tracking-[0.14em] text-accent">
        You're on the list. We'll email you when Trackdub ships.
      </p>
    );
  }

  return (
    <>
      <script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__onTurnstileLoad__&render=explicit"
        async
        defer
      />
      <form
        onSubmit={onSubmit}
        className="mx-auto mt-12 flex w-full max-w-md flex-col items-center gap-3"
        noValidate
      >
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <label htmlFor="waitlist-email" className="sr-only">
            Email address
          </label>
          <input
            id="waitlist-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            maxLength={320}
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            className="flex-1 rounded-sm border border-border bg-background px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === "loading" || !turnstileToken}
            aria-describedby="waitlist-verification-status"
            className="inline-flex items-center justify-center rounded-sm bg-foreground px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-background outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
          >
            {status === "loading"
              ? "Adding…"
              : turnstileToken
                ? "Join launch list"
                : "Verify below"}
          </button>
        </div>
        <div ref={widgetContainerRef} />
        <p
          id="waitlist-verification-status"
          className="text-center font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
          aria-live="polite"
        >
          {verificationState === "ready"
            ? "Security check complete. You can join the list."
            : verificationState === "error"
              ? "Security check needs attention. Retry below."
              : "Complete the security check to enable the join button."}
        </p>
        {verificationState === "error" && (
          <button
            type="button"
            onClick={resetVerification}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent underline underline-offset-4"
          >
            Retry security check
          </button>
        )}
      </form>
    </>
  );
}

/* ---------------- colophon ---------------- */

function Colophon() {
  const cols: [string, [string, string][]][] = [
    [
      "Product",
      [
        ["Pipeline", "#pipeline"],
        ["Control", "#control"],
        ["Resumable jobs", "#resume"],
        ["Performance", "#performance"],
        ["Architecture", "#architecture"],
        ["Requirements", "#requirements"],
        ["Pricing", "/pricing"],
        ["Changelog", "/changelog"],
      ],
    ],
    [
      "Resources",
      [
        ["Guides", "/guides"],
        ["AI dubbing guide", "/guides/ai-dubbing-guide"],
        ["Docs", "/docs"],
        ["Local-first checklist", "/downloads/trackdub-local-first-dubbing-checklist.pdf"],
      ],
    ],
    [
      "Developers",
      [
        ["CLI", "/docs#quickstart"],
        ["SDK", "/docs"],
        ["REST API", "/docs"],
        ["Model manifest", "/docs#manifest"],
      ],
    ],
    [
      "Company",
      [
        ["Contact", "mailto:hello@trackdub.com"],
        ["Press", "mailto:press@trackdub.com"],
        ["Security", "mailto:security@trackdub.com"],
        ["Privacy policy", "/privacy"],
        ["Legal", "mailto:legal@trackdub.com"],
      ],
    ],
  ];
  return (
    <footer className="bg-background">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <a
              href="#top"
              className="flex items-center gap-3 font-serif text-3xl leading-none text-foreground"
              aria-label="Trackdub home"
            >
                <img
                  src={trackdubIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-[1.1em] w-auto shrink-0 -translate-y-[0.03em]"
                />
              <span>
                Trackdub<span className="text-accent">.</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted-foreground">
              A desktop workstation for dubbing video. Local-first. Editable at every stage.
            </p>
            <CompanyAttribution className="mt-3" />
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Early preview ·{" "}
              <a href="/changelog" className="text-foreground hover:text-accent">
                Building in public →
              </a>
            </p>
          </div>
          {cols.map(([h, links]) => (
            <div key={h} className="lg:col-span-2">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {h}
              </div>
              <ul className="mt-4 space-y-2 text-[14px]">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-foreground hover:text-accent">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Rule className="mt-14" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>© 2026 Trackdub</span>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Trackdub on GitHub"
            className="inline-flex items-center gap-2 text-foreground hover:text-accent"
          >
            <Github className="h-4 w-4" aria-hidden="true" /> GitHub
          </a>
        </div>
      </Container>
    </footer>
  );
}

/* ---------------- local-first (privacy + architecture + requirements) ---------------- */

function LocalFirst() {
  const pipeline = ["Ingest", "Transcribe", "Translate", "Diarize", "Voice", "Mix", "Export"];

  const stays: { item: string; note: string }[] = [
    { item: "Source media", note: "Never uploaded. Decode, analysis, and export are local." },
    {
      item: "Transcripts & translations",
      note: "Editable local files, plus glossary and speaker maps.",
    },
    { item: "Voice references", note: "Per-project only. Never used to train a shared model." },
    { item: "Generated audio & stems", note: "Written to the output folder you choose." },
    { item: "Project files", note: "SQLite state and manifests, in a folder you control." },
    { item: "Model cache", note: "ONNX models and engine caches. Clearable in Preferences." },
  ];

  const optin: { item: string; what: string; how: string }[] = [
    {
      item: "Cloud translation",
      what: "Source text for the lines you route to a hosted provider.",
      how: "Off by default · per project, per stage",
    },
    {
      item: "Cloud voice generation",
      what: "Target text and optional speaker reference for hosted TTS.",
      how: "Off by default · per project, per stage",
    },
    {
      item: "Telemetry",
      what: "Anonymous crash reports and usage counters.",
      how: "Disabled on install",
    },
    {
      item: "Update checks",
      what: "App version and OS info only. No media, no project data.",
      how: "On launch · can be disabled",
    },
  ];

  const retention: { item: string; what: string; retention: string }[] = [
    {
      item: "Project files",
      what: "SQLite project state, manifests, and stage snapshots.",
      retention: "Kept in the project folder you choose. Deleted when you delete the project.",
    },
    {
      item: "Source media",
      what: "Original video/audio, proxies, and extracted stems.",
      retention: "Never uploaded. You choose the folder and can wipe it at any time.",
    },
    {
      item: "Transcripts & translations",
      what: "Editable script documents, glossaries, and speaker mappings.",
      retention: "Stored as local files. No cloud sync unless you configure it.",
    },
    {
      item: "Voice references",
      what: "Short speaker clips used for voice cloning.",
      retention: "Stay on disk. Never used to train a shared model.",
    },
    {
      item: "Generated audio",
      what: "Per-line TTS output, mix stems, and exported deliverables.",
      retention: "Written to your project output folder. You own and control them.",
    },
    {
      item: "Model cache",
      what: "Downloaded ONNX models and compiled engine caches.",
      retention: "Stored in the app data directory. Can be cleared in Preferences.",
    },
  ];

  const tiers: {
    id: string;
    eyebrow: string;
    name: string;
    tagline: string;
    featured?: boolean;
    stamp?: string;
    rows: [string, string][];
  }[] = [
    {
      id: "floor",
      eyebrow: "Trim 01 · CPU-only or cloud-routed",
      name: "Bare minimum",
      tagline: "Slow is fine. Stuck is not.",
      rows: [
        ["OS", "Windows 10 Enterprise LTSC 2021 (build 19044), or Windows 11"],
        ["CPU", "Any 64-bit x64 or ARM64"],
        ["GPU", "None. CPU inference, or route the heavy stages to a cloud provider"],
        ["RAM", "16 GB · 8 GB workable when heavy stages are cloud-routed"],
        ["VRAM", "none needed"],
        ["Storage", "10 GB for app + bundled models"],
      ],
    },
    {
      id: "recommended",
      eyebrow: "Trim 02 · The daily driver",
      name: "Recommended",
      tagline: "Comfortable for 1080p projects.",
      featured: true,
      rows: [
        ["OS", "Windows 11 24H2 (build 26100)"],
        ["CPU", "Modern 8-core x64, or Snapdragon X-class ARM64"],
        ["GPU", "RTX 3060 / 4060 class, or any DirectX 12 GPU via DirectML"],
        ["RAM", "32 GB"],
        ["VRAM", "8 GB"],
        ["Storage", "SSD · 50 GB free for model + engine cache"],
      ],
    },
    {
      id: "premium",
      eyebrow: "Trim 03 · The studio rig",
      name: "Premium",
      tagline: "4K, long-form, many speakers, no waiting.",
      stamp: "Overkill: approved ✓",
      rows: [
        ["OS", "Windows 11 24H2 (build 26100)"],
        ["CPU", "12 cores or better"],
        ["GPU", "RTX 4080 / 5080 class, TensorRT RTX lane"],
        ["RAM", "64 GB"],
        ["VRAM", "16 GB+"],
        ["Storage", "NVMe SSD · 100 GB free"],
      ],
    },
  ];

  const otherPlatforms: [string, string][] = [
    [
      "macOS",
      "macOS 14 Sonoma or later. Apple Silicon recommended; the CoreML lane uses the Neural Engine; Intel Macs run the CPU lane.",
    ],
    [
      "Linux",
      "Ubuntu 22.04+ / Debian 12+ or equivalent glibc distro, x64 or arm64. NVIDIA CUDA for acceleration; CPU otherwise.",
    ],
  ];

  const accelerators: { name: string; requirement: string; speedup: string; caveat: string }[] = [
    {
      name: "TensorRT RTX",
      requirement: "Windows or Linux · NVIDIA RTX 30 / 40 / 50 series",
      speedup: "Fastest on supported hardware",
      caveat:
        "Requires a compatible model, driver, and installed provider bundle. First run can compile an engine cache.",
    },
    {
      name: "CUDA",
      requirement: "Linux or advanced Windows setup · NVIDIA GPU",
      speedup: "Fast general NVIDIA lane",
      caveat: "Used when the matching native ONNX Runtime and CUDA dependencies are available.",
    },
    {
      name: "CoreML",
      requirement: "macOS · Apple Silicon",
      speedup: "Apple Neural Engine + GPU",
      caveat:
        "Model compatibility determines whether a stage stays on CoreML or falls back to CPU.",
    },
    {
      name: "MIGraphX",
      requirement: "Windows 11 24H2+ · supported AMD GPU",
      speedup: "AMD catalog acceleration",
      caveat:
        "Installed through the Windows ML provider catalog; availability is model and device dependent.",
    },
    {
      name: "OpenVINO",
      requirement: "Windows 11 24H2+ · supported Intel CPU, GPU, or NPU",
      speedup: "Intel catalog acceleration",
      caveat:
        "Installed through the Windows ML provider catalog and used only for compatible stages.",
    },
    {
      name: "QNN",
      requirement: "Windows ARM64 · compatible Snapdragon device",
      speedup: "Qualcomm NPU/GPU acceleration",
      caveat:
        "Catalog availability and model support determine whether a stage can use the QNN lane.",
    },
    {
      name: "DirectML",
      requirement: "Windows · any DirectX 12 GPU · 4 GB+ VRAM",
      speedup: "Broadest Windows GPU coverage",
      caveat:
        "Legacy-compatible fallback for Intel, AMD, and NVIDIA hardware; model support varies by stage.",
    },
    {
      name: "CPU fallback",
      requirement: "Windows, macOS, or Linux · x64 or ARM64",
      speedup: "Portable baseline",
      caveat: "Always available. No accelerator is required to complete a project.",
    },
  ];

  return (
    <section
      id="architecture"
      data-reveal
      className="reveal scroll-mt-24 border-b border-border bg-surface"
    >
      <Container className="py-20 sm:py-28">
        <SectionNumber n="05" label="Local-first, drawn as a map" />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-2xl font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Your media is yours. Here is the whole map.
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Every stage runs on your machine by default. A cloud provider is something you plug in
            per stage, never a place your media silently ends up.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-12">
          {/* inside the machine */}
          <div className="relative border-2 border-foreground bg-background p-6 sm:p-8">
            <span className="absolute -top-[11px] left-6 bg-background px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground">
              Your machine
            </span>
            <div className="flex flex-wrap items-center gap-y-2 font-mono text-[11px]">
              {pipeline.map((s, i) => (
                <span key={s} data-reveal-child className="reveal-child flex items-center">
                  {i > 0 && (
                    <span className="px-1.5 text-accent" aria-hidden>
                      →
                    </span>
                  )}
                  <span className="border border-border px-2 py-1 uppercase tracking-[0.12em] text-foreground">
                    {s}
                  </span>
                </span>
              ))}
            </div>
            <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Stays on this side of the line
            </div>
            <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {stays.map((s) => (
                <li
                  key={s.item}
                  data-reveal-child
                  className="reveal-child border-t border-border pt-3"
                >
                  <div className="font-serif text-[17px] text-foreground">{s.item}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {s.note}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* across the boundary */}
          <div className="relative border-2 border-dashed border-border p-6 sm:p-8">
            <span className="absolute -top-[11px] left-6 bg-surface px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Across the line · opt-in only
            </span>
            <ul className="space-y-6">
              {optin.map((o) => (
                <li key={o.item} data-reveal-child className="reveal-child">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[13px] text-accent" aria-hidden>
                      ⇠
                    </span>
                    <span className="font-serif text-[18px] text-foreground">{o.item}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{o.what}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                    {o.how}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Fig. 06 &nbsp;·&nbsp; The default data plane. Nothing crosses the dashed line unless you
          route it there, one stage at a time.
        </p>

        {/* three trims */}
        <div id="requirements" className="mt-16 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
              Pick your trim level.
            </h3>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Tbl. 03 &nbsp;·&nbsp; System requirements
            </span>
          </div>
          <div className="mt-8 grid divide-y divide-border border border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {tiers.map((t) => (
              <article
                key={t.id}
                data-reveal-child
                className={`reveal-child relative p-6 sm:p-7 ${t.featured ? "bg-background" : ""}`}
              >
                {t.stamp && (
                  <div
                    aria-hidden
                    onClick={replayStamp}
                    className="stamp-in absolute -top-4 right-4 hidden cursor-pointer select-none rotate-[5deg] border-[3px] border-double border-accent bg-background px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent sm:block"
                    title="Stamp it again"
                  >
                    {t.stamp}
                  </div>
                )}
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                  {t.eyebrow}
                </div>
                <div className="mt-2 font-serif text-[26px] leading-tight text-foreground">
                  {t.name}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {t.tagline}
                </p>
                <dl className="mt-5 space-y-2.5">
                  {t.rows.map(([k, v]) => (
                    <div
                      key={k}
                      className="grid grid-cols-[64px_1fr] gap-3 border-t border-border/70 pt-2.5"
                    >
                      <dt className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {k}
                      </dt>
                      <dd className="text-[13px] leading-relaxed text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <div className="mt-6 border border-dashed border-border p-5 sm:p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Other platforms · provisional until those builds ship
            </div>
            <dl className="mt-3 grid gap-x-10 gap-y-3 md:grid-cols-2">
              {otherPlatforms.map(([name, desc]) => (
                <div key={name} className="grid grid-cols-[64px_1fr] gap-3">
                  <dt className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">
                    {name}
                  </dt>
                  <dd className="text-[13px] leading-relaxed text-muted-foreground">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            No accelerator required; every stage has a CPU fallback. HDD works; it just makes you
            wait.
          </p>
        </div>

        {/* the fine print, foldable */}
        <div className="mt-14 border-t border-border">
          <details id="privacy" className="group scroll-mt-24 border-b border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
              <span>Tbl. 02 &nbsp;·&nbsp; What's stored locally, and for how long</span>
              <span
                className="text-[16px] leading-none text-accent transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <div className="overflow-x-auto pb-8">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="border-b border-border py-3 pr-4 font-normal">Data</th>
                    <th className="border-b border-border py-3 pr-4 font-normal">What it is</th>
                    <th className="border-b border-border py-3 font-normal">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {retention.map((l) => (
                    <tr key={l.item} className="hover:bg-background/60">
                      <td className="border-b border-border py-4 pr-4 align-top font-serif text-[17px] text-foreground">
                        {l.item}
                      </td>
                      <td className="border-b border-border py-4 pr-4 align-top text-[14px] leading-relaxed text-muted-foreground">
                        {l.what}
                      </td>
                      <td className="border-b border-border py-4 align-top font-mono text-[12px] text-foreground">
                        {l.retention}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <details className="group border-b border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
              <span>Tbl. 04 &nbsp;·&nbsp; Acceleration lanes, in detail</span>
              <span
                className="text-[16px] leading-none text-accent transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <div className="grid gap-px bg-border md:grid-cols-2">
              {accelerators.map((a) => (
                <div key={a.name} className="bg-surface p-5">
                  <div className="font-serif text-[20px] text-foreground">{a.name}</div>
                  <dl className="mt-3 space-y-2">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Requirement
                      </dt>
                      <dd className="mt-0.5 text-[14px] leading-relaxed text-foreground">
                        {a.requirement}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Speedup
                      </dt>
                      <dd className="mt-0.5 text-[14px] leading-relaxed text-foreground">
                        {a.speedup}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Caveat
                      </dt>
                      <dd className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">
                        {a.caveat}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </details>
        </div>
      </Container>
    </section>
  );
}
