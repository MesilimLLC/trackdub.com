import { useState } from "react";
import type * as React from "react";
import { Container, SectionNumber } from "./shared";
import { SectionHeading } from "@/components/section-heading";
import { DIM, INK, LINE, ACC, PANEL, PANEL_HI } from "./demo-theme";

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

export default function Walkthrough() {
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

function round3(n: number) { return Number(n.toFixed(3)); }

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

