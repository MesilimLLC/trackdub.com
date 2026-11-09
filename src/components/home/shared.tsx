import type * as React from "react";

export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-6xl px-6 sm:px-10 ${className}`}>{children}</div>;
}

export function SectionNumber({ n, label }: { n: string; label: string }) {
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
