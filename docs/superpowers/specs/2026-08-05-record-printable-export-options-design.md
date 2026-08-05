# Record Printable Export Options — Design Spec

**Date:** 2026-08-05  
**Branch:** `feat/record-printable-export-options` (from `master`)  
**Reference:** https://trello.com/c/Sg5rV9qc  
**Repos:** `arena` (UI + thin API) and sibling `arena-server` (document generation)

---

## 1. Overview

Augment record printable export (PDF and DOCX) so users can export either the full record or only the currently viewed entity page, with paper orientation driven primarily by **designer-authored Print props on entity node defs**, and a modal **document default** orientation as fallback.

Today both record PDF and Word downloads are direct (`ButtonDownload` → blob) with no options. Generation is portrait A4 only and always walks the full survey tree from the root (`SurveyDocWalker.walkSurvey` in `@openforis/arena-server`).

---

## 2. Scope

### In scope

| Area | What |
|------|------|
| Record data-entry UI | Shared printable-export modal opened from PDF and Word header buttons |
| Export scope | Full survey **or** Current page only |
| Document default orientation | Portrait / Landscape chosen in the modal |
| Entity Print props | Per-entity print orientation in a new **Print** tab of the node def editor |
| Orientation resolution | Refined A (see §4) |
| Formats | PDF **and** DOCX parity |
| arena-server | Extend `SurveyDocOptions`, walker, PDF and DOCX generators |
| Arena backend | Pass new query params through `exportRecordDocument` |

### Out of scope (v1)

- Survey designer Advanced-menu PDF/DOCX buttons (remain direct download)
- Entity picker dropdown in the modal (always uses active form page)
- Persisting last modal choices (session / localStorage)
- Print props beyond orientation (page breaks, margins, etc.) — tab may grow later
- “Force all sections to this orientation” override
- Non-experimental feature flag change (buttons stay behind `experimentalFeatures`)

### Defaults when modal opens

- **Scope:** Current page only  
- **Orientation (document default):** Portrait  
- **Format:** whichever button was clicked (PDF or Word)

---

## 3. Architecture

**Approach:** Extend the shared survey-doc pipeline (Approach 1), not a PDF-only fork or client-side print capture.

```
Record form header (PDF | Word)
        │
        ▼
RecordPrintableExportModal
  format · scope · document default orientation
        │
        ▼
GET /api/survey/:surveyId/record/:recordUuid/export/{pdf|docx}
  ?lang&exportScope&entityDefUuid&entityNodeUuid&orientation
        │
        ▼
exportRecordDocument → arena-server generateSurveyPdf | generateSurveyDocx
        │
        ▼
walkSurvey(options)  →  elements + name
        │
        ▼
PDF (pdfkit) / DOCX (docx) with resolved per-section orientation
```

**Reuse:**

- Modal shell pattern from `RecordsDataExportModal`
- Shared `exportRecordDocument` in `recordService.js` for both formats
- Shared `SurveyDocWalker` for PDF and DOCX
- Form context: `useNodeDefPage()`, `usePagesUuidMap()` for current entity + instance

---

## 4. Orientation rules (refined A)

Designer Print props are the source of truth for each entity. The modal orientation is the **document default** for this download.

| Situation | Orientation used |
|-----------|------------------|
| Full survey, entity has Print orientation set | That entity’s prop (sections may differ) |
| Full survey, entity prop unset | Modal document default |
| Current page, entity has Print orientation set | That entity’s prop |
| Current page, entity prop unset | Modal document default |
| Root / no entity context | Modal document default |

**Rationale:** Aligns with designer intent (Stefano): some entities/sections print landscape (e.g. tabular), others portrait (e.g. official forms). CAR’s “whole document landscape” case is covered when entities leave the prop unset and the user picks landscape as document default.

**When orientation can change mid-document:** only at **print section boundaries** — the export root (current-page export) and each child entity that has its **own form page**. Nested entities rendered on a parent page inherit that section’s orientation (their `printOrientation` does not flip layout mid-parent).

---

## 5. Entity Print props + designer UI

### Storage

- Bucket: entity **basic props** (`nodeDef.props`), not cycle layout and not `propsAdvanced`
- Key: `printOrientation`
- Values: `'portrait' | 'landscape' | undefined` (`undefined` / unset = inherit document default)
- No DB migration (existing JSONB `props` column)

### Domain model

- **arena-core:** add optional `printOrientation` on `NodeDefEntityProps`
- **Arena `core/survey/nodeDef.js`:** add `propKeys.printOrientation` + getter (e.g. `getPrintOrientation`)
- Persist via existing `Actions.setProp` / `NodeDef.assocProp`

### Editor UI

- New tab **Print** in `NodeDefDetails.js` for entities (mirror Mobile App tab registration)
- New component `PrintProps.js` (or `.tsx`) under `webapp/components/survey/NodeDefDetails/`
- v1 control: select — Portrait / Landscape / Default (inherit document)
- i18n: `nodeDefEdit.print` (+ option labels)
- TestId: `nodeDefDetails.print`

---

## 6. Current page export semantics

When `exportScope === 'currentPage'`:

1. Resolve `entityDef` from `entityDefUuid` and `entityNode` from `entityNodeUuid` on the record.
2. **Document title** = entity label in the export language (not survey label). No survey description subtitle.
3. Walk **only** same-page content for that entity instance (`walkEntityChildren` for that node).
4. **Do not** recurse into child entities that have their own form page (`entityDefsInOwnPage`).
5. Export **only the currently open instance** (not all multiples of that entity type).

When `exportScope === 'full'` (or omitted): existing full-tree behavior from root; survey label as title; each entity section uses orientation resolution from §4.

---

## 7. Arena frontend

### Modal

- Component: `RecordPrintableExportModal` (near form entry actions / SurveyForm components)
- Pattern: `Modal` + options + primary Download (like `RecordsDataExportModal`)
- Options:
  1. **Format** — PDF / Word (pre-selected from clicked button)
  2. **Scope** — Full survey / Current page only; when Current page, show read-only hint with entity label
  3. **Orientation** — Portrait / Landscape icon toggle (document default)

### `formEntryActions.js`

- PDF and Word buttons: `onClick` opens modal with `initialFormat`; remove direct `href` downloads.

### Client context for Current page

- `entityDefUuid` ← `NodeDef.getUuid(useNodeDefPage())`
- `entityNodeUuid` ← `usePagesUuidMap()[entityDefUuid]`; if missing, resolve the sole instance from the record (same fallback as form navigation)

### API URL builders

Update `getRecordPdfExportUrl` / `getRecordDocxExportUrl` in `webapp/service/api/data/index.js` to accept and serialize:

- `exportScope`, `entityDefUuid`, `entityNodeUuid`, `orientation`, `lang`

### i18n

Keys under `surveyForm:` (e.g. `printableExport.title`, `scope.full`, `scope.currentPage`, `orientation.portrait`, `orientation.landscape`) plus `nodeDefEdit.print*`.

---

## 8. Arena backend

### Endpoints

Both remain:

- `GET /api/survey/:surveyId/record/:recordUuid/export/pdf`
- `GET /api/survey/:surveyId/record/:recordUuid/export/docx`

### Query parameters

| Param | Values | Default | Notes |
|-------|--------|---------|-------|
| `lang` | language code | survey default | existing |
| `exportScope` | `full` \| `currentPage` | `full` | omit = today’s full export |
| `entityDefUuid` | UUID | — | required when `currentPage` |
| `entityNodeUuid` | UUID | — | required when `currentPage` |
| `orientation` | `portrait` \| `landscape` | `portrait` | document default |

### Service

`exportRecordDocument` in `recordService.js` reads params and passes them into the generator options (`SurveyDocOptions`).

### Validation

- `exportScope=currentPage` without valid UUIDs → `400`
- Entity def or entity node not found on the survey/record → `404`

### Filename

- Full: existing `RecordForm` naming
- Current page: include entity label (e.g. survey name + entity label + extension)

### Backward compatibility

Omitting new params preserves today’s behavior: full survey, portrait.

---

## 9. arena-server changes

### `SurveyDocOptions` (`docExport/types.ts`)

```ts
exportScope?: 'full' | 'currentPage' // default: 'full'
entityDefUuid?: string
entityNodeUuid?: string
orientation?: 'portrait' | 'landscape' // document default; default: 'portrait'
```

Entity Print orientation is read from the loaded survey’s node def props during the walk (not passed as a separate API field).

### `SurveyDocWalker`

- Full: start at root; title = survey label (unchanged structure).
- Current page: start at given entity def + node; title = entity label; skip own-page child entities.
- When rendering each entity section in a full export, resolve orientation (entity `printOrientation` → else options.orientation) and signal orientation changes to the renderer/generator (section break / new page).

### `SurveyPdfGenerator`

- Document default: pdfkit `size: 'A4'` + `layout: 'landscape'` when needed.
- Per-section: add pages with the resolved layout when orientation changes; recompute content width for landscape.

### `SurveyDocxGenerator`

- Document default: section `page.size.orientation`.
- Per-section: additional DOCX sections when orientation changes mid-document.

### Release

Bump published `@openforis/arena-server` and update Arena `package.json` dependency after arena-server changes land.

---

## 10. Error handling & edge cases

| Case | Behavior |
|------|----------|
| Missing/invalid UUIDs for current page | `400`; client must not send incomplete current-page requests |
| Entity or node not in survey/record | `404` |
| Root entity, current page | Export root same-page content; title = root label |
| Single-instance entity, no pages map entry | Client resolves the one instance before request |
| `experimentalFeatures` off | Buttons remain hidden |
| Entity printOrientation unset | Use modal document default |
| Old clients / omitted params | Full survey, portrait |

---

## 11. Testing

### arena-server

- Walker: full vs current-page scope; title; exclusion of own-page children; single instance
- Orientation: document default; per-entity prop override; mid-document orientation change for PDF and DOCX

### Arena

- URL builders serialize new params
- Node def Print tab saves `printOrientation`
- Optional e2e (experimental on): open modal → download with current page

---

## 12. Implementation order (suggested)

1. arena-core / Arena domain: `printOrientation` prop + Print tab UI  
2. arena-server: options + walker scope + orientation in PDF/DOCX → publish bump  
3. Arena API + `exportRecordDocument` pass-through  
4. Record printable export modal + wire form entry buttons  
5. Tests + i18n  

---

## 13. Decisions log

| Decision | Choice |
|----------|--------|
| Scope UI | Full vs Current page toggle (no entity picker) |
| Entry point | Record data-entry PDF/Word only |
| Current page content | Same-page only; entity label as title; current instance only |
| Modal defaults | Current page + Portrait + clicked format |
| Formats | PDF + DOCX via one shared modal |
| Orientation model | Refined A: entity Print prop → else modal document default |
| Print props location | Entity node def props + Print tab in node def editor |
| Generation changes | In `@openforis/arena-server` (not Arena-only workaround) |
| Branch | `feat/record-printable-export-options` from `master` |
