# MCQuest Designer

A visual graph editor for designing [FTB Quests](https://www.curseforge.com/minecraft/mc-mods/ftb-quests) questbooks outside Minecraft. Design, version, and export quest structures to SNBT files for direct modpack import.

## Quick Start

```bash
# Clone and install
git clone https://github.com/DeadshotOMEGA/mcquest_designer.git
cd mcquest_designer
pnpm install

# Set up environment (see Environment Setup below)
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Clerk and database credentials

# Run database migrations
pnpm --filter web prisma migrate dev

# Start development server
pnpm dev
```

## Features

- **Visual Quest Editor** — Drag-and-drop graph interface powered by React Flow
- **Chapter Organization** — Group quests into chapters with dedicated canvases
- **Quest Inspector** — Edit tasks, rewards, dependencies, and metadata
- **Autosave & Versioning** — Never lose work; restore previous versions anytime
- **SNBT Export** — Generate FTB Quests-compatible files in a downloadable ZIP
- **Shareable Links** — Read-only project sharing for collaboration
- **OAuth Authentication** — Sign in with GitHub, Discord, or Google via Clerk

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Frontend      | Next.js 15 (App Router), React 19, TypeScript |
| Graph Editor  | React Flow                                  |
| State         | Zustand (editor), TanStack Query (server)   |
| UI Components | shadcn/ui, Tailwind CSS 4                   |
| Backend       | Next.js Route Handlers                      |
| Database      | Prisma + Neon PostgreSQL                    |
| Auth          | Clerk                                       |
| Build         | Turborepo, pnpm workspaces                  |
| Testing       | Vitest, Playwright                          |

## Project Structure

```
mcquest_designer/
├── apps/
│   └── web/              # Next.js frontend + API routes
├── packages/
│   ├── schema/           # Shared Zod schemas (ProjectSnapshot)
│   └── export/           # SNBT compiler and exporter
├── docs/
│   ├── planning/         # Project plan, milestones
│   ├── architecture/     # Technical architecture docs
│   └── reference/        # API, schema, validation docs
└── testdata/
    └── ftbq/1.21/        # Golden export test fixtures
```

## Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 10.x (`corepack enable && corepack prepare pnpm@10.0.0 --activate`)
- **PostgreSQL** database (we recommend [Neon](https://neon.tech) for serverless)
- **Clerk** account for authentication ([dashboard.clerk.com](https://dashboard.clerk.com))

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Configure required variables in `.env.local`:
   ```bash
   # Clerk Authentication (from dashboard.clerk.com)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_WEBHOOK_SECRET=whsec_...

   # Database (Neon PostgreSQL)
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   ```

3. Run database migrations:
   ```bash
   pnpm --filter web prisma migrate dev
   ```

## Development

```bash
# Start dev server (all packages)
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format code
pnpm format

# Build all packages
pnpm build
```

## Development Status

| Milestone | Status | Progress |
| --------- | ------ | -------- |
| [M1 - Foundation](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/1) | Nearly Complete | 16/17 issues |
| [M2 - Editor](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/2) | Planned | 0/20 issues |
| [M3 - Versioning](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/3) | Planned | 0/8 issues |
| [M4 - Export](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/4) | Planned | 0/14 issues |
| [M5 - Sharing](https://github.com/DeadshotOMEGA/mcquest_designer/milestone/5) | Planned | 0/6 issues |

**M1 Foundation** includes: Clerk authentication, project CRUD, Prisma database setup, API routes, and dashboard UI.

## Documentation

- [Project Plan](docs/planning/project-plan.md) — Full architecture and scope
- [Internal Schema](docs/reference/01_INTERNAL_PROJECT_SCHEMA.md) — ProjectSnapshot data model
- [API Endpoints](docs/reference/03_API_ENDPOINTS.md) — REST API reference
- [Export Pipeline](docs/architecture/06_SNBT_EXPORT_PIPELINE.md) — Snapshot → SNBT flow
- [Git Workflow](docs/contributing/git-workflow.md) — Git Flow branching strategy

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

_Built with Claude Code_
