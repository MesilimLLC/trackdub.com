import { createFileRoute } from "@tanstack/react-router";
import { Container, SectionNumber, SiteShell } from "@/components/site-shell";
import { SectionHeading } from "@/components/section-heading";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Trackdub" },
      {
        name: "description",
        content:
          "How Trackdub handles your media, transcripts, and voice references. Local-first by default; cloud is strictly opt-in per project and per stage.",
      },
      { property: "og:title", content: "Privacy Policy — Trackdub" },
      {
        property: "og:description",
        content:
          "Local-first privacy rules for the Trackdub desktop workstation. What is stored, what never leaves your machine, and what is opt-in.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/privacy" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

const LOCAL: { item: string; what: string; retention: string; plain: string }[] = [
  {
    item: "Project files",
    what: "SQLite project state, manifests, and stage snapshots.",
    retention: "Kept in the project folder you choose. Deleted when you delete the project.",
    plain:
      "The bookkeeping Trackdub needs to remember your work — which stages ran, what settings you used, and where your media lives. It sits inside the project folder you pick, and there is no hidden second copy.",
  },
  {
    item: "Source media",
    what: "Original video/audio, proxies, and extracted stems.",
    retention: "Never uploaded. You choose the folder and can wipe it at any time.",
    plain:
      "The original files you drag in and any lightweight preview copies Trackdub makes to scrub through them. They stay where you put them, and you can delete them like any other file on your disk.",
  },
  {
    item: "Transcripts & translations",
    what: "Editable script documents, glossaries, and speaker mappings.",
    retention: "Stored as local files. No cloud sync unless you configure it.",
    plain:
      "The editable script for both languages, your glossary, and the labels you gave each speaker. These are plain files in your project folder — you can back them up, diff them, or throw them out.",
  },
  {
    item: "Voice references",
    what: "Short speaker clips used for voice cloning.",
    retention: "Stay on disk. Never used to train a shared model.",
    plain:
      "A few seconds of each speaker so Trackdub can voice them in the target language. Those clips are only used inside your project. They are not pooled with other users and they are not used to train any shared model.",
  },
  {
    item: "Generated audio",
    what: "Per-line TTS output, mix stems, and exported deliverables.",
    retention: "Written to your project output folder. You own and control them.",
    plain:
      "Every generated voice line, mix stem, and final export goes to the output folder you chose. You keep them, move them, ship them — same as any file you rendered yourself.",
  },
  {
    item: "Model cache",
    what: "Downloaded ONNX models and compiled engine caches.",
    retention: "Stored in the app data directory. Can be cleared in Preferences.",
    plain:
      "The models Trackdub downloads once so it does not have to fetch them every run, plus any GPU engines it compiles for your machine. You can wipe the cache from Preferences without touching your projects.",
  },
];

const NEVER: { item: string; why: string; plain: string }[] = [
  {
    item: "Source video or audio",
    why: "Decoding, analysis, and export happen locally.",
    plain:
      "Your raw media never gets uploaded. FFmpeg decodes it on your machine, the pipeline reads it on your machine, and the final render is written on your machine.",
  },
  {
    item: "Transcripts and translations",
    why: "Local MT runs against your editable script by default.",
    plain:
      "The default translation stage runs locally, so your script stays with you. If you turn on a cloud translation provider, only the lines you routed to it are sent — and only then.",
  },
  {
    item: "Voice references",
    why: "Speaker clips are used only for per-project voicing.",
    plain:
      "The reference clip you record or crop for a speaker is used to voice that speaker in that project. It is not shipped to Trackdub, not shared between projects, and not part of any training set.",
  },
  {
    item: "Generated output",
    why: "Final mix and stems are written to your disk.",
    plain:
      "The dubbed video, mix, and stems land in your output folder. Nothing is copied to a server for review or storage.",
  },
];

const OPTIN: { item: string; what: string; how: string; plain: string }[] = [
  {
    item: "Cloud translation",
    what: "Source text for the lines you route to a hosted provider.",
    how: "Off by default. Enabled per project, per stage, in Settings.",
    plain:
      "If you decide a hosted translation service is better for a specific project, you can enable it for that project. Only the source text for the lines that stage handles is sent — no media, no voice, no other stages.",
  },
  {
    item: "Cloud voice generation",
    what: "Target text and optional speaker reference for hosted TTS.",
    how: "Off by default. Enabled per project, per stage, in Settings.",
    plain:
      "Same idea for voicing. When you point the voice stage at a hosted TTS, Trackdub sends only what that provider needs — the target text and, if you chose to, a speaker reference — for the lines you queued.",
  },
  {
    item: "Telemetry",
    what: "Anonymous crash reports and usage counters.",
    how: "Disabled on install. Turn on in Preferences if you want to help.",
    plain:
      "Trackdub does not phone home unless you turn telemetry on. If you do, it is anonymous crash reports and coarse usage counters — never your media, script, or project names.",
  },
  {
    item: "Update checks",
    what: "App version and OS info to the update server.",
    how: "Checks on launch unless disabled. No media or project data is sent.",
    plain:
      "So Trackdub can tell you a new build exists, it asks the update server whether your version is current. That request contains your app version and OS — nothing about your projects.",
  },
];

function PrivacyPage() {
  return (
    <SiteShell>
      <Header />
      <Principles />
      <StoredLocally />
      <NeverLeaves />
      <OptIn />
      <Details />
      <Contact />
    </SiteShell>
  );
}

function Header() {
  return (
    <section className="border-b border-border">
      <Container className="py-20 sm:py-28">
        <SectionNumber n="00" label="Privacy policy" />
        <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[1.03] tracking-tight text-foreground sm:text-6xl">
          Your media is yours. This page says so in plain language.
        </h1>
        <p className="mt-8 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
          Trackdub is a desktop app. It runs on your machine, reads media from folders you point it
          at, and writes output to folders you choose. Nothing about your projects is uploaded
          unless you explicitly turn on a cloud stage.
        </p>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          This page is maintained by the Trackdub team to answer common questions about how the app
          handles your data. It mirrors the{" "}
          <a
            href="/#privacy"
            className="border-b border-foreground/30 pb-0.5 text-foreground hover:border-accent hover:text-accent"
          >
            Privacy &amp; retention
          </a>{" "}
          section on the main site with fuller explanations. It is not legal advice and it is not a
          certification of any kind.
        </p>
        <div className="mt-10 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Last updated · 2026-10-29
        </div>
      </Container>
    </section>
  );
}

function Principles() {
  const items: [string, string][] = [
    [
      "Local-first is the default",
      "The pipeline runs on your CPU or GPU. We do not need a server to dub a video, and we do not route your files through one to work.",
    ],
    [
      "No account required",
      "You do not sign up to use Trackdub. There is no user profile on our side because there is no server keeping one.",
    ],
    [
      "Opt-in, per project, per stage",
      "If you enable a cloud translation or cloud voice provider, it applies to the specific project and stage you turned it on for — not to the whole app.",
    ],
    [
      "Minimum data when you do opt in",
      "When a stage is cloud-backed, Trackdub sends only what that stage needs. Other stages, other lines, and your media stay local.",
    ],
    [
      "You control retention",
      "Everything Trackdub writes lives in folders you chose. Delete the folder, delete the data. There is no hidden mirror.",
    ],
    [
      "No training on your data",
      "Your media, transcripts, and voice references are not used to train shared models.",
    ],
  ];
  return (
    <section className="border-b border-border bg-surface/40">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow={<SectionNumber n="01" label="Principles" />}
          title="Six rules the whole product is built around."
        />
        <dl className="mt-14 grid gap-y-8 gap-x-12 md:grid-cols-2">
          {items.map(([term, def]) => (
            <div key={term} className="border-t border-border pt-5">
              <dt className="font-serif text-[22px] text-foreground">{term}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{def}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function StoredLocally() {
  return (
    <section className="border-b border-border">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow={<SectionNumber n="02" label="Stored locally" />}
          title="What Trackdub writes to your disk."
          lead="This is the exhaustive list. If it is not here, Trackdub is not writing it. The pieces that are here go to folders you pick."
          leadClassName="mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground"
        />

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="border-b border-border py-3 pr-4 font-normal">Data</th>
                <th className="border-b border-border py-3 pr-4 font-normal">What it is</th>
                <th className="border-b border-border py-3 font-normal">Retention</th>
              </tr>
            </thead>
            <tbody>
              {LOCAL.map((l) => (
                <tr key={l.item}>
                  <td className="border-b border-border py-4 pr-4 align-top font-serif text-[18px] text-foreground">
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

        <div className="mt-14 space-y-10">
          {LOCAL.map((l) => (
            <div
              key={l.item}
              className="grid gap-4 border-t border-border pt-6 md:grid-cols-[220px_1fr] md:gap-10"
            >
              <div className="font-serif text-[20px] leading-snug text-foreground">{l.item}</div>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{l.plain}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function NeverLeaves() {
  return (
    <section className="border-b border-border bg-surface/40">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow={<SectionNumber n="03" label="Never leaves the machine" />}
          title="Data the app will not transmit, period."
          lead={
            <>
              The following categories are never sent to Trackdub or to any third party by the
              default pipeline. Turning on a cloud stage does not change these categories. See{" "}
              <a
                href="#optin"
                className="border-b border-foreground/30 pb-0.5 text-foreground hover:border-accent hover:text-accent"
              >
                Opt-in only
              </a>{" "}
              for what an enabled cloud stage actually sends.
            </>
          }
          leadClassName="mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground"
        />

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          {NEVER.map((n) => (
            <div key={n.item} className="border-t border-border pt-6">
              <div className="font-serif text-[22px] text-foreground">{n.item}</div>
              <p className="mt-2 font-mono text-[12px] text-accent">{n.why}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{n.plain}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function OptIn() {
  return (
    <section id="optin" className="border-b border-border">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow={<SectionNumber n="04" label="Opt-in only" />}
          title="The four things you can turn on. Nothing else phones home."
          lead="Each is off out of the box. Turning one on is a deliberate choice you make in Preferences or per project, and turning it off stops the transmission on the next run."
          leadClassName="mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground"
        />

        <div className="mt-12 space-y-10">
          {OPTIN.map((o) => (
            <div
              key={o.item}
              className="grid gap-4 border-t border-border pt-6 md:grid-cols-[240px_1fr] md:gap-10"
            >
              <div>
                <div className="font-serif text-[22px] text-foreground">{o.item}</div>
                <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                  {o.how}
                </div>
              </div>
              <div>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{o.what}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground">{o.plain}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Details() {
  const items: [string, React.ReactNode][] = [
    [
      "Cookies and analytics on this website",
      "The trackdub.com marketing site does not set advertising cookies. We use Lovable Cloud to record website loading failures, slow-load retry screens, retry clicks, and recovery after a loading problem. Each record contains only an event type, a broad page category, elapsed loading time, a failure category, a server timestamp, and a random event ID for duplicate prevention. We do not include visitor identifiers, IP addresses, browser details, full URLs, search parameters, error messages, or your media. A small delivery queue in your browser stores at most 12 events for up to seven days if the connection fails, then tries again when the site opens or connectivity returns. Website reliability monitoring is separate from the desktop app’s opt-in telemetry.",
    ],
    [
      "Children",
      "Trackdub is a professional tool and is not directed at children under 13. We do not knowingly collect data from children.",
    ],
    [
      "Uninstalling",
      <>
        Your projects, source media, and generated output live in folders you chose, so they stay
        where they are until you delete them. The app data directory — model cache, preferences, and
        logs — can be removed during uninstall or manually from{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px] text-foreground">
          %LOCALAPPDATA%\Trackdub
        </code>{" "}
        on Windows.
      </>,
    ],
    [
      "Third parties",
      "Trackdub itself does not share your data with third parties. If you turn on a cloud translation or cloud voice provider, that provider receives the minimum data described above and handles it under their own terms — we recommend reviewing them before enabling the stage.",
    ],
    [
      "Changes to this policy",
      "When we change how Trackdub handles data, we will update this page and move the “Last updated” date. Material changes will be called out on the site.",
    ],
  ];
  return (
    <section className="border-b border-border bg-surface/40">
      <Container className="py-20 sm:py-28">
        <SectionHeading eyebrow={<SectionNumber n="05" label="Details" />} title="Housekeeping." />
        <dl className="mt-12">
          {items.map(([q, a], i) => (
            <div
              key={q}
              className={`grid gap-4 py-6 md:grid-cols-[240px_1fr] md:gap-10 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <dt className="font-serif text-[20px] leading-snug text-foreground">{q}</dt>
              <dd className="text-[16px] leading-relaxed text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function Contact() {
  return (
    <section className="border-b border-border">
      <Container className="py-20 text-center sm:py-28">
        <SectionNumber n="06" label="Contact" />
        <p className="mx-auto mt-6 max-w-2xl font-serif text-3xl leading-[1.15] tracking-tight text-foreground sm:text-4xl">
          Questions about how Trackdub handles a specific case?
        </p>
        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
          Write to{" "}
          <a
            href="mailto:privacy@trackdub.com"
            className="border-b border-foreground/40 pb-0.5 text-foreground hover:border-accent hover:text-accent"
          >
            privacy@trackdub.com
          </a>
          . We answer as the maintainers of the app, not as lawyers.
        </p>
      </Container>
    </section>
  );
}
