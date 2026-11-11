# Validation Report — Filter by Message Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third "Filter messages" button to the Validation Report header that restricts report rows to a chosen set of validation message-type categories, filtered server-side.

**Architecture:** Mirrors the existing "Filter attributes" feature end-to-end: a static, shared category list (`core/validation/messageTypeFilterCategories.ts`) drives both a new flat-checkbox panel component and the default/all-selected state in `ValidationReport.js`; the selected categories expand to real message keys and flow through `restParams` → API → service → job → repository, where a new recursive-jsonpath SQL clause matches rows whose (possibly nested) `Validation` JSONB contains any of the selected keys.

**Tech Stack:** React (frontend), Express + pg-promise (backend), PostgreSQL 12+ jsonpath (`jsonb_path_query_array`, `?|`).

## Global Constraints

- The message-type category list is exactly 6 items, static, closed — no per-survey computation (spec: `docs/superpowers/specs/2026-08-26-validation-report-message-filter-design.md`, Goals).
- `customValidation` and `valueInvalid` must have visibly distinct labels even though their existing runtime i18n text is both "Invalid value" in English (spec, UX section).
- Default selection state is "all 6 selected" (= no filtering applied); `restParams` only includes `messageTypeKeys` when not all are selected (spec, Frontend changes #3).
- `webapp/service/api/data/index.js`'s `startValidationReportGeneration` gets `messageTypeKeys` forwarding **only** — the pre-existing bug where it drops `query`/`attributeDefUuids` is explicitly out of scope for this change (spec, Backend changes note; confirmed with the user).
- New i18n keys are added to all 6 locales (en, pt, es, ru, fr, mn) in `core/i18n/resources/*/dataView.js` (spec, i18n section).
- The SQL clause must be `AND jsonb_path_query_array(nv.validation, '$.**.key') ?| ARRAY[$/messageTypeKeys:csv/]::text[]`, short-circuiting to `AND 1 = 0` for an explicit empty selection (spec, Backend changes #4) — this exact form was verified against the local Postgres container before being written into the spec.

---

## Task 1: Shared message-type category module

**Files:**
- Create: `core/validation/messageTypeFilterCategories.ts`
- Test: `test/unit/tests/messageTypeFilterCategories.test.js`

**Interfaces:**
- Produces:
  - `MessageTypeFilterCategories: Record<string, { messageKeys: string[] }>` — the 6 category definitions.
  - `MessageTypeFilterCategoryIds: string[]` — `Object.keys(MessageTypeFilterCategories)`, in declaration order: `['valueRequired', 'valueInvalid', 'uniqueDuplicate', 'customValidation', 'entityKeyDuplicate', 'nodesCount']`.
  - `expandMessageTypeFilterCategoriesToKeys(categoryIds: string[]): string[]` — flat-maps category ids to their underlying real message keys.

- [ ] **Step 1: Write the failing unit test**

Create `test/unit/tests/messageTypeFilterCategories.test.js`:

```js
import {
  MessageTypeFilterCategories,
  MessageTypeFilterCategoryIds,
  expandMessageTypeFilterCategoriesToKeys,
} from '@core/validation/messageTypeFilterCategories'

describe('messageTypeFilterCategories', () => {
  test('MessageTypeFilterCategoryIds lists every category key exactly once, in declaration order', () => {
    expect(MessageTypeFilterCategoryIds).toEqual([
      'valueRequired',
      'valueInvalid',
      'uniqueDuplicate',
      'customValidation',
      'entityKeyDuplicate',
      'nodesCount',
    ])
  })

  test('expandMessageTypeFilterCategoriesToKeys expands a single category to its underlying message keys', () => {
    expect(expandMessageTypeFilterCategoriesToKeys(['valueRequired'])).toEqual(['record.attribute.valueRequired'])
  })

  test('expandMessageTypeFilterCategoriesToKeys expands the grouped nodesCount category to all 3 underlying keys', () => {
    expect(expandMessageTypeFilterCategoriesToKeys(['nodesCount'])).toEqual([
      'record.nodes.count.invalid',
      'record.nodes.count.minNotReached',
      'record.nodes.count.maxExceeded',
    ])
  })

  test('expandMessageTypeFilterCategoriesToKeys concatenates keys across multiple selected categories, preserving input order', () => {
    expect(expandMessageTypeFilterCategoriesToKeys(['valueInvalid', 'entityKeyDuplicate'])).toEqual([
      'record.attribute.valueInvalid',
      'record.entity.keyDuplicate',
    ])
  })

  test('expandMessageTypeFilterCategoriesToKeys returns an empty array for an empty selection', () => {
    expect(expandMessageTypeFilterCategoriesToKeys([])).toEqual([])
  })

  test('every category maps to at least one message key', () => {
    Object.values(MessageTypeFilterCategories).forEach((category) => {
      expect(category.messageKeys.length).toBeGreaterThan(0)
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t messageTypeFilterCategories`
Expected: FAIL — module `@core/validation/messageTypeFilterCategories` not found.

- [ ] **Step 3: Write the implementation**

Create `core/validation/messageTypeFilterCategories.ts`:

```ts
export const MessageTypeFilterCategories: Record<string, { messageKeys: string[] }> = {
  valueRequired: { messageKeys: ['record.attribute.valueRequired'] },
  valueInvalid: { messageKeys: ['record.attribute.valueInvalid'] },
  uniqueDuplicate: { messageKeys: ['record.attribute.uniqueDuplicate'] },
  customValidation: { messageKeys: ['record.attribute.customValidation'] },
  entityKeyDuplicate: { messageKeys: ['record.entity.keyDuplicate'] },
  nodesCount: {
    messageKeys: ['record.nodes.count.invalid', 'record.nodes.count.minNotReached', 'record.nodes.count.maxExceeded'],
  },
}

export const MessageTypeFilterCategoryIds: string[] = Object.keys(MessageTypeFilterCategories)

export const expandMessageTypeFilterCategoriesToKeys = (categoryIds: string[]): string[] =>
  categoryIds.flatMap((categoryId) => MessageTypeFilterCategories[categoryId]?.messageKeys ?? [])
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t messageTypeFilterCategories`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add core/validation/messageTypeFilterCategories.ts test/unit/tests/messageTypeFilterCategories.test.js
git commit -m "feat: add shared message-type filter category definitions"
```

---

## Task 2: i18n translations

**Files:**
- Modify: `core/i18n/resources/en/dataView.js`
- Modify: `core/i18n/resources/pt/dataView.js`
- Modify: `core/i18n/resources/es/dataView.js`
- Modify: `core/i18n/resources/ru/dataView.js`
- Modify: `core/i18n/resources/fr/dataView.js`
- Modify: `core/i18n/resources/mn/dataView.js`

**Interfaces:**
- Produces i18n keys consumed by Task 3/4: `dataView:filterMessages` (button label) and `dataView:messageTypeFilter.<categoryId>` for each of the 6 `MessageTypeFilterCategoryIds` from Task 1.

- [ ] **Step 1: Add the keys to each locale**

In each file, insert immediately after the existing `filterAttributes:` line (which sits right before `filterRecords: {`):

`core/i18n/resources/en/dataView.js`:
```js
  filterMessages: 'Filter messages',
  messageTypeFilter: {
    valueRequired: 'Required value',
    valueInvalid: 'Invalid value',
    uniqueDuplicate: 'Duplicate value',
    customValidation: 'Custom validation',
    entityKeyDuplicate: 'Duplicate entity key',
    nodesCount: 'Node count',
  },
```

`core/i18n/resources/pt/dataView.js`:
```js
  filterMessages: 'Filtrar mensagens',
  messageTypeFilter: {
    valueRequired: 'Valor obrigatório',
    valueInvalid: 'Valor inválido',
    uniqueDuplicate: 'Valor duplicado',
    customValidation: 'Validação personalizada',
    entityKeyDuplicate: 'Chave de entidade duplicada',
    nodesCount: 'Contagem de nós',
  },
```

`core/i18n/resources/es/dataView.js`:
```js
  filterMessages: 'Filtrar mensajes',
  messageTypeFilter: {
    valueRequired: 'Valor obligatorio',
    valueInvalid: 'Valor inválido',
    uniqueDuplicate: 'Valor duplicado',
    customValidation: 'Validación personalizada',
    entityKeyDuplicate: 'Clave de entidad duplicada',
    nodesCount: 'Recuento de nodos',
  },
```

`core/i18n/resources/ru/dataView.js`:
```js
  filterMessages: 'Фильтр сообщений',
  messageTypeFilter: {
    valueRequired: 'Требуемое значение',
    valueInvalid: 'Неверное значение',
    uniqueDuplicate: 'Дублирующее значение',
    customValidation: 'Пользовательская проверка',
    entityKeyDuplicate: 'Дублирующийся ключ сущности',
    nodesCount: 'Количество узлов',
  },
```

`core/i18n/resources/fr/dataView.js`:
```js
  filterMessages: 'Filtrer les messages',
  messageTypeFilter: {
    valueRequired: 'Valeur requise',
    valueInvalid: 'Valeur invalide',
    uniqueDuplicate: 'Valeur en double',
    customValidation: 'Validation personnalisée',
    entityKeyDuplicate: "Clé d'entité en double",
    nodesCount: 'Nombre de nœuds',
  },
```

`core/i18n/resources/mn/dataView.js`:
```js
  filterMessages: 'Мессежүүдийг шүүх',
  messageTypeFilter: {
    valueRequired: 'Шаардлагатай утга',
    valueInvalid: 'Хүчингүй утга',
    uniqueDuplicate: 'Давхцсан утга',
    customValidation: 'Тусгай баталгаажуулалт',
    entityKeyDuplicate: 'Объектын түлхүүр давхцсан',
    nodesCount: 'Зангилааны тоо',
  },
```

- [ ] **Step 2: Verify syntax on all 6 files**

Run: `for f in en pt es ru fr mn; do node --check core/i18n/resources/$f/dataView.js || echo "FAIL: $f"; done`
Expected: no `FAIL` lines printed.

- [ ] **Step 3: Commit**

```bash
git add core/i18n/resources/*/dataView.js
git commit -m "feat: add i18n translations for the message-type filter"
```

---

## Task 3: MessageTypeFilterPanel component

**Files:**
- Create: `webapp/views/App/views/Data/ValidationReport/HeaderLeft/MessageTypeFilterPanel/MessageTypeFilterPanel.js`
- Create: `webapp/views/App/views/Data/ValidationReport/HeaderLeft/MessageTypeFilterPanel/index.js`

**Interfaces:**
- Consumes: `MessageTypeFilterCategoryIds` from Task 1 (`@core/validation/messageTypeFilterCategories`); `Checkbox` from `@webapp/components/form` (already used identically in `AttributesFilterPanel.js` — `checked`, `className`, `indeterminate`, `label`, `onChange` props).
- Produces: `MessageTypeFilterPanel` component with props `{ allCategoriesSelected: bool, containerRef: {current}, onClose: fn, onSelectedCategoryIdsChange: fn, selectedCategoryIds: string[] }`, consumed by Task 4.

This mirrors `webapp/views/App/views/Data/ValidationReport/HeaderLeft/AttributesFilterPanel/AttributesFilterPanel.js`'s outside-click-close pattern (a `mousedown` listener on `document` that calls `onClose` when the click lands outside `containerRef`) — that pattern has no automated test in this codebase (verified via manual click-through only), so this task is verified by lint + a manual check in Task 4/5, not a new automated test.

- [ ] **Step 1: Create the panel component**

Create `webapp/views/App/views/Data/ValidationReport/HeaderLeft/MessageTypeFilterPanel/MessageTypeFilterPanel.js`:

```js
import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import { MessageTypeFilterCategoryIds } from '@core/validation/messageTypeFilterCategories'

import { Checkbox } from '@webapp/components/form'

export const MessageTypeFilterPanel = ({
  allCategoriesSelected,
  containerRef,
  onClose,
  onSelectedCategoryIdsChange,
  selectedCategoryIds,
}) => {
  const onCategoryToggle = (categoryId, selected) => {
    const next = new Set(selectedCategoryIds)
    if (selected) {
      next.add(categoryId)
    } else {
      next.delete(categoryId)
    }
    onSelectedCategoryIdsChange([...next])
  }

  // Close the panel when the user clicks outside of it (and outside of its toggle button).
  useEffect(() => {
    const onDocumentMouseDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onDocumentMouseDown)
    return () => document.removeEventListener('mousedown', onDocumentMouseDown)
  }, [containerRef, onClose])

  return (
    <div className="validation-report__message-type-filter-panel">
      <Checkbox
        checked={allCategoriesSelected}
        className="select-all"
        indeterminate={!allCategoriesSelected && selectedCategoryIds.length > 0}
        label="common.selectAll"
        onChange={(selected) => onSelectedCategoryIdsChange(selected ? MessageTypeFilterCategoryIds : [])}
      />
      {MessageTypeFilterCategoryIds.map((categoryId) => (
        <Checkbox
          key={categoryId}
          checked={selectedCategoryIds.includes(categoryId)}
          label={`dataView:messageTypeFilter.${categoryId}`}
          onChange={(selected) => onCategoryToggle(categoryId, selected)}
        />
      ))}
    </div>
  )
}

MessageTypeFilterPanel.propTypes = {
  allCategoriesSelected: PropTypes.bool.isRequired,
  containerRef: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectedCategoryIdsChange: PropTypes.func.isRequired,
  selectedCategoryIds: PropTypes.array.isRequired,
}
```

- [ ] **Step 2: Create the barrel export**

Create `webapp/views/App/views/Data/ValidationReport/HeaderLeft/MessageTypeFilterPanel/index.js`:

```js
export { MessageTypeFilterPanel } from './MessageTypeFilterPanel'
```

- [ ] **Step 3: Lint both files**

Run: `npx eslint webapp/views/App/views/Data/ValidationReport/HeaderLeft/MessageTypeFilterPanel/MessageTypeFilterPanel.js webapp/views/App/views/Data/ValidationReport/HeaderLeft/MessageTypeFilterPanel/index.js`
Expected: no errors (the component isn't wired up anywhere yet, so `MessageTypeFilterPanel` itself being unused elsewhere is fine — this is a plain module export, not a dangling variable).

- [ ] **Step 4: Commit**

```bash
git add webapp/views/App/views/Data/ValidationReport/HeaderLeft/MessageTypeFilterPanel/
git commit -m "feat: add MessageTypeFilterPanel component"
```

---

## Task 4: Wire the button and panel into HeaderLeft

**Files:**
- Modify: `webapp/views/App/views/Data/ValidationReport/HeaderLeft/HeaderLeft.js`
- Modify: `webapp/views/App/views/Data/ValidationReport/ValidationReport.scss`

**Interfaces:**
- Consumes: `MessageTypeFilterCategoryIds` (Task 1), `MessageTypeFilterPanel` (Task 3).
- Produces: `HeaderLeft` gains two new props consumed by Task 5: `selectedMessageTypeCategoryIds` (array, defaults to all category ids) and `onSelectedMessageTypeCategoryIdsChange` (function, required).

- [ ] **Step 1: Add the import and new state to HeaderLeft.js**

In `webapp/views/App/views/Data/ValidationReport/HeaderLeft/HeaderLeft.js`, add to the imports (after the existing `import { AttributesFilterPanel } from './AttributesFilterPanel'` line):

```js
import { MessageTypeFilterCategoryIds } from '@core/validation/messageTypeFilterCategories'

import { MessageTypeFilterPanel } from './MessageTypeFilterPanel'
```

The current `HeaderLeft` function signature is:

```js
export const HeaderLeft = ({
  allAttributeDefUuids = [],
  onQueryChange,
  onSelectedAttributeDefUuidsChange,
  query,
  restParams = {},
  selectedAttributeDefUuids = [],
}) => {
```

Change it to:

```js
export const HeaderLeft = ({
  allAttributeDefUuids = [],
  onQueryChange,
  onSelectedAttributeDefUuidsChange,
  onSelectedMessageTypeCategoryIdsChange,
  query,
  restParams = {},
  selectedAttributeDefUuids = [],
  selectedMessageTypeCategoryIds = MessageTypeFilterCategoryIds,
}) => {
```

Add, alongside the existing `attributesFilterRef`/`attributeFilterShown` state (right after `const attributesFilterRef = useRef(null)`):

```js
  const [messageTypeFilterShown, setMessageTypeFilterShown] = useState(false)
  const messageTypeFilterRef = useRef(null)
```

Add, alongside the existing `allAttributesSelected` memo:

```js
  const allMessageTypesSelected = useMemo(() => {
    if (selectedMessageTypeCategoryIds.length !== MessageTypeFilterCategoryIds.length) return false
    const selectedSet = new Set(selectedMessageTypeCategoryIds)
    return MessageTypeFilterCategoryIds.every((categoryId) => selectedSet.has(categoryId))
  }, [selectedMessageTypeCategoryIds])
```

- [ ] **Step 2: Add the button + panel JSX**

Still in `HeaderLeft.js`, insert a new wrapper block right after the closing `</div>` of the existing `validation-report__attributes-filter` wrapper (i.e. between the attributes-filter block and the records-filter `<ButtonIconFilter>`):

```jsx
      <div className="validation-report__message-type-filter" ref={messageTypeFilterRef}>
        <ButtonIconFilter
          className={`btn btn-edit${!allMessageTypesSelected ? ' highlight' : ''}`}
          iconClassName="icon icon-12px icon-warning"
          onClick={() => setMessageTypeFilterShown((shown) => !shown)}
          label="dataView:filterMessages"
          variant="outlined"
        />
        {messageTypeFilterShown && (
          <MessageTypeFilterPanel
            allCategoriesSelected={allMessageTypesSelected}
            containerRef={messageTypeFilterRef}
            onClose={() => setMessageTypeFilterShown(false)}
            onSelectedCategoryIdsChange={onSelectedMessageTypeCategoryIdsChange}
            selectedCategoryIds={selectedMessageTypeCategoryIds}
          />
        )}
      </div>
```

Resulting button order: Filter attributes, Filter messages, Filter records, Export to Excel.

- [ ] **Step 3: Add the new propTypes**

In `HeaderLeft.propTypes`, add:

```js
  onSelectedMessageTypeCategoryIdsChange: PropTypes.func.isRequired,
  selectedMessageTypeCategoryIds: PropTypes.array,
```

- [ ] **Step 4: Add SCSS for the new wrapper and panel**

In `webapp/views/App/views/Data/ValidationReport/ValidationReport.scss`, insert right after the existing `.validation-report__attributes-filter-panel { ... }` block (before `.validation-report__row-num-col`):

```scss
.validation-report__message-type-filter {
  position: relative;
}

.validation-report__message-type-filter-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 5;
  width: 260px;
  background-color: $white;
  border: $tableRowBorder;
  border-radius: 4px;
  box-shadow: 0 6px 14px rgba($black, 0.2);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .btn-checkbox {
    margin-left: 0;
    height: 20px;
    width: fit-content;
  }
}
```

- [ ] **Step 5: Verify SCSS compiles**

Run: `npx sass --style=compressed --load-path=webapp <(sed "s#~@webapp/style#style#" webapp/views/App/views/Data/ValidationReport/ValidationReport.scss)`
Expected: no errors; output includes `.validation-report__message-type-filter-panel{...}`.

- [ ] **Step 6: Lint HeaderLeft.js**

Run: `npx eslint webapp/views/App/views/Data/ValidationReport/HeaderLeft/HeaderLeft.js`
Expected: no errors. (`onSelectedMessageTypeCategoryIdsChange`/`selectedMessageTypeCategoryIds` are used in this file, so no unused-var warnings; `HeaderLeft` still isn't fully wired from `ValidationReport.js` until Task 5, so the props simply won't be passed yet — that's fine, they're not `.isRequired`-enforced at lint time, only at runtime via prop-types warnings in the browser console, which Task 5 resolves.)

- [ ] **Step 7: Commit**

```bash
git add webapp/views/App/views/Data/ValidationReport/HeaderLeft/HeaderLeft.js webapp/views/App/views/Data/ValidationReport/ValidationReport.scss
git commit -m "feat: wire the message-type filter button and panel into HeaderLeft"
```

---

## Task 5: Wire ValidationReport.js state and restParams

**Files:**
- Modify: `webapp/views/App/views/Data/ValidationReport/ValidationReport.js`

**Interfaces:**
- Consumes: `MessageTypeFilterCategoryIds`, `expandMessageTypeFilterCategoriesToKeys` (Task 1); `HeaderLeft`'s `selectedMessageTypeCategoryIds`/`onSelectedMessageTypeCategoryIdsChange` props (Task 4).
- Produces: `restParams.messageTypeKeys` (a JSON-stringified `string[]`), present only when not all categories are selected — this is what Task 6 (`recordApi.js`) parses on the backend.

This completes the full frontend flow end-to-end (state → header UI → outgoing request params).

- [ ] **Step 1: Add the import**

In `webapp/views/App/views/Data/ValidationReport/ValidationReport.js`, add near the other `@core` imports (after `import * as NodeDef from '@core/survey/nodeDef'`):

```js
import {
  MessageTypeFilterCategoryIds,
  expandMessageTypeFilterCategoriesToKeys,
} from '@core/validation/messageTypeFilterCategories'
```

- [ ] **Step 2: Add state**

Right after the existing `const [selectedAttributeDefUuids, setSelectedAttributeDefUuids] = useState([])` line, add:

```js
  const [selectedMessageTypeCategoryIds, setSelectedMessageTypeCategoryIds] = useState(MessageTypeFilterCategoryIds)
```

- [ ] **Step 3: Add the "all selected" memo**

Right after the existing `allAttributesSelected` memo, add:

```js
  const allMessageTypesSelected = useMemo(() => {
    if (selectedMessageTypeCategoryIds.length !== MessageTypeFilterCategoryIds.length) return false
    const selectedSet = new Set(selectedMessageTypeCategoryIds)
    return MessageTypeFilterCategoryIds.every((categoryId) => selectedSet.has(categoryId))
  }, [selectedMessageTypeCategoryIds])
```

- [ ] **Step 4: Extend restParams**

The current `restParams` memo is:

```js
  const restParams = useMemo(
    () => ({
      cycle: surveyCycleKey,
      ...(recordUuid ? { recordUuid } : {}),
      ...(query ? { query: JSON.stringify(query) } : {}),
      ...(!allAttributesSelected ? { attributeDefUuids: JSON.stringify(selectedAttributeDefUuids) } : {}),
      lang,
    }),
    [allAttributesSelected, lang, query, recordUuid, selectedAttributeDefUuids, surveyCycleKey]
  )
```

Change it to:

```js
  const restParams = useMemo(
    () => ({
      cycle: surveyCycleKey,
      ...(recordUuid ? { recordUuid } : {}),
      ...(query ? { query: JSON.stringify(query) } : {}),
      ...(!allAttributesSelected ? { attributeDefUuids: JSON.stringify(selectedAttributeDefUuids) } : {}),
      ...(!allMessageTypesSelected
        ? {
            messageTypeKeys: JSON.stringify(expandMessageTypeFilterCategoriesToKeys(selectedMessageTypeCategoryIds)),
          }
        : {}),
      lang,
    }),
    [
      allAttributesSelected,
      allMessageTypesSelected,
      lang,
      query,
      recordUuid,
      selectedAttributeDefUuids,
      selectedMessageTypeCategoryIds,
      surveyCycleKey,
    ]
  )
```

- [ ] **Step 5: Pass the new props to HeaderLeft via headerProps**

The current `headerProps` object passed to `<Table>` is:

```js
        headerProps={{
          allAttributeDefUuids,
          onQueryChange: setQuery,
          onSelectedAttributeDefUuidsChange: setSelectedAttributeDefUuids,
          query,
          restParams,
          selectedAttributeDefUuids,
        }}
```

Add two more entries:

```js
        headerProps={{
          allAttributeDefUuids,
          onQueryChange: setQuery,
          onSelectedAttributeDefUuidsChange: setSelectedAttributeDefUuids,
          onSelectedMessageTypeCategoryIdsChange: setSelectedMessageTypeCategoryIds,
          query,
          restParams,
          selectedAttributeDefUuids,
          selectedMessageTypeCategoryIds,
        }}
```

- [ ] **Step 6: Lint**

Run: `npx eslint webapp/views/App/views/Data/ValidationReport/ValidationReport.js`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add webapp/views/App/views/Data/ValidationReport/ValidationReport.js
git commit -m "feat: wire message-type filter state and restParams into ValidationReport"
```

This completes the frontend. `messageTypeKeys` will now appear as a JSON-stringified array in outgoing `GET /validationReport`, `GET /validationReport/count`, and `POST /validationReport/start-export` requests whenever not all 6 categories are selected — but the backend doesn't parse it yet, so it's silently ignored by the server until Task 6.

---

## Task 6: Backend — parse and thread messageTypeKeys through the report/count endpoints

**Files:**
- Modify: `server/modules/record/api/recordApi.js`
- Modify: `server/modules/record/service/recordService.js`

**Interfaces:**
- Consumes: `Request.getJsonParam` (`@server/utils/request`, existing — same helper `attributeDefUuids` already uses).
- Produces: `RecordService.fetchValidationReport`/`countValidationReportItems` now accept `messageTypeKeys`, and `filterBySurveyAttrs.messageTypeKeys` is populated when present — consumed by Task 8 (`validationReportRepository.js`).

- [ ] **Step 1: Parse messageTypeKeys in recordApi.js**

In `server/modules/record/api/recordApi.js`, the current `GET /survey/:surveyId/validationReport` handler is:

```js
  app.get('/survey/:surveyId/validationReport', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, offset, limit, cycle, recordUuid, sortBy, sortOrder } = Request.getParams(req)
      const query = Request.getJsonParam(req, 'query')
      const attributeDefUuids = Request.getJsonParam(req, 'attributeDefUuids')

      const list = await RecordService.fetchValidationReport({
        surveyId,
        cycle,
        offset,
        limit,
        recordUuid,
        query,
        attributeDefUuids,
        sortBy,
        sortOrder,
      })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })
```

Change it to:

```js
  app.get('/survey/:surveyId/validationReport', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, offset, limit, cycle, recordUuid, sortBy, sortOrder } = Request.getParams(req)
      const query = Request.getJsonParam(req, 'query')
      const attributeDefUuids = Request.getJsonParam(req, 'attributeDefUuids')
      const messageTypeKeys = Request.getJsonParam(req, 'messageTypeKeys')

      const list = await RecordService.fetchValidationReport({
        surveyId,
        cycle,
        offset,
        limit,
        recordUuid,
        query,
        attributeDefUuids,
        messageTypeKeys,
        sortBy,
        sortOrder,
      })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })
```

The current `GET /survey/:surveyId/validationReport/count` handler is:

```js
  app.get('/survey/:surveyId/validationReport/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, recordUuid } = Request.getParams(req)
      const query = Request.getJsonParam(req, 'query')
      const attributeDefUuids = Request.getJsonParam(req, 'attributeDefUuids')

      const count = await RecordService.countValidationReportItems({
        surveyId,
        cycle,
        recordUuid,
        query,
        attributeDefUuids,
      })

      res.json({ count })
    } catch (error) {
      next(error)
    }
  })
```

Change it to:

```js
  app.get('/survey/:surveyId/validationReport/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, recordUuid } = Request.getParams(req)
      const query = Request.getJsonParam(req, 'query')
      const attributeDefUuids = Request.getJsonParam(req, 'attributeDefUuids')
      const messageTypeKeys = Request.getJsonParam(req, 'messageTypeKeys')

      const count = await RecordService.countValidationReportItems({
        surveyId,
        cycle,
        recordUuid,
        query,
        attributeDefUuids,
        messageTypeKeys,
      })

      res.json({ count })
    } catch (error) {
      next(error)
    }
  })
```

(The `POST /survey/:surveyId/validationReport/start-export` handler is handled in Task 7, not here.)

- [ ] **Step 2: Thread messageTypeKeys through recordService.js**

In `server/modules/record/service/recordService.js`, the current `_resolveValidationReportFilterBySurveyAttrs` is:

```js
const _resolveValidationReportFilterBySurveyAttrs = async ({ surveyId, cycle, query, attributeDefUuids = null }) => {
  const filter = query ? Query.getFilter(query) : null
  const hasAttributeFilter = Array.isArray(attributeDefUuids)
  if (!filter && !hasAttributeFilter) return null

  const output = {}

  if (hasAttributeFilter) {
    output.attributeDefUuids = attributeDefUuids
  }

  if (filter) {
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
    const rootNodeDef = Survey.getNodeDefRoot(survey)
    output.filter = filter
    output.rootDataViewName = new ViewDataNodeDef(survey, rootNodeDef).name
  }

  return output
}
```

Replace it with:

```js
const _resolveValidationReportFilterBySurveyAttrs = async ({
  surveyId,
  cycle,
  query,
  attributeDefUuids = null,
  messageTypeKeys = null,
}) => {
  const filter = query ? Query.getFilter(query) : null
  const hasAttributeFilter = Array.isArray(attributeDefUuids)
  const hasMessageTypeFilter = Array.isArray(messageTypeKeys)
  if (!filter && !hasAttributeFilter && !hasMessageTypeFilter) return null

  const output = {}

  if (hasAttributeFilter) {
    output.attributeDefUuids = attributeDefUuids
  }

  if (hasMessageTypeFilter) {
    output.messageTypeKeys = messageTypeKeys
  }

  if (filter) {
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
    const rootNodeDef = Survey.getNodeDefRoot(survey)
    output.filter = filter
    output.rootDataViewName = new ViewDataNodeDef(survey, rootNodeDef).name
  }

  return output
}
```

Then update `fetchValidationReport` (add `messageTypeKeys = null` to its destructured params, and pass it into the `_resolveValidationReportFilterBySurveyAttrs({...})` call):

```js
export const fetchValidationReport = async ({
  surveyId,
  cycle,
  offset,
  limit,
  recordUuid,
  query,
  attributeDefUuids = null,
  messageTypeKeys = null,
  sortBy,
  sortOrder,
}) => {
  const filterBySurveyAttrs = await _resolveValidationReportFilterBySurveyAttrs({
    surveyId,
    cycle,
    query,
    attributeDefUuids,
    messageTypeKeys,
  })
  return RecordManager.fetchValidationReport({
    surveyId,
    cycle,
    offset,
    limit,
    recordUuid,
    filterBySurveyAttrs,
    sortBy,
    sortOrder,
  })
}
```

And `countValidationReportItems`:

```js
export const countValidationReportItems = async ({
  surveyId,
  cycle,
  recordUuid,
  query,
  attributeDefUuids = null,
  messageTypeKeys = null,
}) => {
  const filterBySurveyAttrs = await _resolveValidationReportFilterBySurveyAttrs({
    surveyId,
    cycle,
    query,
    attributeDefUuids,
    messageTypeKeys,
  })
  return RecordManager.countValidationReportItems({ surveyId, cycle, recordUuid, filterBySurveyAttrs })
}
```

- [ ] **Step 3: Lint**

Run: `npx eslint server/modules/record/api/recordApi.js server/modules/record/service/recordService.js`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/modules/record/api/recordApi.js server/modules/record/service/recordService.js
git commit -m "feat: thread messageTypeKeys through validation report/count endpoints"
```

At this point `filterBySurveyAttrs.messageTypeKeys` reaches `validationReportRepository.query()`, but that function doesn't read it yet (Task 8) — no behavior change until then.

---

## Task 7: Backend — export path (start-export endpoint + generation job + frontend export call)

**Files:**
- Modify: `server/modules/record/api/recordApi.js`
- Modify: `server/modules/record/service/recordService.js`
- Modify: `server/modules/record/service/validationReportGenerationJob.js`
- Modify: `webapp/service/api/data/index.js`

**Interfaces:**
- Produces: an Excel export started while a message-type filter is active now includes `messageTypeKeys` in `filterBySurveyAttrs`, same as Task 6's report/count path.

Per the Global Constraints, this task deliberately does **not** fix the pre-existing bug where `startValidationReportGeneration` drops `query`/`attributeDefUuids` — only `messageTypeKeys` is added there.

- [ ] **Step 1: Parse messageTypeKeys in the start-export endpoint**

In `server/modules/record/api/recordApi.js`, the current handler is:

```js
  app.post(
    '/survey/:surveyId/validationReport/start-export',
    requireRecordListViewPermission,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, cycle, lang, recordUuid, fileFormat = FileFormats.xlsx } = Request.getParams(req)
        const query = Request.getJsonParam(req, 'query')
        const attributeDefUuids = Request.getJsonParam(req, 'attributeDefUuids')

        const job = RecordService.startValidationReportGenerationJob({
          user,
          surveyId,
          cycle,
          lang,
          recordUuid,
          query,
          attributeDefUuids,
          fileFormat,
        })
        res.json(JobUtils.jobToJSON(job))
      } catch (error) {
        next(error)
      }
    }
  )
```

Change it to:

```js
  app.post(
    '/survey/:surveyId/validationReport/start-export',
    requireRecordListViewPermission,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, cycle, lang, recordUuid, fileFormat = FileFormats.xlsx } = Request.getParams(req)
        const query = Request.getJsonParam(req, 'query')
        const attributeDefUuids = Request.getJsonParam(req, 'attributeDefUuids')
        const messageTypeKeys = Request.getJsonParam(req, 'messageTypeKeys')

        const job = RecordService.startValidationReportGenerationJob({
          user,
          surveyId,
          cycle,
          lang,
          recordUuid,
          query,
          attributeDefUuids,
          messageTypeKeys,
          fileFormat,
        })
        res.json(JobUtils.jobToJSON(job))
      } catch (error) {
        next(error)
      }
    }
  )
```

- [ ] **Step 2: Thread messageTypeKeys through startValidationReportGenerationJob**

In `server/modules/record/service/recordService.js`, the current function is:

```js
export const startValidationReportGenerationJob = ({
  user,
  surveyId,
  cycle,
  lang,
  recordUuid,
  query,
  attributeDefUuids,
  fileFormat,
}) => {
  const job = new VaidationReportGenerationJob({
    user,
    surveyId,
    cycle,
    lang,
    recordUuid,
    query,
    attributeDefUuids,
    fileFormat,
  })
  JobManager.enqueueJob(job)
  return job
}
```

Add `messageTypeKeys` to both the destructured params and the `new VaidationReportGenerationJob({...})` call:

```js
export const startValidationReportGenerationJob = ({
  user,
  surveyId,
  cycle,
  lang,
  recordUuid,
  query,
  attributeDefUuids,
  messageTypeKeys,
  fileFormat,
}) => {
  const job = new VaidationReportGenerationJob({
    user,
    surveyId,
    cycle,
    lang,
    recordUuid,
    query,
    attributeDefUuids,
    messageTypeKeys,
    fileFormat,
  })
  JobManager.enqueueJob(job)
  return job
}
```

- [ ] **Step 3: Thread messageTypeKeys through the job's filterBySurveyAttrs**

In `server/modules/record/service/validationReportGenerationJob.js`, the current `execute()` starts with:

```js
  async execute() {
    const { surveyId, cycle, fileFormat, recordUuid, lang, query, attributeDefUuids = null } = this.context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
    const filter = query ? Query.getFilter(query) : null
    const hasAttributeFilter = Array.isArray(attributeDefUuids)
    const filterBySurveyAttrs =
      filter || hasAttributeFilter
        ? {
            ...(filter
              ? {
                  filter,
                  rootDataViewName: new ViewDataNodeDef(survey, Survey.getNodeDefRoot(survey)).name,
                }
              : {}),
            ...(hasAttributeFilter ? { attributeDefUuids } : {}),
          }
        : null
```

Replace with:

```js
  async execute() {
    const {
      surveyId,
      cycle,
      fileFormat,
      recordUuid,
      lang,
      query,
      attributeDefUuids = null,
      messageTypeKeys = null,
    } = this.context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
    const filter = query ? Query.getFilter(query) : null
    const hasAttributeFilter = Array.isArray(attributeDefUuids)
    const hasMessageTypeFilter = Array.isArray(messageTypeKeys)
    const filterBySurveyAttrs =
      filter || hasAttributeFilter || hasMessageTypeFilter
        ? {
            ...(filter
              ? {
                  filter,
                  rootDataViewName: new ViewDataNodeDef(survey, Survey.getNodeDefRoot(survey)).name,
                }
              : {}),
            ...(hasAttributeFilter ? { attributeDefUuids } : {}),
            ...(hasMessageTypeFilter ? { messageTypeKeys } : {}),
          }
        : null
```

(The rest of `execute()` is unchanged — it already just passes `filterBySurveyAttrs` through to `RecordManager.countValidationReportItems`/`getValidationReportAsStream`.)

- [ ] **Step 4: Forward messageTypeKeys from the frontend export call**

In `webapp/service/api/data/index.js`, the current function is:

```js
export const startValidationReportGeneration = async ({ surveyId, cycle, recordUuid, lang }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/validationReport/start-export`, {
    cycle,
    recordUuid,
    lang,
  })
  return data
}
```

Change to:

```js
export const startValidationReportGeneration = async ({ surveyId, cycle, recordUuid, lang, messageTypeKeys }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/validationReport/start-export`, {
    cycle,
    recordUuid,
    lang,
    messageTypeKeys,
  })
  return data
}
```

`HeaderLeft.js`'s `onExportButtonClick` already calls `API.startValidationReportGeneration({ surveyId, ...restParams })`, and `restParams` already carries `messageTypeKeys` as a JSON string when not all categories are selected (from Task 5) — no change needed there.

- [ ] **Step 5: Lint**

Run: `npx eslint server/modules/record/api/recordApi.js server/modules/record/service/recordService.js server/modules/record/service/validationReportGenerationJob.js webapp/service/api/data/index.js`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add server/modules/record/api/recordApi.js server/modules/record/service/recordService.js server/modules/record/service/validationReportGenerationJob.js webapp/service/api/data/index.js
git commit -m "feat: thread messageTypeKeys through the validation report export path"
```

---

## Task 8: Backend — SQL filter clause in validationReportRepository

**Files:**
- Modify: `server/modules/record/repository/validationReportRepository.js`

**Interfaces:**
- Consumes: `filterBySurveyAttrs.messageTypeKeys` (from Task 6/7).
- Produces: the `query()` function's `WHERE` clause now restricts rows by message type when `messageTypeKeys` is present — this is the change Task 9's integration test exercises.

- [ ] **Step 1: Add the messageTypeKeys clause**

In `server/modules/record/repository/validationReportRepository.js`, the current `query` function starts:

```js
const query = ({ surveyId, recordUuid, filterBySurveyAttrs = null, sortBy, sortOrder }) => {
  const surveySchema = getSurveyDBSchema(surveyId)
  const surveyRdbSchema = SchemaRdb.getName(surveyId)
  const uuidLength = 36
  const filter = filterBySurveyAttrs?.filter
  const rootDataViewName = filterBySurveyAttrs?.rootDataViewName
  const attributeDefUuids = filterBySurveyAttrs?.attributeDefUuids
  const { clause: filterClause = null, params: filterParams = {} } = filter ? Expression.toSql(filter) : {}
```

Add a new destructured constant right after `attributeDefUuids`:

```js
  const messageTypeKeys = filterBySurveyAttrs?.messageTypeKeys
```

Right after the existing `filterByAttributeDefsClause` definition:

```js
  const filterByAttributeDefsClause =
    Array.isArray(attributeDefUuids) && attributeDefUuids.length === 0
      ? 'AND 1 = 0'
      : attributeDefUuids?.length > 0
        ? 'AND n.node_def_uuid IN ($/attributeDefUuids:csv/)'
        : ''
```

add:

```js
  const filterByMessageTypesClause =
    Array.isArray(messageTypeKeys) && messageTypeKeys.length === 0
      ? 'AND 1 = 0'
      : messageTypeKeys?.length > 0
        ? `AND jsonb_path_query_array(nv.validation, '$.**.key') ?| ARRAY[$/messageTypeKeys:csv/]::text[]`
        : ''
```

- [ ] **Step 2: Include the new clause in the SQL text**

The current `text` template's `WHERE` block ends with:

```js
      ${recordUuid ? 'AND r.uuid = $/recordUuid/' : ''}
      ${filterBySurveyAttrsClause}
      ${filterByAttributeDefsClause}
    ORDER BY ${orderByClause}`
```

Change to:

```js
      ${recordUuid ? 'AND r.uuid = $/recordUuid/' : ''}
      ${filterBySurveyAttrsClause}
      ${filterByAttributeDefsClause}
      ${filterByMessageTypesClause}
    ORDER BY ${orderByClause}`
```

- [ ] **Step 3: Bind the new param**

The current `query()` return statement is:

```js
  return {
    text,
    params: {
      ...filterParams,
      ...(attributeDefUuids?.length > 0 ? { attributeDefUuids } : {}),
      ...(rootDataViewName ? { rootDataViewName } : {}),
    },
  }
```

Add a `messageTypeKeys` entry:

```js
  return {
    text,
    params: {
      ...filterParams,
      ...(attributeDefUuids?.length > 0 ? { attributeDefUuids } : {}),
      ...(messageTypeKeys?.length > 0 ? { messageTypeKeys } : {}),
      ...(rootDataViewName ? { rootDataViewName } : {}),
    },
  }
```

- [ ] **Step 4: Lint**

Run: `npx eslint server/modules/record/repository/validationReportRepository.js`
Expected: no errors.

- [ ] **Step 5: Sanity-check the SQL shape directly against the local dev Postgres container**

This re-verifies the exact clause form now embedded in the repository (not just the standalone jsonpath expression checked during design) is syntactically valid PostgreSQL when combined with a `$/name:csv/`-style placeholder substituted manually:

Run:
```bash
docker exec -i arena-db psql -U arena -d arena -v ON_ERROR_STOP=1 <<'SQL'
EXPLAIN SELECT 1
WHERE jsonb_path_query_array('{"errors":[{"key":"record.attribute.valueRequired"}]}'::jsonb, '$.**.key')
  ?| ARRAY['record.attribute.valueRequired','record.attribute.customValidation']::text[];
SQL
```
Expected: an `EXPLAIN` plan prints with no error (confirms the clause parses and plans correctly; the actual `nv.validation` column reference is only valid inside the real query, so this check substitutes a literal in its place — Task 9's integration test exercises the real column).

- [ ] **Step 6: Commit**

```bash
git add server/modules/record/repository/validationReportRepository.js
git commit -m "feat: filter validation report rows by message type in SQL"
```

---

## Task 9: Integration test

**Files:**
- Modify: `test/utils/surveyBuilder/nodeDefAttributeBuilder.js`
- Create: `test/integration/tests/016validationReportMessageTypeFilterTest.js`

**Interfaces:**
- Consumes: `RecordManager.fetchValidationReport`/`countValidationReportItems` (`@server/modules/record/manager/recordManager`, re-exported from `validationReportManager.js` — unchanged signatures, now accepting `filterBySurveyAttrs.messageTypeKeys` per Task 8); `MessageTypeFilterCategories`/`expandMessageTypeFilterCategoriesToKeys` (Task 1); `SB`/`RB` test builders (`test/utils/surveyBuilder`, `test/utils/recordBuilder`).
- Produces: a new `.unique()` builder method on `NodeDefAttributeBuilder`, alongside the existing `.key()`/`.required()`, needed to construct an attribute whose duplicate-value validation (`record.attribute.uniqueDuplicate`) can be exercised in a test — no other file currently needs this, so it's added here rather than as a separate task.

- [ ] **Step 1: Add the `.unique()` builder method**

In `test/utils/surveyBuilder/nodeDefAttributeBuilder.js`, this file already imports `NodeDefValidations` and defines `required()` using the same `_setProp(..., R.pipe(NodeDef.getValidations, NodeDefValidations.assocXxx(...))(this), true)` pattern. Add a new method right after `required()`:

```js
  unique(unique = true) {
    return this._setProp(
      NodeDef.keysPropsAdvanced.validations,
      R.pipe(NodeDef.getValidations, NodeDefValidations.assocUnique(unique))(this),
      true
    )
  }
```

- [ ] **Step 2: Write the integration test**

Create `test/integration/tests/016validationReportMessageTypeFilterTest.js`. This builds one small survey with a `cluster` root entity carrying a required attribute, an integer attribute, an expression-validated attribute, and a `plot` multiple-entity (with a duplicate-key-triggering key attribute, a duplicate-triggering unique attribute, and a `tree` multiple-entity with `minCount(2)` but only 1 instance) — producing, in a single persisted record, at least one issue of every one of the 6 message-type categories simultaneously:

```js
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import {
  MessageTypeFilterCategories,
  expandMessageTypeFilterCategoriesToKeys,
} from '@core/validation/messageTypeFilterCategories'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { initTestContext, getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'

describe('Validation Report - Message Type Filter', () => {
  let survey
  let surveyId
  const cycle = Survey.cycleOneKey

  beforeAll(async () => {
    await initTestContext()
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no').key(),
        SB.attribute('required_attr').required(),
        SB.attribute('numeric_attr', NodeDef.nodeDefType.integer),
        SB.attribute('percent_attr', NodeDef.nodeDefType.integer).expressions(
          NodeDefExpression.createExpression({ expression: 'percent_attr > 0' })
        ),
        SB.entity(
          'plot',
          SB.attribute('plot_num', NodeDef.nodeDefType.integer).key(),
          SB.attribute('unique_attr').unique(),
          SB.entity('tree', SB.attribute('tree_num', NodeDef.nodeDefType.integer).key()).multiple().minCount(2)
        ).multiple()
      )
    ).buildAndStore()

    surveyId = Survey.getId(survey)

    await RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_no', '1'),
        // required_attr intentionally left unset -> record.attribute.valueRequired
        RB.attribute('numeric_attr', 'not-a-number'), // -> record.attribute.valueInvalid
        RB.attribute('percent_attr', 0), // violates "percent_attr > 0" -> record.attribute.customValidation
        RB.entity(
          'plot',
          RB.attribute('plot_num', 1),
          RB.attribute('unique_attr', 'A'),
          RB.entity('tree', RB.attribute('tree_num', 1)) // only 1 tree, minCount is 2 -> record.nodes.count.minNotReached
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_num', 1), // duplicate key (same as plot[1]) -> record.entity.keyDuplicate
          RB.attribute('unique_attr', 'B')
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_num', 3),
          RB.attribute('unique_attr', 'A') // duplicate of plot[1]'s unique_attr -> record.attribute.uniqueDuplicate
        )
      )
    ).buildAndStore()
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(surveyId)
    }
  })

  const countForCategories = async (categoryIds) =>
    RecordManager.countValidationReportItems({
      surveyId,
      cycle,
      filterBySurveyAttrs: { messageTypeKeys: expandMessageTypeFilterCategoriesToKeys(categoryIds) },
    })

  test('no filter returns every validation issue row', async () => {
    const totalCount = await RecordManager.countValidationReportItems({ surveyId, cycle, filterBySurveyAttrs: null })
    expect(totalCount).toBeGreaterThan(0)
  })

  test.each(Object.keys(MessageTypeFilterCategories))('category "%s" matches at least one row', async (categoryId) => {
    const count = await countForCategories([categoryId])
    expect(count).toBeGreaterThan(0)
  })

  test('selecting every category returns the same count as no filter at all', async () => {
    const totalCount = await RecordManager.countValidationReportItems({ surveyId, cycle, filterBySurveyAttrs: null })
    const countAllCategories = await countForCategories(Object.keys(MessageTypeFilterCategories))
    expect(countAllCategories).toBe(totalCount)
  })

  test('an empty category selection returns zero rows', async () => {
    const count = await RecordManager.countValidationReportItems({
      surveyId,
      cycle,
      filterBySurveyAttrs: { messageTypeKeys: [] },
    })
    expect(count).toBe(0)
  })

  test('filtering by "valueRequired" alone excludes rows that only have other issue types', async () => {
    const requiredCount = await countForCategories(['valueRequired'])
    const totalCount = await RecordManager.countValidationReportItems({ surveyId, cycle, filterBySurveyAttrs: null })
    expect(requiredCount).toBeLessThan(totalCount)
  })

  test('fetching with the "entityKeyDuplicate" filter only returns rows whose validation mentions that key', async () => {
    const messageTypeKeys = expandMessageTypeFilterCategoriesToKeys(['entityKeyDuplicate'])
    const rows = await RecordManager.fetchValidationReport({
      surveyId,
      cycle,
      limit: 100,
      offset: 0,
      filterBySurveyAttrs: { messageTypeKeys },
    })
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach((row) => {
      expect(JSON.stringify(row.validation)).toContain('record.entity.keyDuplicate')
    })
  })
})
```

- [ ] **Step 3: Run just this test**

Run: `yarn build:test:integration && npx jest dist/__tests__/bundle.integration.js -t "Validation Report - Message Type Filter"`
Expected: PASS for all cases (1 "no filter" test + 6 `test.each` category tests + "all categories" + "empty selection" + "valueRequired excludes" + "entityKeyDuplicate content" = 11 tests).

If the `'category "valueRequired" matches at least one row'` case fails specifically (0 rows), it means the auto-created empty `required_attr` node isn't being validated as expected at record-init time — the fix is to add an explicit `RecordManager.persistNode` call setting it to `null` after the initial `buildAndStore()`, mirroring the `_persistNode`/`_updateNodeAndExpectValidationToBe` helper pattern in `test/integration/tests/008recordValidationtest.js:37-46`, before the assertions run.

- [ ] **Step 4: Run the full integration suite to confirm no regressions**

Run: `yarn test:integration`
Expected: all tests pass (this exercises the same local Postgres container already running for this repo's dev environment — the test creates and, in `afterAll`, deletes its own temporary survey, matching how every other file in `test/integration/tests/` already behaves against a real DB connection).

- [ ] **Step 5: Commit**

```bash
git add test/utils/surveyBuilder/nodeDefAttributeBuilder.js test/integration/tests/016validationReportMessageTypeFilterTest.js
git commit -m "test: add integration coverage for the validation report message-type filter"
```

---

## Final manual verification

The report author does not have login access to the local dev instance's app-level session (confirmed earlier in this work), so this step is for whoever executes the plan with browser access:

1. Open a survey's Validation Report with existing validation errors of more than one type.
2. Click the new "Filter messages" button (warning-icon, between "Filter attributes" and "Filter records") — confirm the panel opens with 6 checked checkboxes plus "select all".
3. Uncheck one category — confirm the button gets the `highlight` background, the report re-fetches, and rows of that type disappear.
4. Click elsewhere in the page — confirm the panel closes. Reopen it and click the toggle button itself while open — confirm it closes (not reopens).
5. With a category unchecked, click "Export to Excel" — confirm the downloaded file only contains rows matching the remaining selected categories.
