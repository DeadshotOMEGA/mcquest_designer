# 80_security_and_abuse_prevention.md — Security & Abuse Prevention

This project will accept untrusted user input (snapshots, text, share tokens). These guardrails keep the platform safe and stable.

---

## 1) Authentication & session safety

- Use secure cookies, HTTPS-only in production.
- Use CSRF protection where applicable.
- Never log OAuth access tokens.

---

## 2) Authorization (RBAC)

- Every project route must enforce membership:
  - OWNER/EDITOR can write
  - VIEWER can read
- Share tokens are read-only by default.

### Share token requirements
- Tokens must be long, unguessable (>= 128-bit entropy).
- Allow revocation.
- Optionally allow expiry.

---

## 3) Input validation

All inbound data is untrusted:

- Parse with Zod at boundaries.
- Reject oversized payloads.
- Validate IDs exist and relationships are consistent.

### Snapshot limits (recommended defaults)
- Max chapters: 200
- Max quests: 10,000 (or lower initially)
- Max dependencies: 50,000
- Max description length: 20,000 chars

Tune these based on observed usage.

---

## 4) Export abuse prevention

Exports are compute-heavy and a common abuse vector.

### Rate limiting
- Per-user export rate limit (e.g., 10/min)
- Per-project export rate limit (e.g., 30/min)
- Burst handling and backoff

### Export size limits
- Cap ZIP size (e.g., 50–200MB) to prevent runaway builds.
- Cap number of files produced.

### Async job model (when needed)
- For large questbooks, run export as a queued job.
- Store job status, progress, and result link.

---

## 5) Injection safety

### SNBT / serialization
- Never build SNBT via string concatenation from raw user input without escaping.
- Ensure proper string escaping for quotes and backslashes.

### Command rewards
Command rewards are user-authored strings. Treat them as data:
- Escape safely in SNBT
- Do not interpret/execute commands server-side

---

## 6) Content safety

Users may paste arbitrary text in quest descriptions.

- Sanitize HTML if you ever render as HTML.
- Prefer rendering as plain text or markdown with safe renderer.

---

## 7) Logging & privacy

- Avoid logging full snapshots in production.
- Log:
  - projectId
  - versionId
  - exportTarget
  - error codes

If you need deep debugging, add opt-in “diagnostic export” with explicit user consent.

---

## 8) Dependency hygiene

- Lock dependency versions.
- Use automated dependency scanning (Dependabot).
- Avoid unmaintained SNBT parsers; prefer minimal, audited code.

