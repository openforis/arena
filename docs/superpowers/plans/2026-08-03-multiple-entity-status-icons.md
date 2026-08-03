# Multiple Entity Status Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instance-scoped child page icons, all-instance status on multiple parents, and per-instance icons in the entity dropdown (spec package 1+2+3).

**Architecture:** Extend `@openforis/arena-core` page validation with optional `scopeEntityUuid`; add entity-subtree and multiple-page aggregators. Arena resolves scope from `pagesUuidMap`, updates `useRecordTreeItemStatus`, and shows status icons in the multiple-entity selector via `Dropdown` (native `<option>` cannot host SVG icons).

**Tech Stack:** TypeScript (arena-core), React 18, Redux, existing `RecordPageStatusIcon`, `@webapp/components/form/Dropdown`

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-03-multiple-entity-status-icons-design.md`
- Package: building blocks **1 + 2 + 3** only (no tooltip / block 4)
- Icon priority everywhere: error → warning → complete → none
- Progress bar stays record-wide / unscoped
- No survey-specific entity names in copy
- Multiple parent: green only if **every** instance’s full subtree is complete
- Prefer arena-core APIs; temporarily link local core into Arena until published
- No `any` in TypeScript; JSDoc on exported functions
- Entry-mode status only (designer unchanged)

## File structure

| File | Responsibility |
|------|----------------|
| `arena-core/src/record/_records/recordPagesValidation.ts` | `scopeEntityUuid` on page status; entity subtree + multiple-page aggregators |
| `arena-core/src/record/_records/recordPagesValidation.test.ts` | Unit tests for scope / subtree / multiple aggregation |
| `arena-core/src/record/records.ts` | Re-export new APIs on `Records` |
| `arena/webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts` | Wire (1)+(2): scoped singles; all-instance multiples |
| `arena/webapp/store/ui/record/hooks/useEntitySubtreeStatus.ts` | **NEW** — status for one entity instance (dropdown + helpers) |
| `arena/webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityFormNodeSelect.js` | Per-option status icons via `Dropdown` |
| `arena/webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityForm.scss` | Layout tweaks if needed for icon+select |

---

### Task 1: arena-core — scoped page validation

**Files:**
- Modify: `/Users/andreaperozziello/Developer/work/FAO/openforis/arena-core/src/record/_records/recordPagesValidation.ts`
- Modify: `/Users/andreaperozziello/Developer/work/FAO/openforis/arena-core/src/record/_records/recordPagesValidation.test.ts`
- Modify: `/Users/andreaperozziello/Developer/work/FAO/openforis/arena-core/src/record/records.ts`

**Interfaces:**
- Produces: `getPageValidationStatus({ pageNodeDefUuid, descendantPageUuids?, record, scopeEntityUuid? })` — when `scopeEntityUuid` is set, only fields whose node (or children-count parent) is that entity or a descendant of it are counted. Unscoped behavior unchanged.

- [ ] **Step 1: Write failing tests** for two plot instances where only plot A’s nested page field errors; unscoped status has errors; scoped to plot B has no errors.

- [ ] **Step 2: Implement `nodeIsUnderScopeEntity` + thread `scopeEntityUuid` through `getOwnPageFieldValidationFlags` / children-count path / `getPageValidationStatus`.**

- [ ] **Step 3: Run** `yarn test src/record/_records/recordPagesValidation.test.ts` in arena-core — expect PASS.

- [ ] **Step 4: Commit** in arena-core: `feat(records): scope page validation to entity instance`

---

### Task 2: arena-core — entity subtree + multiple page status

**Files:**
- Modify: `recordPagesValidation.ts`, `records.ts`, tests (same as Task 1)

**Interfaces:**
- Produces:
  - `getEntitySubtreeStatus({ survey, record, entity, descendantPageUuids }) → { hasErrors, hasWarnings, isComplete }`
    - Validation: own page + each descendant page def, all with `scopeEntityUuid = entity.uuid`
    - Complete: `getEntityCompletionPercent === 100` and no errors/warnings
  - `getMultiplePageStatus({ survey, record, pageNodeDefUuid, descendantPageUuids }) → { hasErrors, hasWarnings, isComplete }`
    - For each instance of `pageNodeDefUuid`, run `getEntitySubtreeStatus`; aggregate any error/warning; `isComplete` only if every instance is complete and none have errors/warnings; zero instances → all false

- [ ] **Step 1: Failing tests** for subtree (one plot) and multiple aggregation (plot3 bad, plot4 good → multiple has errors, not complete).

- [ ] **Step 2: Implement + export on `Records`.**

- [ ] **Step 3: Tests PASS; commit** `feat(records): entity subtree and multiple page status`

---

### Task 3: Link local arena-core into Arena (dev)

**Files:**
- Modify: Arena `package.json` / `.yarnrc.yml` resolutions **or** document bump after publish

- [ ] **Step 1:** Build arena-core (`yarn build`).
- [ ] **Step 2:** Point Arena at local core via Yarn `portal:` / `link:` resolution on `@openforis/arena-core` (and ensure arena-server’s transitive dep resolves).
- [ ] **Step 3:** Confirm `Records.getEntitySubtreeStatus` / `getMultiplePageStatus` importable from webapp bundle context.
- [ ] **Step 4: Commit** Arena resolution only if team keeps local link; otherwise note “bump after core release” in PR and use portal for local verify.

---

### Task 4: Arena — tree status hook (1 + 2)

**Files:**
- Modify: `webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts`

**Interfaces:**
- Consumes: `Records.getPageValidationStatus` (with scope), `Records.getMultiplePageStatus`, existing `getPageEntity` / completion helpers
- Behavior:
  - If page def is **multiple** → `getMultiplePageStatus` (ignore expanded own-only)
  - Else → existing expanded/collapsed flow, but pass `scopeEntityUuid` from resolved page entity (or selected ancestor). If multiple ancestor unresolved → return empty status (no first-instance guess)

- [ ] **Step 1: Implement scope resolution helper** `resolveScopeEntityUuid(pageNodeDefUuid, state)` using `getPageEntity` / parent map rules from spec §6.
- [ ] **Step 2: Branch multiples to `getMultiplePageStatus`; pass scope into `evaluatePage`.
- [ ] **Step 3: Manual check Stefano scenario in UI (or unit if hook test harness exists).
- [ ] **Step 4: Commit** `fix(record-entry): instance-scope tree icons; all-instance multiples`

---

### Task 5: Arena — dropdown status icons (3)

**Files:**
- Create: `webapp/store/ui/record/hooks/useEntitySubtreeStatus.ts` (optional thin wrapper)
- Modify: `nodeDefEntityFormNodeSelect.js` (+ scss)
- Modify: hooks `index.js` exports if needed

**Interfaces:**
- For each node option: `Records.getEntitySubtreeStatus({ survey, record, entity: n, descendantPageUuids })`
- `descendantPageUuids`: from survey cycle via `Records.getDescendantPageNodeDefUuids` for the entity’s node def
- UI: replace native `<select>` with existing `Dropdown`, set `item.icon` to `<RecordPageStatusIcon ... />` (or `renderOptionLabel` with icon + label). Selected value shows icon too when `Dropdown` supports it; if not, icon beside control for selected only + icons in menu.

- [ ] **Step 1: Wire Dropdown + status per option** (entry context only; component already entry-only).
- [ ] **Step 2: Preserve add/delete/testIds behavior.**
- [ ] **Step 3: Manual verify dropdown Plot 3 red / Plot 4 green.**
- [ ] **Step 4: Commit** `feat(record-entry): status icons on multiple entity dropdown`

---

### Task 6: Spec self-check + cleanup

- [ ] Confirm progress bar still uses unscoped API.
- [ ] Confirm designer path unchanged.
- [ ] Update predecessor note if hook comments still say “expanded = own only” for all items.
- [ ] Final commit if comment/docs nits remain.

## Spec coverage

| Spec item | Task |
|-----------|------|
| (1) Child page = current instance | 1, 4 |
| (2) Multiple parent all-instances + strict green | 2, 4 |
| (3) Dropdown icons | 2, 5 |
| (4) Tooltip | Out of scope |
| Progress bar unchanged | 4 (do not touch) |
| Nested multiples / unresolved ancestor | 4 edge handling |
| arena-core home | 1–3 |

## Execution

User asked to proceed with implementation immediately after plan — prefer **inline execution** in this session (arena-core Tasks 1–2, then Arena 3–5).
