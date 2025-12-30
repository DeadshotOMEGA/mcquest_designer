# 60_backend_rules.md — Backend Guardrails

## 1) Validate all inputs
- Parse snapshot with shared Zod schemas.
- Reject invalid snapshots with clear errors.

## 2) Authorization
- Enforce ProjectMember roles on every route.
- Share tokens are read-only unless explicitly extended.

## 3) Export execution
- For small exports: synchronous is acceptable.
- For large exports: prefer async job pattern.

## 4) Observability
- Log export failures with enough context to reproduce (projectId, versionId, exportTarget).
- Do not log sensitive OAuth tokens.
