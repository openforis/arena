# Multiple Entity Status Icons — Design Spec

**Date:** 2026-08-03  
**Branch:** `feat/record-entry-ui-improvements`  
**Predecessor:** `docs/superpowers/specs/2026-07-30-record-entry-sidebar-status-design.md`  
**Package:** Building blocks **1 + 2 + 3** (no tooltip / building block 4)

---

## 1. Overview

Sidebar status icons are keyed by **page node definition**, not by entity instance. Validation for a page currently aggregates **all instances** in the record. Completion already uses the selected instance via `pagesUuidMap`. The mismatch makes a valid Plot 4 show a red “Land use and Tenure” icon because Plot 3 is invalid.

This spec defines instance-aware status for nested pages, cross-instance status on multiple parents, and per-instance icons in the multiple-entity dropdown — without hardcoding entity names like “Plot”.

---

## 2. Problem

| Symptom | Cause |
|---------|--------|
| Child page (e.g. Land use) stays red on every plot when one plot is invalid | `Records.getPageValidationStatus` matches by page def UUID across the whole record |
| Expanded multiple parent (Plot) can stay green while a nested page is red | Expanded items use **own-page only**; nested pages are excluded by design |
| User cannot see *which* instance is broken from the tree alone | One tree row per page type; no per-instance signal in the selector |

---

## 3. Decisions

| Topic | Choice |
|-------|--------|
| Delivery scope | **1 + 2 + 3** in one pass |
| Tooltip on parent (4) | **Out of scope** |
| Icon priority | Same everywhere: error → warning → complete → none |
| Child page icons | **Current instance** path (`pagesUuidMap`) |
| Multiple parent icons | **All instances**; green only if **every** instance’s **full subtree** is complete |
| Dropdown icons | Per option = that instance’s full subtree; same priority |
| Progress bar | Unchanged (**record-wide**) |
| Implementation home | Prefer **arena-core** APIs; Arena resolves scope from `pagesUuidMap` |
| Copy / i18n | No survey-specific “plot” strings in this pass (no new tooltip) |

---

## 4. UX rules

### 4.1 Summary

| UI | Scope | Meaning |
|----|--------|---------|
| Child page in tree (e.g. Land use) | Current instance path | Status of that page under selected ancestors |
| Multiple parent in tree (e.g. Plot), expanded **or** collapsed | All instances of that entity | Any error → error; else any warning → warning; else complete only if every instance’s full subtree is complete; else none |
| Single / non-multiple pages | Unchanged | Expanded = own page; collapsed = subtree rollup |
| Entity dropdown options | That instance (full subtree) | Same icon priority as tree |
| Progress bar | Record-wide | Unchanged |

### 4.2 Stefano scenario (acceptance picture)

Plot 3 Land use invalid, Plot 4 OK, Plot expanded, user on Plot 4:

- **Land use** → green (1)  
- **Plot** → red (2)  
- **Dropdown** → Plot 3 red, Plot 4 complete/ok as appropriate (3)

After fixing Plot 3, Plot turns green only when **all** plots’ subtrees are complete.

---

## 5. Architecture

### 5.1 Constraint

`@openforis/arena-core` is an external package. Instance scoping should live there so tree and dropdown share one rule. Delivery: **arena-core PR + release** → Arena dependency bump → webapp wiring.

If core lag blocks Arena, a thin Arena-local helper with the **same signatures** may bridge temporarily, then move to core. Target state is core.

### 5.2 API family (conceptual)

| Capability | Inputs | Consumers |
|------------|--------|-----------|
| **Page status (scoped)** | `pageNodeDefUuid`, optional `scopeEntityUuid`, `descendantPageUuids` | Tree child / single pages (1). Node must belong to the page **and** lie under `scopeEntityUuid` in the hierarchy when scope is set. |
| **Entity subtree status** | `entityUuid` (+ survey/record as needed for completion) | Dropdown options (3); building block for (2) |
| **Multiple parent status** | Multiple page’s `pageNodeDefUuid` | For each record instance of that def, compute subtree status (own page + descendant pages under that instance); aggregate across instances as in §4.1 |
| **Unscoped page status** | Existing `getPageValidationStatus` | Progress bar only (unchanged) |

Prefer **one optional `scopeEntityUuid`** over passing full `pagesUuidMap` into core. Arena resolves the scope entity from `pagesUuidMap` before calling core.

### 5.3 Webapp wiring

1. **`useRecordTreeItemStatus`**
   - If page node def is **multiple** → all-instances aggregation (**2**), for both expanded and collapsed (do **not** use expanded = own-only for multiples).
   - Else if expanded → own page, **scoped** to current instance path (**1**).
   - Else collapsed → rollup descendants; each page eval **scoped** to current path (**1**).

2. **`nodeDefEntityFormNodeSelect`**
   - For each option, compute entity subtree status for that node UUID.
   - Render the same status icon component / priority as the tree (`RecordPageStatusIcon` or shared primitive).

3. **No new tooltip** in this pass.

### 5.4 Complexity control

- Reuse existing icon component and priority; do not fork icon rules.
- No special-case strings per entity name.
- Single scoping primitive (`scopeEntityUuid`) reused by tree and dropdown.

---

## 6. Edge cases

| Case | Behavior |
|------|----------|
| Unvisited child page (missing from `pagesUuidMap`) | Resolve scope via selected ancestor when possible (same spirit as today’s `getPageEntity`). If a **multiple** ancestor cannot be resolved, do **not** guess the first instance — show **none**. |
| Multiple parent with 0 instances | Icon **none** (unless own children-count validation applies). |
| Nested multiples (e.g. Tree under Plot) | Child icons scoped to nearest resolved ancestor on the path. Tree dropdown = instances under the **currently selected** Plot. Plot’s all-instance rollup includes errors under every plot’s nested multiples. |
| Single entities | Unchanged (no all-instance special case). |
| Designer / non-entry | Unchanged (entry-only status suffixes). |
| Warnings | Same priority as tree everywhere. |

---

## 7. Out of scope

- Tooltip on multiple parent (building block 4)
- Changing progress-bar semantics to instance scope
- Redesigning the entity dropdown beyond status icons
- Survey-specific or hard-coded entity names in copy

---

## 8. Test plan

### Manual

1. Stefano scenario: Plot 3 invalid Land use, Plot 4 valid → on Plot 4: Land use green, Plot red; dropdown Plot 3 red / Plot 4 ok.  
2. Fix Plot 3 → Plot green only when all plots’ subtrees are complete.  
3. Expanded and collapsed Plot both reflect all-instance aggregation.  
4. Single entity page still own-only when expanded.  
5. Nested multiple (if available): switch parent; child dropdown/icons follow selection.  
6. Unresolved multiple ancestor → child page shows no false sibling icon.

### Unit (arena-core)

1. Scoped page validation ignores other instances’ nodes.  
2. Entity subtree status aggregates descendant pages under one entity UUID.  
3. Multiple-parent aggregation: any error wins; complete requires all instances’ subtrees complete.

---

## 9. Predecessor relationship

The 2026-07-30 sidebar status spec defined **expanded = own page** / **collapsed = rollup** for all tree items. This spec **amends** that rule for **multiple** page entities only: they always use all-instance subtree aggregation. Single entities keep the 2026-07-30 behavior.
