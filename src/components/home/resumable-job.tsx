import { useEffect, useRef, useState } from "react";
import { Container, SectionNumber } from "./shared";
import { SectionHeading } from "@/components/section-heading";
import { DIM, INK, LINE, ACC, PANEL, PANEL_HI } from "./demo-theme";

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

export default function ResumableJob() {
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
