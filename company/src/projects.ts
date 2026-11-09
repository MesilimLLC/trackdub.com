export const projects = [
  {
    slug: "linml",
    name: "LinML",
    number: "01",
    category: "Inference",
    mark: "λ",
    headline: "Run ONNX models on Linux.",
    summary:
      "An independent Linux-first inference stack, started to give Trackdub a WinML-like experience on Linux.",
    source: "https://github.com/mesalimllc/LinML",
    docs: "https://github.com/mesalimllc/LinML#readme",
    secondary: "https://github.com/mesalimllc/LinML#readme",
    secondaryLabel: "Releases & documentation",
    audience: "ML and systems developers",
    interface: "CLI / Python / NuGet",
    core: "Contracts / policy / provider catalog / runtime adapter",
    status: "Prototype · v0.6.0",
    introduction:
      "LinML began as a Trackdub engineering need: our take on bringing the WinML developer experience to Linux. It is an independent implementation on ONNX Runtime, not a Microsoft port. The project separates shared contracts (`LinML.Contracts`), selection rules (`LinML.Policy`), plugin staging (`LinML.Catalog`), and native ONNX Runtime sessions (`LinML.Runtime.Onnx`). That gives developers a place to inspect device readiness and make provider choices before inference, then examine runtime diagnostics when execution differs from expectation.",
    capabilities: [
      "List available execution providers and diagnose readiness for the current machine.",
      "Select providers through explicit policies and inspect runtime or fallback diagnostics.",
      "Use the CLI, Python client, or .NET libraries to inspect models, run inference, benchmark, and serve persistent sessions.",
      "Stage plugin execution providers through LinML.Catalog with SHA-256 integrity checks and runtime registration.",
    ],
    diagram: [
      "ONNX model + request",
      "Provider inventory + readiness",
      "Explicit policy + runtime session",
      "Results + diagnostics",
    ],
    tags: ["Linux x64 / ARM64", "ONNX Runtime 1.31.x", "CLI / Python / .NET"],
    limitations:
      "LinML is a prototype and an independent project, not a Microsoft product. Provider availability depends on architecture, runtime and driver prerequisites, and specific hardware. Some catalogued providers remain unverified; use the repository’s compatibility report for current evidence.",
    ecosystem: [],
  },
  {
    slug: "numan",
    name: "Numan",
    number: "02",
    category: "Nushell",
    mark: "nu",
    headline: "Manage your Nushell packages.",
    summary:
      "A Rust package manager for Nushell with a signed registry, verified plugin artifacts, lockfiles, and explicit activation.",
    source: "https://github.com/numan-cli/numan",
    docs: "https://github.com/numan-cli/numan#readme",
    secondary: "https://numan-cli.github.io/numan-registry/",
    secondaryLabel: "Browse the live registry",
    audience: "Nushell users and plugin authors",
    interface: "Rust CLI / registry / lockfile",
    core: "Signed JSON index / hash-pinned artifacts",
    status: "Early stage",
    introduction:
      "Numan treats trust, installation, and activation as separate steps. It verifies the official registry index with a built-in Ed25519 trust root, checks plugin binaries against SHA-256 hashes, and locks package version, payload hash, and origin. Installation leaves Nushell state untouched until a user explicitly activates supported packages; hook profiles require a separate opt-in.",
    capabilities: [
      "Resolve packages against operating system, architecture, libc, and declared Nushell compatibility.",
      "Verify signed registry indexes and hash-pinned plugin binaries before install.",
      "Record immutable install state in a lockfile and recover interrupted lifecycle changes with journals and snapshots.",
      "Exercise core workflows against real Nushell in Linux, macOS, and Windows CI; publish prebuilt releases.",
    ],
    diagram: [
      "Official signed registry",
      "Platform + Nushell resolution",
      "Verified payload + lockfile",
      "Explicit activation",
    ],
    tags: ["Ed25519 index", "SHA-256 artifacts", "Reproducible lockfile", "Opt-in activation"],
    limitations:
      "Numan is early-stage. Scripts and completion packages are install-only today; plugins and modules require explicit activation, and hook profiles require separate enabling. Package compatibility and support tiers can change; consult the current repository and registry before relying on a package.",
    ecosystem: [
      {
        name: "Official registry source",
        href: "https://github.com/numan-cli/numan-registry",
        detail:
          "Curated catalog, schema checks, compatibility data, and protected production signing.",
      },
      {
        name: "Plugin build pipeline",
        href: "https://github.com/numan-cli/numan-plugins",
        detail:
          "Cross-compiles selected source-only plugins from pinned upstream commits into release artifacts.",
      },
      {
        name: "Live package registry",
        href: "https://numan-cli.github.io/numan-registry/",
        detail:
          "Published catalog consumed by Numan clients; the signed JSON index is the machine input.",
      },
    ],
  },
  {
    slug: "lucid-mem",
    name: "lucid-mem",
    number: "03",
    category: "Agent memory",
    mark: "mem",
    headline: "Carry context across coding sessions.",
    summary:
      "Local-first, Git-backed memory for 15 AI coding agent hosts, with deterministic retrieval and a measured save loop.",
    source: "https://github.com/tonythethompson/lucid-mem",
    docs: "https://github.com/tonythethompson/lucid-mem#readme",
    secondary: "https://www.npmjs.com/package/lucid-mem",
    secondaryLabel: "View the npm package",
    audience: "Teams using AI coding agents",
    interface: "CLI / hooks / rules / MCP",
    core: "Zero-dependency Node CLI / Git storage",
    status: "Pre-1.0",
    introduction:
      "At session start, `amr context` assembles a ranked, bounded digest without calling a model in the read path. Agents can save durable knowledge to a Git repository; background reflection can propose missed learnings for review. Maintenance and coverage tools help keep the memory useful and inspect whether important signals were saved.",
    capabilities: [
      "Wire one memory repository into 15 agent hosts through hooks where available, and rules or MCP where they are not.",
      "Rank context by memory type, recency, and recorded use under a configurable size budget.",
      "Use stable entry IDs, expiry, archive, and Git history to review and correct stored knowledge.",
      "Run `amr coverage` to replay transcripts, surface missed durable signals, and report a save rate.",
    ],
    diagram: [
      "Ranked context at session start",
      "Agent saves durable signals",
      "Git history + reviewable maintenance",
      "Coverage checks for missed signals",
    ],
    tags: ["15 agent hosts", "Local-first Git", "MCP + host hooks", "No hosted service"],
    limitations:
      "lucid-mem is pre-1.0. Saving still depends on agent judgment, and host support varies. Reflection and triage use an installed agent CLI and consume its quota; team memory is an early read-only Git workflow, not a hosted collaboration service. Memory tools do not guarantee perfect recall or automatically protect every secret.",
    ecosystem: [],
  },
] as const;

export type Project = (typeof projects)[number];
