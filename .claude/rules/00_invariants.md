# 00_invariants.md — Project Invariants (Must Not Break)

These are **hard rules**. If a requested change violates one, stop and escalate.

## A) Snapshot-first architecture
1. The internal **ProjectSnapshot** is the *only* source of truth.
2. SNBT is an **output artifact**, never the internal design format.
3. No feature may require editing SNBT directly in the UI as the primary workflow.

## B) Deterministic exports
1. Same snapshot ⇒ same export outputs (byte-identical if normalized).
2. Export ordering must be stable.
3. ID mapping must be deterministic and test-covered.

## C) Version targeting
1. We target **Minecraft 1.21.x** first.
2. Any additional version support must be isolated and tested with golden exports.

## D) No texture pipeline
1. Do not download, render, or bundle mod textures.
2. Icons are references (e.g., item IDs) only.

## E) Safety & maintainability
1. Shared schemas (Zod) remain the contract between FE/BE.
2. Validation errors should be structured and user-actionable.
3. Large exports must not block the UI; prefer job-based export when needed.
