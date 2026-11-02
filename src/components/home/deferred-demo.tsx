import { lazy, Suspense, useEffect, useRef, type ReactNode } from "react";

// SSR renders the complete demos. In the browser, React keeps that HTML
// while these Suspense boundaries wait to hydrate until near the viewport.
function deferredImport<T>(load: () => Promise<T>) {
  let activate: (() => void) | undefined;
  const ready = new Promise<void>((resolve) => { activate = resolve; });
  return {
    load: () => import.meta.env.SSR ? load() : ready.then(load),
    activate: () => activate?.(),
  };
}

const walkthrough = deferredImport(() => import("./walkthrough"));
const resumableJob = deferredImport(() => import("./resumable-job"));
export const Walkthrough = lazy(walkthrough.load);
export const ResumableJob = lazy(resumableJob.load);

export function DeferredDemo({ id, children }: {
  id: "walkthrough" | "resume";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const demo = id === "walkthrough" ? walkthrough : resumableJob;
    if (!("IntersectionObserver" in window)) {
      demo.activate();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        demo.activate();
        observer.disconnect();
      }
    }, { rootMargin: "800px" });
    observer.observe(node);
    // Explicit navigation and interaction should never wait for a scroll frame.
    const activateHash = () => {
      if (window.location.hash === `#${id}`) demo.activate();
    };
    const activate = () => demo.activate();
    activateHash();
    window.addEventListener("hashchange", activateHash);
    node.addEventListener("pointerdown", activate, { passive: true });
    node.addEventListener("focusin", activate);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", activateHash);
      node.removeEventListener("pointerdown", activate);
      node.removeEventListener("focusin", activate);
    };
  }, [id]);
  return (
    <div ref={ref} data-deferred-demo={id}>
      <Suspense fallback={<section id={id} className="deferred-demo-space border-b border-border" aria-busy="true" />}>
        {children}
      </Suspense>
    </div>
  );
}