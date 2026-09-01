# Record Printable Export Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let record data-entry users export PDF/DOCX for the full record or the current entity page, with orientation from entity Print props (refined A) and a modal document default.

**Architecture:** Extend the shared survey-doc pipeline in `@openforis/arena-server` (`SurveyDocOptions` + `walkSurvey` returning orientation **sections**, PDF/DOCX generators). Arena adds a TypeScript printable-export modal, typed URL builders, API query-param pass-through, and a NodeDef **Print** tab for `printOrientation`. Designer survey-export buttons stay unchanged.

**Tech Stack:** TypeScript, React 18, MUI (`sx`, icons, RadioGroup), pdfkit, docx, Jest, `@openforis/arena-core`, `@openforis/arena-server`, Express

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-05-record-printable-export-options-design.md`
- Branches:
  - **Arena:** `feat/record-printable-export-options` (already created from `master`)
  - **arena-server:** create `feat/record-printable-export-options` from `origin/master` in sibling `../arena-server`
  - **arena-core:** create `feat/node-def-print-orientation` from `origin/master` in sibling `../arena-core` (additive types only)
- **New Arena UI files:** `.ts` / `.tsx` only; **no new `.scss` / `.css`**; style with MUI `sx` + `webapp/theme/tokens.ts`
- Legacy JS patches OK: `formEntryActions.js`, `NodeDefDetails.js`, `recordApi.js`, `recordService.js`, `nodeDef.js`
- Record PDF/Word buttons stay behind `experimentalFeatures`
- Orientation resolution (refined A): entity `printOrientation` → else modal/document `orientation`
- Mid-document orientation changes only at **print section boundaries** (export root; entities with own form page)
- Current page: same-page children only; title = entity label; current instance only
- Modal defaults: Current page + Portrait + format from clicked button
- Backward compatible: omit new query params → full survey, portrait
- No `any` in new TypeScript; JSDoc on exported Arena functions where required by ESLint
- Do not convert whole legacy modules to TS in this plan

## File structure

| File | Responsibility |
|------|----------------|
| `../arena-core/src/nodeDef/types/entity.ts` | Optional `printOrientation` on `NodeDefEntityProps` |
| `../arena-core/src/nodeDef/nodeDefs.ts` | `getPrintOrientation` helper |
| Arena `core/survey/nodeDef.js` | `propKeys.printOrientation` + `getPrintOrientation` |
| Arena `webapp/components/survey/NodeDefDetails/PrintProps.tsx` | **NEW** — Print tab UI |
| Arena `webapp/components/survey/NodeDefDetails/NodeDefDetails.js` | Register Print tab for entities |
| `../arena-server/src/service/survey/docExport/types.ts` | Export scope, UUIDs, document orientation; section types |
| `../arena-server/src/service/survey/docExport/printOrientation.ts` | **NEW** — resolve orientation helper |
| `../arena-server/src/service/survey/docExport/SurveyDocWalker.ts` | Current-page walk + sectioned full walk |
| `../arena-server/src/service/survey/pdfExport/SurveyPdfGenerator.ts` | Landscape + multi-section PDF |
| `../arena-server/src/service/survey/docxExport/SurveyDocxGenerator.ts` | Landscape + multi-section DOCX |
| `../arena-server/src/service/survey/docExport/SurveyDocWalker.test.ts` | **NEW** — walker unit tests |
| Arena `server/modules/record/api/recordApi.js` | Read new query params |
| Arena `server/modules/record/service/recordService.js` | Validate + pass options; filename with entity label |
| Arena `webapp/service/api/data/recordPrintableExportUrl.ts` | **NEW** — typed URL builders |
| Arena `webapp/service/api/data/index.js` | Re-export URL builders |
| Arena `webapp/components/survey/SurveyForm/components/RecordPrintableExportModal.tsx` | **NEW** — options modal |
| Arena `webapp/components/survey/SurveyForm/components/formEntryActions.js` | Open modal instead of direct download |
| Arena i18n `surveyForm.js` + `common.js` (en + other langs as needed) | Modal + Print tab strings |
| Arena `webapp/utils/testId/index.js` | `nodeDefDetails.print` |
| Arena `test/unit/tests/040recordPrintableExportUrl.test.js` | **NEW** — URL builder tests |

---

### Task 1: arena-core — `printOrientation` on entity props

**Repo:** `../arena-core`  
**Branch:** `feat/node-def-print-orientation` (from `origin/master`)

**Files:**
- Modify: `src/nodeDef/types/entity.ts`
- Modify: `src/nodeDef/nodeDefs.ts`
- Modify: export surface if getters are re-exported from `src/nodeDef/index.ts` / `src/index.ts` (follow existing `isEnumerate` pattern)

**Interfaces:**
- Consumes: `NodeDefEntityProps`, `NodeDefEntity`
- Produces:
  - `printOrientation?: 'portrait' | 'landscape'` on `NodeDefEntityProps`
  - `NodeDefs.getPrintOrientation(nodeDef: NodeDefEntity): 'portrait' | 'landscape' | undefined`

- [ ] **Step 1: Add type + getter**

In `src/nodeDef/types/entity.ts`:

```typescript
export type NodeDefPrintOrientation = 'portrait' | 'landscape'

export interface NodeDefEntityProps extends NodeDefPropsWithLayout<NodeDefEntityLayout> {
  enumerate?: boolean
  /** When set, printable export uses this orientation for the entity’s print section. */
  printOrientation?: NodeDefPrintOrientation
}
```

In `src/nodeDef/nodeDefs.ts` (near `isEnumerate`):

```typescript
const getPrintOrientation = (nodeDef: NodeDefEntity): NodeDefPrintOrientation | undefined =>
  nodeDef.props.printOrientation

// export on NodeDefs object alongside isEnumerate
```

Export `NodeDefPrintOrientation` from the public package entry if other types from `entity.ts` are exported.

- [ ] **Step 2: Build and commit**

```bash
yarn build
git add src/nodeDef/types/entity.ts src/nodeDef/nodeDefs.ts src/nodeDef/index.ts src/index.ts
git commit -m "$(cat <<'EOF'
feat(nodeDef): add entity printOrientation prop

Allow surveys to declare per-entity printable orientation for Arena doc export.

EOF
)"
```

- [ ] **Step 3: Publish or local link**

Publish a new arena-core version **or** temporarily `yarn link` into arena-server for Tasks 4–7. Prefer publish when ready; Arena can consume via the arena-server bump later.

---

### Task 2: Arena domain — prop key, getter, TestId, Print i18n

**Repo:** Arena (`feat/record-printable-export-options`)

**Files:**
- Modify: `core/survey/nodeDef.js`
- Modify: `webapp/utils/testId/index.js`
- Modify: `core/i18n/resources/en/common.js` (and other languages: at least add English keys; mirror `mobileApp` key presence in es/fr/pt/ru/mn)

**Interfaces:**
- Consumes: existing `propKeys` / `getProp` pattern
- Produces: `NodeDef.propKeys.printOrientation`, `NodeDef.getPrintOrientation(nodeDef)`, `TestId.nodeDefDetails.print`, i18n `nodeDefEdit.print` + `nodeDefEdit.printProps.*`

- [ ] **Step 1: Add prop key and getter**

In `core/survey/nodeDef.js` `propKeys`:

```javascript
printOrientation: 'printOrientation',
```

Near other getters:

```javascript
/**
 * Returns the entity printable orientation, if set.
 *
 * @param {!object} nodeDef - Entity node definition.
 * @returns {string|undefined} 'portrait' | 'landscape' | undefined.
 */
export const getPrintOrientation = getProp(propKeys.printOrientation)
```

- [ ] **Step 2: TestId + English i18n**

In `webapp/utils/testId/index.js` under `nodeDefDetails`:

```javascript
print: 'print',
```

In `core/i18n/resources/en/common.js` under `nodeDefEdit` (next to `mobileApp`):

```javascript
print: 'Print',
printProps: {
  printOrientation: {
    label: 'Page orientation',
    info: 'Orientation used when this entity starts its own printable section. Default inherits the document orientation chosen at export.',
  },
  orientations: {
    default: 'Default (document)',
    portrait: 'Portrait',
    landscape: 'Landscape',
  },
},
```

Add `print: 'Print'` (or translated equivalent) in other `common.js` locales next to `mobileApp`.

- [ ] **Step 3: Commit**

```bash
git add core/survey/nodeDef.js webapp/utils/testId/index.js core/i18n/resources/*/common.js
git commit -m "$(cat <<'EOF'
feat(nodeDef): add printOrientation prop key and Print i18n

EOF
)"
```

---

### Task 3: Arena — `PrintProps.tsx` + NodeDefDetails tab

**Files:**
- Create: `webapp/components/survey/NodeDefDetails/PrintProps.tsx`
- Modify: `webapp/components/survey/NodeDefDetails/NodeDefDetails.js`

**Interfaces:**
- Consumes: `State`, `Actions.setProp`, `NodeDef.propKeys.printOrientation`, `NodeDef.getPrintOrientation`, `NodeDef.isEntity`
- Produces: Print tab visible for entity node defs (including root if desired — **show for all entities**, root included, so root can set orientation)

- [ ] **Step 1: Create `PrintProps.tsx`**

```tsx
import React, { useMemo } from 'react'
import { Box } from '@mui/material'

import * as NodeDef from '@core/survey/nodeDef'

import { FormItem } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { State, useNodeDefEditReadOnly } from './store'

type PrintPropsProps = {
  state: unknown
  Actions: { setProp: (args: { state: unknown; key: string; value: string | null }) => void }
}

const ORIENTATION_DEFAULT = ''

export const PrintProps = (props: PrintPropsProps) => {
  const { state, Actions } = props
  const i18n = useI18n()
  const readOnlyLocked = useNodeDefEditReadOnly()
  const canEditSurvey = useAuthCanEditSurvey()
  const readOnly = readOnlyLocked || !canEditSurvey

  const nodeDef = State.getNodeDef(state)
  const value = NodeDef.getPrintOrientation(nodeDef) ?? ORIENTATION_DEFAULT

  const items = useMemo(
    () => [
      { value: ORIENTATION_DEFAULT, label: i18n.t('nodeDefEdit.printProps.orientations.default') },
      { value: 'portrait', label: i18n.t('nodeDefEdit.printProps.orientations.portrait') },
      { value: 'landscape', label: i18n.t('nodeDefEdit.printProps.orientations.landscape') },
    ],
    [i18n]
  )

  return (
    <Box className="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      <FormItem label="nodeDefEdit.printProps.printOrientation.label" info="nodeDefEdit.printProps.printOrientation.info">
        <Dropdown
          disabled={readOnly}
          items={items}
          selection={items.find((item) => item.value === value) ?? items[0]}
          onChange={(item) =>
            Actions.setProp({
              state,
              key: NodeDef.propKeys.printOrientation,
              value: item?.value ? item.value : null,
            })
          }
        />
      </FormItem>
    </Box>
  )
}
```

**Note:** Match the actual `Dropdown` / `FormItem` APIs used in nearby NodeDefDetails components (e.g. `BasicProps`). If `Dropdown` item shape differs, mirror an existing select in `BasicProps` / `AdvancedProps` exactly — do not invent a new select pattern. Prefer existing Arena form controls over raw MUI Select unless Dropdown is awkward for empty/default.

- [ ] **Step 2: Register tab in `NodeDefDetails.js`**

Import `PrintProps`. Inside `useMemo` tabs builder, after Advanced (and before or after Mobile App), when `NodeDef.isEntity(nodeDef)`:

```javascript
if (NodeDef.isEntity(nodeDef)) {
  _tabs.push({
    label: 'nodeDefEdit.print',
    component: PrintProps,
    id: TestId.nodeDefDetails.print,
    props: tabProps,
  })
}
```

Include root entities (Print orientation for root section). Update `useMemo` dependency array accordingly.

- [ ] **Step 3: Manual check + commit**

Open designer → entity → Print tab → set Landscape → save → reload → value persists.

```bash
git add webapp/components/survey/NodeDefDetails/PrintProps.tsx webapp/components/survey/NodeDefDetails/NodeDefDetails.js
git commit -m "$(cat <<'EOF'
feat(designer): add entity Print tab for printOrientation

EOF
)"
```

---

### Task 4: arena-server — options, orientation helper, sectioned walker

**Repo:** `../arena-server`  
**Branch:** `feat/record-printable-export-options` from `origin/master`

**Files:**
- Modify: `src/service/survey/docExport/types.ts`
- Create: `src/service/survey/docExport/printOrientation.ts`
- Modify: `src/service/survey/docExport/SurveyDocWalker.ts`
- Modify: `src/service/survey/docExport/index.ts` (export new types/helpers)

**Interfaces:**
- Consumes: `Survey`, `NodeDefEntity`, `Records`, `Surveys`, `NodeDefs` from arena-core
- Produces:

```typescript
export type PrintOrientation = 'portrait' | 'landscape'
export type SurveyDocExportScope = 'full' | 'currentPage'

export interface SurveyDocOptions {
  // ...existing fields...
  exportScope?: SurveyDocExportScope // default 'full'
  entityDefUuid?: string
  entityNodeUuid?: string
  orientation?: PrintOrientation // document default; default 'portrait'
}

export interface SurveyDocSection<T> {
  orientation: PrintOrientation
  elements: T[]
}

export const resolvePrintOrientation = (
  entityDef: NodeDefEntity | undefined,
  documentDefault: PrintOrientation
): PrintOrientation => entityDef?.props.printOrientation ?? documentDefault

export const walkSurvey = async <T>(
  options: SurveyDocOptions,
  renderer: SurveyDocRenderer<T>
): Promise<{ sections: SurveyDocSection<T>[]; surveyName: string }>
```

- [ ] **Step 1: Extend types + helper**

Update `types.ts` with the new optional fields. Create `printOrientation.ts` with `resolvePrintOrientation` and default `'portrait'`.

- [ ] **Step 2: Refactor `walkSurvey` to return sections**

Behavior:

1. `documentDefault = options.orientation ?? 'portrait'`
2. If `exportScope === 'currentPage'`:
   - Require `entityDefUuid` + `entityNodeUuid` (throw `Error` with clear message if missing — Arena maps to HTTP)
   - Resolve entity def + node; title = entity label
   - `orientation = resolvePrintOrientation(entityDef, documentDefault)`
   - Elements: `renderTitle(entityLabel, false)` + `walkEntityChildren(..., entityNode, { includeOwnPageEntities: false })`
   - Return single section `{ orientation, elements }`
3. If full (default):
   - Start with survey title/subtitle as today
   - Build sections: accumulate elements under current orientation; when entering an **own-page** child entity, if `resolvePrintOrientation(child, documentDefault)` differs from current, push completed section and start a new one
   - Root section orientation = `resolvePrintOrientation(rootDef, documentDefault)`

Add optional param to `walkEntityChildren`:

```typescript
includeOwnPageEntities?: boolean // default true
```

When `false`, skip the final `entityDefsInOwnPage` loop (current-page semantics).

For full export own-page recursion: instead of blindly appending child elements into the same array, either:

- Lift own-page walking into `walkSurvey` / a section builder that can split sections, **or**
- Have `walkEntityChildren` accept an `onOwnPageEntity` callback that returns elements for that entity after the parent decides section boundaries

Prefer a small internal `SectionBuilder<T>` in `SurveyDocWalker.ts`:

```typescript
class SectionBuilder<T> {
  private sections: SurveyDocSection<T>[] = []
  private current: SurveyDocSection<T>
  constructor(initial: PrintOrientation) {
    this.current = { orientation: initial, elements: [] }
  }
  push(...els: T[]) { this.current.elements.push(...els) }
  ensureOrientation(next: PrintOrientation) {
    if (next === this.current.orientation) return
    if (this.current.elements.length > 0) this.sections.push(this.current)
    this.current = { orientation: next, elements: [] }
  }
  finish() {
    if (this.current.elements.length > 0) this.sections.push(this.current)
    return this.sections
  }
}
```

- [ ] **Step 3: Temporary generator compile fix**

Until Tasks 5–6, update PDF/DOCX generators minimally so the package builds:

```typescript
const { sections, surveyName } = await walkSurvey(options, renderer)
const elements = sections.flatMap((s) => s.elements)
// use sections[0]?.orientation ?? 'portrait' for page setup in Task 5/6
```

Commit walker + types first if generators are updated in the same commit as Tasks 5–6 — **preferred: combine Steps 2–3 with Task 5 in one commit if splitting causes a red build**. Practical approach: implement Tasks 4+5+6 in one logical PR on arena-server, but keep checklist order.

- [ ] **Step 4: Commit** (after generators updated — see Tasks 5–6)

```bash
git commit -m "$(cat <<'EOF'
feat(docExport): scoped walk and print orientation sections

Support current-page export and per-entity print orientation for PDF/DOCX.

EOF
)"
```

---

### Task 5: arena-server — PDF generator orientation

**Files:**
- Modify: `src/service/survey/pdfExport/SurveyPdfGenerator.ts`

**Interfaces:**
- Consumes: `walkSurvey` → `sections`
- Produces: PDF buffer using A4 portrait/landscape per section

- [ ] **Step 1: Dynamic page size + content width**

Replace hardcoded `PAGE_WIDTH` / `CONTENT_WIDTH` usage with helpers:

```typescript
const A4_PORTRAIT: [number, number] = [595.28, 841.89]
const A4_LANDSCAPE: [number, number] = [841.89, 595.28]

const pageSizeFor = (orientation: PrintOrientation): [number, number] =>
  orientation === 'landscape' ? A4_LANDSCAPE : A4_PORTRAIT

const contentWidthOf = (doc: PDFKit.PDFDocument): number =>
  doc.page.width - doc.page.margins.left - doc.page.margins.right
```

Pass `contentWidthOf(doc)` into serializers that currently use `CONTENT_WIDTH`.

- [ ] **Step 2: Create document from first section; add pages on orientation change**

```typescript
const sections = (await walkSurvey(options, renderer)).sections
const firstOrientation = sections[0]?.orientation ?? options.orientation ?? 'portrait'

const doc = new PDFDocument({
  size: pageSizeFor(firstOrientation),
  margins: { top: topMargin, bottom: bottomMargin, left: MARGIN, right: MARGIN },
  bufferPages: pageNumbering,
  autoFirstPage: true,
})

for (let i = 0; i < sections.length; i++) {
  const section = sections[i]
  if (i > 0) {
    doc.addPage({ size: pageSizeFor(section.orientation), margins: { ... } })
  }
  serializeElements(doc, section.elements)
}
```

Ensure header/footer decorations and page numbers still work with `bufferPages` across mixed sizes (verify manually with one landscape entity).

- [ ] **Step 3: Commit** (with Task 4/6 as needed)

---

### Task 6: arena-server — DOCX generator orientation

**Files:**
- Modify: `src/service/survey/docxExport/SurveyDocxGenerator.ts`

**Interfaces:**
- Consumes: `walkSurvey` → `sections`; `docx` `PageOrientation` / page size
- Produces: multi-section Document when orientations differ

- [ ] **Step 1: Map sections to DOCX sections**

```typescript
import { ..., PageNumber, /* PageOrientation if available */ } from 'docx'

const { sections: docSections, surveyName } = await walkSurvey(options, renderer)

const doc = new Document({
  styles: { /* unchanged */ },
  sections: docSections.map((section, index) => ({
    properties: {
      page: {
        size: {
          orientation: section.orientation === 'landscape' ? 'landscape' : 'portrait',
        },
        margin: {
          top: DOCX_BASE_MARGIN_TWIPS + (index === 0 || !headerOnFirstPageOnly ? headerMarginTwips : 0),
          bottom: DOCX_BASE_MARGIN_TWIPS + footerMarginTwips,
          left: 1080,
          right: 1080,
        },
      },
      ...(pageNumbering && index === 0 ? { titlePage: true } : {}),
    },
    headers: /* reuse existing header config as appropriate */,
    footers: /* reuse existing footer config */,
    children:
      index === 0 && headerImage && headerOnFirstPageOnly
        ? [buildDocxImageParagraph(headerImage, DOCX_MARGIN_GAP_TWIPS), ...section.elements]
        : section.elements,
  })),
})
```

Verify `docx` v9 API for `page.size.orientation` (string `'landscape' | 'portrait'` vs enum) against installed types — use the typed enum if present.

- [ ] **Step 2: Commit arena-server walker + PDF + DOCX together**

```bash
git add src/service/survey/docExport src/service/survey/pdfExport src/service/survey/docxExport
git commit -m "$(cat <<'EOF'
feat(docExport): current-page scope and print orientation for PDF/DOCX

EOF
)"
```

---

### Task 7: arena-server — walker unit tests + release

**Files:**
- Create: `src/service/survey/docExport/SurveyDocWalker.test.ts`

**Interfaces:**
- Consumes: `SurveyBuilder` / `RecordBuilder` from `@openforis/arena-core`, a minimal mock `SurveyDocRenderer<string>` that returns label strings

- [ ] **Step 1: Write failing tests**

Use arena-core test builders (exported from package). Example cases:

1. **Full export default:** one section, portrait (or document default), title = survey label  
2. **Current page:** title = entity label; elements exclude own-page child entity content  
3. **Entity printOrientation landscape** on own-page child → second section landscape when document default is portrait  
4. **Current page uses entity prop** over document default  

Mock renderer sketch:

```typescript
const stringRenderer: SurveyDocRenderer<string> = {
  renderTitle: (text) => [`TITLE:${text}`],
  renderSubtitle: (text) => [`SUB:${text}`],
  renderEntityHeading: (text) => [`H:${text}`],
  renderEntityInstanceHeading: (text) => [`IH:${text}`],
  renderAttribute: async ({ nodeDef }) => [`A:${nodeDef.props.name}`],
  renderGridTable: () => [],
  renderEntityTable: () => [],
}
```

Build a tiny survey: root `cluster` + own-page multiple `plot` with `printOrientation: 'landscape'`.

- [ ] **Step 2: Run tests**

```bash
yarn test
```

Expected: new tests PASS; existing suite green.

- [ ] **Step 3: Publish arena-server and bump Arena**

Publish new `@openforis/arena-server` (e.g. `1.3.28+`). In Arena:

```bash
yarn add @openforis/arena-server@<published-version>
git add package.json yarn.lock
git commit -m "$(cat <<'EOF'
chore(deps): bump arena-server for printable export options

EOF
)"
```

For local iteration before publish: `yarn link` / portal from `../arena-server` (do not commit a portal path).

---

### Task 8: Arena API + `exportRecordDocument` pass-through

**Files:**
- Modify: `server/modules/record/api/recordApi.js` (~L411–L430)
- Modify: `server/modules/record/service/recordService.js` (`exportRecordDocument`, `exportRecordPdf`, `exportRecordDocx`)
- Modify: `core/i18n/resources/en/appErrors.js` (and en validation/app error keys as needed)

**Interfaces:**
- Consumes: query params `exportScope`, `entityDefUuid`, `entityNodeUuid`, `orientation`, `lang`
- Produces: generator called with those fields; HTTP 400/404 via `SystemError`

- [ ] **Step 1: API handlers**

```javascript
const { surveyId, recordUuid, lang, exportScope, entityDefUuid, entityNodeUuid, orientation } = Request.getParams(req)

await RecordService.exportRecordPdf({
  user,
  surveyId,
  recordUuid,
  lang,
  exportScope,
  entityDefUuid,
  entityNodeUuid,
  orientation,
  outputStream: res,
})
```

Same for DOCX.

- [ ] **Step 2: Service validation + pass-through**

In `exportRecordDocument`, accept the new fields (defaults: `exportScope = 'full'`, `orientation = 'portrait'`).

After loading survey + record:

```javascript
import SystemError, { StatusCodes } from '@core/systemError'
import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'

if (exportScope === 'currentPage') {
  if (!entityDefUuid || !entityNodeUuid) {
    throw new SystemError('appErrors:recordPrintableExport.missingEntityParams', {}, StatusCodes.BAD_REQUEST)
  }
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const entityNode = Record.getNodeByUuid(entityNodeUuid)(record)
  if (!entityDef || !NodeDef.isEntity(entityDef) || !entityNode) {
    throw new SystemError('appErrors:recordPrintableExport.entityNotFound', {}, StatusCodes.NOT_FOUND)
  }
}
```

Pass into `generator({ ..., exportScope, entityDefUuid, entityNodeUuid, orientation })`.

Filename when current page:

```javascript
const entityLabel = NodeDef.getLabel(entityDef, langToUse) || NodeDef.getName(entityDef)
const fileName = ExportFileNameGenerator.generate({
  surveyName,
  cycle,
  itemName: entityLabel,
  fileType: 'RecordForm',
  extension,
})
```

Add i18n keys under `appErrors.recordPrintableExport.*` in English (and stubs elsewhere if required by i18n loading).

- [ ] **Step 3: Commit**

```bash
git add server/modules/record/api/recordApi.js server/modules/record/service/recordService.js core/i18n/resources/*/appErrors.js
git commit -m "$(cat <<'EOF'
feat(record): pass printable export scope and orientation to generators

EOF
)"
```

---

### Task 9: Arena — typed URL builders + unit test

**Files:**
- Create: `webapp/service/api/data/recordPrintableExportUrl.ts`
- Modify: `webapp/service/api/data/index.js` (re-export; remove old inline URL helpers or delegate to TS module)
- Create: `test/unit/tests/040recordPrintableExportUrl.test.js`

**Interfaces:**

```typescript
export type PrintableExportFormat = 'pdf' | 'docx'
export type PrintableExportScope = 'full' | 'currentPage'
export type PrintOrientation = 'portrait' | 'landscape'

export type RecordPrintableExportUrlParams = {
  surveyId: number | string
  recordUuid: string
  lang: string
  format: PrintableExportFormat
  exportScope?: PrintableExportScope
  entityDefUuid?: string
  entityNodeUuid?: string
  orientation?: PrintOrientation
}

export const getRecordPrintableExportUrl = (params: RecordPrintableExportUrlParams): string
export const getRecordPdfExportUrl = (params: Omit<RecordPrintableExportUrlParams, 'format'>): string
export const getRecordDocxExportUrl = (params: Omit<RecordPrintableExportUrlParams, 'format'>): string
```

- [ ] **Step 1: Write failing unit test**

```javascript
import { getRecordPrintableExportUrl } from '@webapp/service/api/data/recordPrintableExportUrl'

describe('getRecordPrintableExportUrl', () => {
  test('includes scope, entity, and orientation query params', () => {
    const url = getRecordPrintableExportUrl({
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: 'pdf',
      exportScope: 'currentPage',
      entityDefUuid: 'def-1',
      entityNodeUuid: 'node-1',
      orientation: 'landscape',
    })
    expect(url).toContain('/api/survey/1/record/rec-1/export/pdf?')
    expect(url).toContain('exportScope=currentPage')
    expect(url).toContain('entityDefUuid=def-1')
    expect(url).toContain('entityNodeUuid=node-1')
    expect(url).toContain('orientation=landscape')
    expect(url).toContain('lang=en')
  })

  test('omits entity params for full export', () => {
    const url = getRecordPrintableExportUrl({
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: 'docx',
      exportScope: 'full',
      orientation: 'portrait',
    })
    expect(url).toContain('/export/docx?')
    expect(url).toContain('exportScope=full')
    expect(url).not.toContain('entityDefUuid')
  })
})
```

- [ ] **Step 2: Implement URL module**

```typescript
export const getRecordPrintableExportUrl = ({
  surveyId,
  recordUuid,
  lang,
  format,
  exportScope = 'full',
  entityDefUuid,
  entityNodeUuid,
  orientation = 'portrait',
}: RecordPrintableExportUrlParams): string => {
  const query = new URLSearchParams({ lang, exportScope, orientation })
  if (exportScope === 'currentPage') {
    if (entityDefUuid) query.set('entityDefUuid', entityDefUuid)
    if (entityNodeUuid) query.set('entityNodeUuid', entityNodeUuid)
  }
  return `/api/survey/${surveyId}/record/${recordUuid}/export/${format}?${query}`
}
```

Wire `index.js` exports to this module (keep same export names used by the app).

- [ ] **Step 3: Run unit test + commit**

```bash
yarn test:unit
# or the project’s single-file unit path after build:test:unit
```

```bash
git add webapp/service/api/data/recordPrintableExportUrl.ts webapp/service/api/data/index.js test/unit/tests/040recordPrintableExportUrl.test.js
git commit -m "$(cat <<'EOF'
feat(api): typed record printable export URL builders

EOF
)"
```

---

### Task 10: Arena — `RecordPrintableExportModal` + form entry wiring

**Files:**
- Create: `webapp/components/survey/SurveyForm/components/RecordPrintableExportModal.tsx`
- Modify: `webapp/components/survey/SurveyForm/components/formEntryActions.js`
- Modify: `core/i18n/resources/en/surveyForm.js` (+ other langs for new keys)

**Interfaces:**
- Consumes: `useNodeDefPage`, `usePagesUuidMap`, `useRecord`, `useSurveyId`, `useSurveyPreferredLang`, `getRecordPrintableExportUrl`, Arena `Modal` / `Button` / `RadioButtonGroup` / `ButtonDownload`
- Produces: modal opened from PDF/Word icons; download with resolved params

- [ ] **Step 1: Add i18n keys** (`en/surveyForm.js`)

```javascript
printableExport: {
  title: 'Export printable document',
  format: 'Format',
  formats: {
    pdf: 'PDF',
    docx: 'Word',
  },
  scope: 'Content',
  scopes: {
    full: 'Full survey',
    currentPage: 'Current page only',
  },
  currentPageHint: 'Current page: {{entityLabel}}',
  orientation: 'Page orientation',
  orientations: {
    portrait: 'Portrait',
    landscape: 'Landscape',
  },
  download: 'Download',
},
```

- [ ] **Step 2: Implement modal (no SCSS file)**

```tsx
import React, { useMemo, useState } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import CropPortraitIcon from '@mui/icons-material/CropPortrait'
import CropLandscapeIcon from '@mui/icons-material/CropLandscape'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { Button, ButtonDownload } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'
import { RadioButtonGroup } from '@webapp/components/RadioButtonGroup'
import { useI18n } from '@webapp/store/system'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useNodeDefPage, usePagesUuidMap } from '@webapp/store/ui/surveyForm'
import { useRecord } from '@webapp/store/ui/record'
import { getRecordPrintableExportUrl } from '@webapp/service/api/data/recordPrintableExportUrl'

export type PrintableExportFormat = 'pdf' | 'docx'

type Props = {
  open: boolean
  initialFormat: PrintableExportFormat
  onClose: () => void
}

export const RecordPrintableExportModal = ({ open, initialFormat, onClose }: Props) => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()
  const record = useRecord()
  const nodeDefPage = useNodeDefPage()
  const pagesUuidMap = usePagesUuidMap()

  const [format, setFormat] = useState<PrintableExportFormat>(initialFormat)
  const [exportScope, setExportScope] = useState<'full' | 'currentPage'>('currentPage')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  const entityDefUuid = NodeDef.getUuid(nodeDefPage)
  const entityLabel = NodeDef.getLabel(nodeDefPage, lang) || NodeDef.getName(nodeDefPage)

  const entityNodeUuid = useMemo(() => {
    const mapped = pagesUuidMap?.[entityDefUuid]
    if (mapped) return mapped
    if (!record) return null
    const nodes = Record.getNodesByDefUuid(entityDefUuid)(record)
    return nodes.length === 1 ? Node.getUuid(nodes[0]) : Node.getUuid(nodes[0]) // prefer sole instance; if multiple and map missing, use first only as last resort — better: require map
  }, [entityDefUuid, pagesUuidMap, record])

  const href = useMemo(() => {
    if (!record) return null
    return getRecordPrintableExportUrl({
      surveyId,
      recordUuid: Record.getUuid(record),
      lang,
      format,
      exportScope,
      orientation,
      ...(exportScope === 'currentPage'
        ? { entityDefUuid, entityNodeUuid: entityNodeUuid ?? undefined }
        : {}),
    })
  }, [surveyId, record, lang, format, exportScope, orientation, entityDefUuid, entityNodeUuid])

  if (!open) return null

  const canDownload = exportScope === 'full' || Boolean(entityDefUuid && entityNodeUuid)

  return (
    <Modal onClose={onClose} title="surveyForm:printableExport.title">
      <ModalBody>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormItem label="surveyForm:printableExport.format">
            <RadioButtonGroup
              row
              value={format}
              onChange={setFormat}
              items={[
                { key: 'pdf', label: 'surveyForm:printableExport.formats.pdf' },
                { key: 'docx', label: 'surveyForm:printableExport.formats.docx' },
              ]}
            />
          </FormItem>
          <FormItem label="surveyForm:printableExport.scope">
            <RadioButtonGroup
              row
              value={exportScope}
              onChange={setExportScope}
              items={[
                { key: 'full', label: 'surveyForm:printableExport.scopes.full' },
                { key: 'currentPage', label: 'surveyForm:printableExport.scopes.currentPage' },
              ]}
            />
            {exportScope === 'currentPage' && (
              <Box sx={{ mt: 1, typography: 'body2', color: 'text.secondary' }}>
                {i18n.t('surveyForm:printableExport.currentPageHint', { entityLabel })}
              </Box>
            )}
          </FormItem>
          <FormItem label="surveyForm:printableExport.orientation">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={i18n.t('surveyForm:printableExport.orientations.portrait')}>
                <IconButton
                  color={orientation === 'portrait' ? 'primary' : 'default'}
                  onClick={() => setOrientation('portrait')}
                  aria-label={i18n.t('surveyForm:printableExport.orientations.portrait')}
                >
                  <CropPortraitIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={i18n.t('surveyForm:printableExport.orientations.landscape')}>
                <IconButton
                  color={orientation === 'landscape' ? 'primary' : 'default'}
                  onClick={() => setOrientation('landscape')}
                  aria-label={i18n.t('surveyForm:printableExport.orientations.landscape')}
                >
                  <CropLandscapeIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </FormItem>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button label="common.cancel" onClick={onClose} variant="text" />
        <ButtonDownload
          disabled={!canDownload || !href}
          href={href}
          label="surveyForm:printableExport.download"
          onClick={() => {
            onClose()
          }}
        />
      </ModalFooter>
    </Modal>
  )
}
```

**Adjust** to match real `Modal` / `ModalFooter` / `Dropdown` / `Record.getNodesByDefUuid` APIs in this repo (names may differ slightly — inspect before coding). For multiple entities with missing `pagesUuidMap` entry, disable Download and show hint rather than guessing the wrong instance.

Reset `format` when `initialFormat` changes (`useEffect`).

- [ ] **Step 3: Wire `formEntryActions.js`**

Replace direct `ButtonDownload` `href`s with buttons that open the modal:

```javascript
const [printableExport, setPrintableExport] = useState({ open: false, format: 'pdf' })

// PDF button
<Button
  iconClassName="icon-file-pdf"
  onClick={() => setPrintableExport({ open: true, format: 'pdf' })}
  showLabel={false}
  title="surveyForm:downloadPrintableDocumentPdf"
  variant="text"
/>
// Word similarly with format: 'docx'

{printableExport.open && (
  <RecordPrintableExportModal
    open
    initialFormat={printableExport.format}
    onClose={() => setPrintableExport((s) => ({ ...s, open: false }))}
  />
)}
```

Keep `experimentalFeatures` gate. Prefer existing `Button` API used in this file (props may be `label` vs children — match neighbors).

- [ ] **Step 4: Manual QA + commit**

Checklist:
1. Experimental on → click PDF → modal defaults Current page + Portrait + PDF  
2. Download current page → file titled/named with entity label  
3. Full survey + landscape default → whole doc landscape when entities unset  
4. Entity Print = landscape, modal portrait, full export → that entity’s section landscape  
5. Word path same options  
6. Designer Advanced PDF still direct download  

```bash
git add webapp/components/survey/SurveyForm/components/RecordPrintableExportModal.tsx \
  webapp/components/survey/SurveyForm/components/formEntryActions.js \
  core/i18n/resources/*/surveyForm.js
git commit -m "$(cat <<'EOF'
feat(record): printable export options modal for PDF and Word

EOF
)"
```

---

### Task 11: Lint / typecheck sweep

**Files:** all touched Arena files from Tasks 2–3, 8–10

- [ ] **Step 1: Run checks**

```bash
yarn typecheck
npx eslint --cache --fix \
  webapp/components/survey/NodeDefDetails/PrintProps.tsx \
  webapp/components/survey/SurveyForm/components/RecordPrintableExportModal.tsx \
  webapp/service/api/data/recordPrintableExportUrl.ts \
  webapp/components/survey/SurveyForm/components/formEntryActions.js \
  webapp/components/survey/NodeDefDetails/NodeDefDetails.js \
  server/modules/record/api/recordApi.js \
  server/modules/record/service/recordService.js
yarn test:unit
```

- [ ] **Step 2: Fix issues and commit if needed**

```bash
git commit -m "$(cat <<'EOF'
chore: lint and type fixes for printable export options

EOF
)"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Shared modal PDF+DOCX | Task 10 |
| Full vs Current page | Tasks 4, 8, 9, 10 |
| Document default orientation in modal | Task 10 |
| Entity Print props + Print tab | Tasks 1–3 |
| Refined A orientation resolution | Tasks 4–6 |
| Mid-doc orientation at section boundaries | Tasks 4–6 |
| Current page same-page only + entity title + current instance | Tasks 4, 8, 10 |
| arena-server generation | Tasks 4–7 |
| Arena API pass-through | Task 8 |
| TS-only new UI / no new SCSS | Tasks 3, 9, 10 |
| Designer export unchanged | Out of scope (not modified) |
| experimentalFeatures gate kept | Task 10 |
| Filename includes entity label | Task 8 |
| Tests | Tasks 7, 9, 11 |

No TBD placeholders remain. Property name is consistently `printOrientation`. Walker return type is consistently `{ sections, surveyName }` for PDF and DOCX.
