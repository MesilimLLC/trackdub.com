import { useEffect } from "react";

/**
 * Adds `.revealed` to any element with `data-reveal` when it enters the viewport.
 * Once-only; respects prefers-reduced-motion.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const revealHashTarget = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      const revealRoot = target?.closest<HTMLElement>("[data-reveal]");
      revealRoot?.classList.add("revealed");
      requestAnimationFrame(() => target?.scrollIntoView());
    };

    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.classList.add("revealed");
      });
      return () => window.removeEventListener("hashchange", revealHashTarget);
    }
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const prepare = (root: HTMLElement) => {
      const kids = root.querySelectorAll<HTMLElement>("[data-reveal-child]");
      kids.forEach((k, i) => {
        if (!k.style.getPropertyValue("--reveal-i")) {
          k.style.setProperty("--reveal-i", String(i));
        }
      });
    };
    const io = new IntersectionObserver(
      (entries) => {
        // Cascade when several sections cross the threshold in one batch
        // (fast scroll). Sort by document position so top-to-bottom feels natural.
        const incoming = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => {
            const pos = a.compareDocumentPosition(b);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
          });
        incoming.forEach((el, idx) => {
          prepare(el);
          const delay = incoming.length > 1 ? Math.min(idx * 90, 240) : 0;
          el.style.setProperty("--reveal-delay", `${delay}ms`);
          // next frame so the delay is committed before the class change animates
          requestAnimationFrame(() => el.classList.add("revealed"));
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: [0, 0.08] },
    );
    document.documentElement.classList.add("td-reveals-enabled");
    els.filter((el) => !el.classList.contains("revealed")).forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      document.documentElement.classList.remove("td-reveals-enabled");
      window.removeEventListener("hashchange", revealHashTarget);
    };
  }, []);
}
