# 30_testing_golden_exports.md — Golden Exports & Test Strategy

## 1) What a golden export is
A golden export is a verbatim copy of `config/ftbquests/quests/` produced by a real 1.21.x Minecraft instance with FTB Quests.

## 2) Why we use it
- FTB Quests is external and evolving.
- Golden exports anchor our compiler output to reality.
- Prevent regressions when refactoring exporter code.

## 3) Primary vs secondary goldens
- **Primary golden:** a small “micro questbook” created by maintainers (fast CI).
- **Secondary benchmark:** a large real pack (optional; may be local-only to avoid licensing issues).

## 4) Required tests
### 4.1 Structure tests
- File set matches expected layout.
- Required directories exist.

### 4.2 Semantic tests
- Dependencies preserved.
- Layout preserved.
- Supported task/reward types render correctly in-game.

### 4.3 Determinism tests
- Export twice, compare outputs.

## 5) How to update goldens
- Update only when:
  - FTB Quests version changes intentionally, or
  - We intentionally change mapping for correctness.
- Document why the golden changed in the commit message.
