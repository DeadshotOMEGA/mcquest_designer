# MCQuest Designer

A visual graph editor for designing [FTB Quests](https://www.curseforge.com/minecraft/mc-mods/ftb-quests) questbooks outside Minecraft. Design, version, and export quest structures to SNBT files for direct modpack import.

## Features

- **Visual Quest Editor** — Drag-and-drop graph interface powered by React Flow
- **Chapter Organization** — Group quests into chapters with dedicated canvases
- **Quest Inspector** — Edit tasks, rewards, dependencies, and metadata
- **Autosave & Versioning** — Never lose work; restore previous versions anytime
- **SNBT Export** — Generate FTB Quests-compatible files in a downloadable ZIP
- **Shareable Links** — Read-only project sharing for collaboration
- **OAuth Authentication** — Sign in with GitHub, Discord, or Google

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Graph Editor | React Flow |
| State | Zustand (editor), TanStack Query (server) |
| UI Components | shadcn/ui, Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | Prisma + Neon PostgreSQL |
| Auth | Clerk |
| Testing | Vitest, Playwright |

## Project Structure

```
mcquest_designer/
├── apps/
│   └── web/              # Next.js frontend + API routes
├── packages/
│   ├── schema/           # Shared Zod schemas (ProjectSnapshot)
│   └── export/           # SNBT compiler and exporter
├── testdata/
│   └── ftbq/1.21/        # Golden export test fixtures
├── docs/
│   ├── planning/         # Project plan, milestones
│   ├── architecture/     # Technical architecture docs
│   └── reference/        # API, schema, validation docs
└── scripts/              # Utility scripts
```

## Getting Started

> **Note:** Project scaffolding is in progress. See [Milestones](https://github.com/DeadshotOMEGA/mcquest_designer/milestones) for current status.

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm --filter web prisma migrate dev

# Start development server
pnpm --filter web dev

# Run tests
pnpm test

# Build all packages
pnpm build
```

## Development Status

This project is actively under development.

| Milestone | Status | Issues |
|-----------|--------|--------|
| [M1 - Foundation](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/1) | In Progress | Auth, Project CRUD, Prisma setup |
| [M2 - Editor](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/2) | Planned | React Flow, Inspector, Autosave |
| [M3 - Versioning](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/3) | Planned | Version creation, restore |
| [M4 - Export](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/4) | Planned | SNBT compiler, ZIP packaging |
| [M5 - Sharing](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/5) | Planned | Share tokens, read-only mode |

View all [65 implementation tasks](https://github.com/DeadshotOMEGA/mcquest_designer/issues).

## Documentation

- [Project Plan](docs/planning/project-plan.md) — Full architecture and scope
- [Implementation Roadmap](docs/plans/mcquest_designer-implementation-roadmap/plan.md) — Detailed task breakdown
- [Internal Schema](docs/reference/01_INTERNAL_PROJECT_SCHEMA.md) — ProjectSnapshot data model
- [Export Pipeline](docs/architecture/06_SNBT_EXPORT_PIPELINE.md) — Snapshot → SNBT flow

## Target Compatibility

- **Minecraft:** 1.21.x
- **FTB Quests:** Latest for 1.21.x

## Non-Goals (v1)

- Custom image/texture uploads
- Full FTB Quests task/reward type parity
- Real-time collaborative editing
- In-game integration or live syncing

## Contributing

This is currently a solo project. Contributions may be accepted in the future.

## License

TBD

---

*Built with Claude Code*
