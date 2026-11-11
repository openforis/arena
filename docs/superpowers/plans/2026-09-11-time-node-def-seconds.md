# Time node def: optional seconds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in, per-node-def "Include seconds" setting to `time` node defs, so a time attribute can capture/display/export `HH:mm:ss` instead of always `HH:mm`, without breaking any existing survey or already-recorded data.

**Architecture:** A new boolean prop (`includeSeconds` in `arena`'s `core/survey/nodeDef.js`, `NodeDefTimeProps.includeSeconds` in `arena-core`) drives format selection at every layer that currently hardcodes `HH:mm`: the MUI time-picker input, the shared record validator/comparator/expression-converter in `arena-core`, and the RDB/CSV-export/CSV-import/record-summary pipelines in `arena`. The record's raw JSON value and the RDB `time` column always store real seconds (defaulting to `0` when absent) regardless of the setting; only *read-time formatting* (display, export, CSV output) is gated by the toggle, so flipping it never mutates or loses existing data.

**Tech Stack:** Node.js, React 18, Redux Toolkit, Express, PostgreSQL, `@openforis/arena-core` (TypeScript, published npm package, sibling repo), moment (via arena-core's `Dates` utils), MUI `x-date-pickers` `TimePicker`.

**Design doc:** `docs/superpowers/specs/2026-09-11-time-node-def-seconds-design.md`

## Global Constraints

- Two repos are touched: this repo (`/home/stefano/dev/projects/openforis/arena`, branch `feat/time-seconds`, already checked out) and its sibling `/home/stefano/dev/projects/openforis/arena-core` (branch `feat/time-seconds`, already checked out). **Every task states which repo it works in** — `cd` there first.
- `arena-core` changes are committed on its branch but **not published to npm and not version-bumped in arena's `package.json`** — that remains a deliberate follow-up outside this plan. Do not run `npm publish`, `npm version`, or edit `arena`'s `package.json` dependency on `@openforis/arena-core`.
- New modules are written in TypeScript (`.ts`/`.tsx`); existing JS files being extended stay JS — do not convert an existing `.js` file to `.ts` as part of this work.
- `arena-core` tests run directly: `cd /home/stefano/dev/projects/openforis/arena-core && npx jest <path/to/file.test.ts>`.
- `arena` unit tests require a full rebuild first (existing repo convention, not something to change): `cd /home/stefano/dev/projects/openforis/arena && yarn build:test:unit && yarn jest:unit -t "<test name or describe block>"`. This takes a while (webpack bundles every unit test into `dist/__tests__/bundle.unit.js`) — that's expected, not a bug.
- Never rewrite or migrate existing recorded time values. Every task must preserve exact current behavior when `includeSeconds`/`NodeDefTimeProps.includeSeconds` is absent or `false`.
- Prop/accessor naming follows the existing coordinate-attribute convention: prop `includeSeconds`, accessor `isSecondsIncluded` (parallel to `includeAccuracy` → `isAccuracyIncluded`), not a type-prefixed name.

---

## Task 1 (arena-core): `NodeDefTimeProps` type + `isSecondsIncluded` accessor

**Repo:** `/home/stefano/dev/projects/openforis/arena-core`

**Files:**
- Modify: `src/nodeDef/types/time.ts`
- Modify: `src/nodeDef/index.ts`
- Modify: `src/nodeDef/nodeDefs.ts`
- Test: `src/nodeDef/nodeDefs.test.ts` (new)

**Interfaces:**
- Produces: `NodeDefTimeProps` (interface, `includeSeconds?: boolean`), `NodeDefTime = NodeDef<NodeDefType.time, NodeDefTimeProps>`, `NodeDefs.isSecondsIncluded(nodeDef: NodeDefTime): boolean`.

- [ ] **Step 1: Write the failing test**

Create `src/nodeDef/nodeDefs.test.ts`:

```ts
import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory } from './factory'
import { NodeDefType } from './nodeDef'
import { NodeDefs } from './nodeDefs'
import { NodeDefTime } from './types/time'

describe('NodeDefs.isSecondsIncluded', () => {
  test('is false when includeSeconds prop is not set', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time }) as NodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
  })

  test('is false when includeSeconds prop is explicitly false', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.time,
      props: { includeSeconds: false },
    }) as NodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
  })

  test('is true when includeSeconds prop is true', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.time,
      props: { includeSeconds: true },
    }) as NodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/nodeDef/nodeDefs.test.ts`
Expected: FAIL — `NodeDefs.isSecondsIncluded is not a function` (and a TS error on `includeSeconds` not existing on `NodeDefProps`).

- [ ] **Step 3: Implement**

In `src/nodeDef/types/time.ts`, replace the whole file with:

```ts
import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export interface NodeDefTimeProps extends NodeDefProps {
  includeSeconds?: boolean
}

export type NodeDefTime = NodeDef<NodeDefType.time, NodeDefTimeProps>
```

In `src/nodeDef/index.ts`, change:

```ts
export type { NodeDefTime } from './types/time'
```

to:

```ts
export type { NodeDefTime, NodeDefTimeProps } from './types/time'
```

In `src/nodeDef/nodeDefs.ts`:
- Add to the imports near the top (alongside the existing `NodeDefFile` import at line 26): `import { NodeDefTime } from './types/time'`
- Add this function right after `isGeotagInformationShown` (line 141):

```ts
const isSecondsIncluded = (nodeDef: NodeDefTime): boolean => !!nodeDef.props.includeSeconds
```

- Add `isSecondsIncluded,` to the `NodeDefs` export object, right after `isGeotagInformationShown,` (line 314).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/nodeDef/nodeDefs.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/nodeDef/types/time.ts src/nodeDef/index.ts src/nodeDef/nodeDefs.ts src/nodeDef/nodeDefs.test.ts
git commit -m "Add NodeDefTimeProps.includeSeconds and NodeDefs.isSecondsIncluded

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2 (arena-core): `ValuePropsTime.seconds` + `getTimeSeconds` getter

**Repo:** `/home/stefano/dev/projects/openforis/arena-core`

**Files:**
- Modify: `src/node/nodeValueProps.ts`
- Modify: `src/node/nodeValues.ts`
- Test: `src/node/nodeValues.test.ts` (new)

**Interfaces:**
- Consumes: `NodeFactory` from `./factory` (`NodeFactory.createInstance({ nodeDefUuid, recordUuid, value })`).
- Produces: `ValuePropsTime.seconds` (enum member, value `'seconds'`), `NodeValues.getTimeSeconds(node: Node): number`.

- [ ] **Step 1: Write the failing test**

Create `src/node/nodeValues.test.ts`:

```ts
import { describe, test, expect } from '@jest/globals'

import { NodeFactory } from './factory'
import { NodeValues } from './nodeValues'

const buildTimeNode = (value: string | undefined) =>
  NodeFactory.createInstance({ nodeDefUuid: 'time-def-uuid', recordUuid: 'record-uuid', value })

describe('NodeValues time getters', () => {
  test('getTimeHour and getTimeMinute read an HH:mm value', () => {
    const node = buildTimeNode('14:30')
    expect(NodeValues.getTimeHour(node)).toBe(14)
    expect(NodeValues.getTimeMinute(node)).toBe(30)
  })

  test('getTimeSeconds reads the third part of an HH:mm:ss value', () => {
    const node = buildTimeNode('14:30:45')
    expect(NodeValues.getTimeSeconds(node)).toBe(45)
  })

  test('getTimeSeconds defaults to 0 for an HH:mm value with no seconds part', () => {
    const node = buildTimeNode('14:30')
    expect(NodeValues.getTimeSeconds(node)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/node/nodeValues.test.ts`
Expected: FAIL — `NodeValues.getTimeSeconds is not a function`

- [ ] **Step 3: Implement**

In `src/node/nodeValueProps.ts`, change:

```ts
export enum ValuePropsTime {
  hour = 'hour',
  minute = 'minute',
}
```

to:

```ts
export enum ValuePropsTime {
  hour = 'hour',
  minute = 'minute',
  seconds = 'seconds',
}
```

In `src/node/nodeValues.ts`:
- Right after the existing time getters (currently):

```ts
const _getTimePart =
  (index: number) =>
  (node: Node): number =>
    getDateTimePart({ node, index, separator: ':' })
const getTimeHour = _getTimePart(0)
const getTimeMinute = _getTimePart(1)

const _timePropGetters: { [key in ValuePropsTime]: any } = {
  [ValuePropsTime.hour]: getTimeHour,
  [ValuePropsTime.minute]: getTimeMinute,
}
```

change to:

```ts
const _getTimePart =
  (index: number) =>
  (node: Node): number =>
    getDateTimePart({ node, index, separator: ':' })
const getTimeHour = _getTimePart(0)
const getTimeMinute = _getTimePart(1)
const getTimeSeconds = _getTimePart(2)

const _timePropGetters: { [key in ValuePropsTime]: any } = {
  [ValuePropsTime.hour]: getTimeHour,
  [ValuePropsTime.minute]: getTimeMinute,
  [ValuePropsTime.seconds]: getTimeSeconds,
}
```

- In the `NodeValues` export object, change:

```ts
  // time
  getTimeHour,
  getTimeMinute,
```

to:

```ts
  // time
  getTimeHour,
  getTimeMinute,
  getTimeSeconds,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/node/nodeValues.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/node/nodeValueProps.ts src/node/nodeValues.ts src/node/nodeValues.test.ts
git commit -m "Add ValuePropsTime.seconds and NodeValues.getTimeSeconds

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3 (arena-core): `Dates.isValidTime` optional seconds parameter

**Repo:** `/home/stefano/dev/projects/openforis/arena-core`

**Files:**
- Modify: `src/utils/dates.ts`
- Test: `src/utils/dates.test.ts` (new)

**Interfaces:**
- Produces: `Dates.isValidTime(hour: any, minutes: any, seconds?: any): boolean` — existing 2-arg callers are unaffected (seconds defaults to `0`, always in range).

- [ ] **Step 1: Write the failing test**

Create `src/utils/dates.test.ts`:

```ts
import { describe, test, expect } from '@jest/globals'

import { Dates } from './dates'

describe('Dates.isValidTime', () => {
  test('is true for a valid hour/minute with no seconds argument', () => {
    expect(Dates.isValidTime(14, 30)).toBe(true)
  })

  test('is false for an out-of-range hour or minute', () => {
    expect(Dates.isValidTime(24, 30)).toBe(false)
    expect(Dates.isValidTime(14, 60)).toBe(false)
  })

  test('is true for a valid hour/minute/seconds triple', () => {
    expect(Dates.isValidTime(14, 30, 45)).toBe(true)
  })

  test('is false for an out-of-range seconds value', () => {
    expect(Dates.isValidTime(14, 30, 60)).toBe(false)
    expect(Dates.isValidTime(14, 30, -1)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/utils/dates.test.ts`
Expected: FAIL on the two "seconds" tests (current `isValidTime` ignores a third argument entirely, so `isValidTime(14, 30, 60)` returns `true` instead of `false`).

- [ ] **Step 3: Implement**

In `src/utils/dates.ts`, change:

```ts
const isValidTime = (hour: any = '', minutes: any = ''): boolean =>
  Objects.isEmpty(hour) || Objects.isEmpty(minutes)
    ? false
    : Number(hour) >= 0 && Number(hour) < 24 && Number(minutes) >= 0 && Number(minutes) < 60
```

to:

```ts
const isValidTime = (hour: any = '', minutes: any = '', seconds: any = 0): boolean => {
  if (Objects.isEmpty(hour) || Objects.isEmpty(minutes)) return false
  if (!(Number(hour) >= 0 && Number(hour) < 24 && Number(minutes) >= 0 && Number(minutes) < 60)) return false
  return Number(seconds) >= 0 && Number(seconds) < 60
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/utils/dates.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/utils/dates.ts src/utils/dates.test.ts
git commit -m "Dates.isValidTime: accept an optional seconds argument

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4 (arena-core): validator and expression-value extractor validate seconds

**Repo:** `/home/stefano/dev/projects/openforis/arena-core`

**Files:**
- Modify: `src/record/recordValidator/attributeTypeValidator.ts`
- Modify: `src/record/recordExpressionEvaluator/nodeValueExtractor.ts`
- Test: `src/record/recordValidator/attributeTypeValidator.test.ts` (new)

**Interfaces:**
- Consumes: `NodeValues.getTimeSeconds` (Task 2), `Dates.isValidTime(hour, minute, seconds?)` (Task 3).

- [ ] **Step 1: Write the failing test**

The validator is exported as `AttributeTypeValidator.validateValueType`, a curried function:
`validateValueType(params: { survey, nodeDef, record, categoryItemProvider?, taxonProvider? })` returns
`async (_propName: string, node: Node) => ValidationResult`, where `ValidationResult` has a `valid: boolean`
field (`src/validation/validation.ts`). The time branch only reads `node`, so `survey`/`record` can be empty
stand-ins for this test. Create `src/record/recordValidator/attributeTypeValidator.test.ts`:

```ts
import { describe, test, expect } from '@jest/globals'

import { NodeFactory } from '../../node/factory'
import { NodeDefFactory } from '../../nodeDef/factory'
import { NodeDefType } from '../../nodeDef/nodeDef'
import { AttributeTypeValidator } from './attributeTypeValidator'

describe('attributeTypeValidator - time', () => {
  const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time })

  test('accepts a valid HH:mm value', async () => {
    const node = NodeFactory.createInstance({ nodeDefUuid: nodeDef.uuid, recordUuid: 'r1', value: '14:30' })
    const result = await AttributeTypeValidator.validateValueType({
      survey: {} as any,
      record: {} as any,
      nodeDef,
    })('value', node)
    expect(result.valid).toBe(true)
  })

  test('rejects an out-of-range seconds part', async () => {
    const node = NodeFactory.createInstance({ nodeDefUuid: nodeDef.uuid, recordUuid: 'r1', value: '14:30:99' })
    const result = await AttributeTypeValidator.validateValueType({
      survey: {} as any,
      record: {} as any,
      nodeDef,
    })('value', node)
    expect(result.valid).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/record/recordValidator/attributeTypeValidator.test.ts`
Expected: FAIL on the "rejects an out-of-range seconds part" case (currently ignored, so it resolves `valid: true` instead of `valid: false`).

- [ ] **Step 3: Implement**

In `src/record/recordValidator/attributeTypeValidator.ts`, change:

```ts
  [NodeDefType.time]: async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
    const { node } = params
    const [hour, minute] = [NodeValues.getTimeHour(node), NodeValues.getTimeMinute(node)]
    return Dates.isValidTime(hour, minute)
  },
```

to:

```ts
  [NodeDefType.time]: async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
    const { node } = params
    const [hour, minute, seconds] = [
      NodeValues.getTimeHour(node),
      NodeValues.getTimeMinute(node),
      NodeValues.getTimeSeconds(node),
    ]
    return Dates.isValidTime(hour, minute, seconds)
  },
```

In `src/record/recordExpressionEvaluator/nodeValueExtractor.ts`, change:

```ts
  [NodeDefType.time]: (params: ExtractorParams) => {
    const { node } = params
    const [hour, minute] = [NodeValues.getTimeHour(node), NodeValues.getTimeMinute(node)]
    if (Dates.isValidTime(hour, minute)) {
      return node.value
    }
    return null
  },
```

to:

```ts
  [NodeDefType.time]: (params: ExtractorParams) => {
    const { node } = params
    const [hour, minute, seconds] = [
      NodeValues.getTimeHour(node),
      NodeValues.getTimeMinute(node),
      NodeValues.getTimeSeconds(node),
    ]
    if (Dates.isValidTime(hour, minute, seconds)) {
      return node.value
    }
    return null
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/record/recordValidator/attributeTypeValidator.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/record/recordValidator/attributeTypeValidator.ts src/record/recordExpressionEvaluator/nodeValueExtractor.ts src/record/recordValidator/attributeTypeValidator.test.ts
git commit -m "Validate the seconds part of a time attribute's value

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5 (arena-core): time value comparator compares at second granularity

**Repo:** `/home/stefano/dev/projects/openforis/arena-core`

**Files:**
- Modify: `src/node/nodeValues.ts`
- Modify: `src/node/nodeValues.test.ts` (from Task 2)

**Interfaces:**
- Consumes: `dateTimeComparator` (existing, in this file), `DateFormats.timeStorage` / `DateFormats.timeWithSeconds` (existing).

- [ ] **Step 1: Write the failing test**

Add to `src/node/nodeValues.test.ts` (append a new `describe` block):

```ts
import { valueComparatorByNodeDefType } from './nodeValues' // only if exported; see Step 3 note
```

Note: `valueComparatorByNodeDefType` is currently a private (non-exported) const. Instead, test through the public surface — `NodeValues` doesn't currently export a generic "compare by type" entry point in arena-core (that orchestration lives in `arena`'s `core/record/nodeValues.js`, covered by Task 9). For this task, test the comparator directly by temporarily exporting it, OR — simpler and matching existing style — inline-construct the same `dateTimeComparator` call the map uses. Do the latter to avoid changing the module's public API surface:

```ts
import { describe, test, expect } from '@jest/globals'

import { DateFormats } from '../utils'
import { NodeFactory } from './factory'
import { NodeValues } from './nodeValues'
```

Append this describe block to the end of the file:

```ts
describe('time value equality (via record-level comparator wiring)', () => {
  // Exercised indirectly through arena's core/record/nodeValues.js in the arena repo (Task 9);
  // here we only verify the underlying format-conversion primitives arena-core exposes.
  test('an HH:mm value and its HH:mm:ss equivalent convert to the same timeWithSeconds string', () => {
    const { Dates } = require('../utils')
    const fromShort = Dates.convertDate({ dateStr: '14:30', formatFrom: DateFormats.timeStorage, formatTo: DateFormats.timeWithSeconds })
    const fromLong = Dates.convertDate({ dateStr: '14:30:00', formatFrom: DateFormats.timeWithSeconds, formatTo: DateFormats.timeWithSeconds })
    expect(fromShort).toBe(fromLong)
  })

  test('two values that differ only in seconds convert to different timeWithSeconds strings', () => {
    const { Dates } = require('../utils')
    const a = Dates.convertDate({ dateStr: '14:30:00', formatFrom: DateFormats.timeWithSeconds, formatTo: DateFormats.timeWithSeconds })
    const b = Dates.convertDate({ dateStr: '14:30:45', formatFrom: DateFormats.timeWithSeconds, formatTo: DateFormats.timeWithSeconds })
    expect(a).not.toBe(b)
  })
})
```

(This test doesn't yet fail — it documents the conversion primitive the comparator config change in Step 3 relies on. The actual comparator wiring for `NodeDefType.time` is exercised end-to-end by `core/record/nodeValues.js`'s equivalent map in the `arena` repo, Task 9, where `isValueEqual` is public and directly testable. Skip ahead to Step 3.)

- [ ] **Step 2: Run test to verify it passes already (sanity check on `Dates.convertDate`)**

Run: `npx jest src/node/nodeValues.test.ts`
Expected: PASS (both new tests pass immediately — they test an already-correct existing primitive, confirming the assumption Step 3's config change relies on).

- [ ] **Step 3: Implement**

In `src/node/nodeValues.ts`, change:

```ts
  [NodeDefType.time]: dateTimeComparator({
    formatsSource: [DateFormats.timeStorage, DateFormats.timeWithSeconds],
    formatTo: DateFormats.timeStorage,
  }),
```

to:

```ts
  [NodeDefType.time]: dateTimeComparator({
    formatsSource: [DateFormats.timeStorage, DateFormats.timeWithSeconds],
    formatTo: DateFormats.timeWithSeconds,
  }),
```

- [ ] **Step 4: Run tests to verify nothing broke**

Run: `npx jest src/node/nodeValues.test.ts`
Expected: PASS (all tests, unchanged — this step doesn't add a new failing/passing pair because the comparator map isn't exported for direct unit testing in this repo; the behavioral change is verified end-to-end in arena's Task 9 test, which imports and exercises the equivalent JS map through the public `NodeValues.isValueEqual`).

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/node/nodeValues.ts src/node/nodeValues.test.ts
git commit -m "Time value comparator: compare at second granularity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6 (arena-core): expression-assigned time values respect `includeSeconds`

**Repo:** `/home/stefano/dev/projects/openforis/arena-core`

**Files:**
- Modify: `src/record/recordNodesUpdater/recordExpressionValueConverter.ts`
- Test: `src/record/recordNodesUpdater/recordExpressionValueConverter.test.ts` (new, or extend if one already exists — check with `ls src/record/recordNodesUpdater/*.test.ts` first)

**Interfaces:**
- Consumes: `NodeDefs.isSecondsIncluded` (Task 1).

- [ ] **Step 1: Write the failing test**

The converter is exported as `RecordExpressionValueConverter.toNodeValue(params: ToNodeValueParams): Promise<any>`,
dispatching internally by `nodeDef.type`. `ToNodeValueParams` requires `survey`, `record`, `nodeParent`, `nodeDef`,
`valueExpr`, and optional `timezoneOffset` — the time branch only reads `nodeDef`/`valueExpr`/`timezoneOffset`, so
`survey`/`record`/`nodeParent` can be empty stand-ins here. Create
`src/record/recordNodesUpdater/recordExpressionValueConverter.test.ts`:

```ts
import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory } from '../../nodeDef/factory'
import { NodeDefType } from '../../nodeDef/nodeDef'
import { RecordExpressionValueConverter } from './recordExpressionValueConverter'

describe('time expression value conversion', () => {
  test('keeps only HH:mm when includeSeconds is not set', async () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time })
    const result = await RecordExpressionValueConverter.toNodeValue({
      survey: {} as any,
      record: {} as any,
      nodeParent: {} as any,
      nodeDef,
      valueExpr: '14:30:45',
    })
    expect(result).toBe('14:30')
  })

  test('keeps HH:mm:ss when includeSeconds is true', async () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time, props: { includeSeconds: true } })
    const result = await RecordExpressionValueConverter.toNodeValue({
      survey: {} as any,
      record: {} as any,
      nodeParent: {} as any,
      nodeDef,
      valueExpr: '14:30:45',
    })
    expect(result).toBe('14:30:45')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/record/recordNodesUpdater/recordExpressionValueConverter.test.ts`
Expected: FAIL on the second test (currently always truncates to `HH:mm` since `formatsFrom` doesn't include `timeWithSeconds` as a source and `format` is hardcoded to `timeStorage`).

- [ ] **Step 3: Implement**

`NodeDefs` is already imported at the top of `src/record/recordNodesUpdater/recordExpressionValueConverter.ts`
(`import { NodeDef, NodeDefType, NodeDefs, NodeDefCodeProps, NodeDefTaxon, NodeDefCode } from '../../nodeDef'`) —
no import change needed. Change:

```ts
  [NodeDefType.time]: (params: { valueExpr: any; timezoneOffset?: number }) => {
    const { valueExpr, timezoneOffset } = params
    return _toDateTime({
      valueExpr,
      format: DateFormats.timeStorage,
      formatsFrom: [DateFormats.datetimeStorage, DateFormats.datetimeDefault, DateFormats.timeStorage],
      timezoneOffset,
    })
  },
```

to:

```ts
  [NodeDefType.time]: (params: { nodeDef: NodeDef<any>; valueExpr: any; timezoneOffset?: number }) => {
    const { nodeDef, valueExpr, timezoneOffset } = params
    return _toDateTime({
      valueExpr,
      format: NodeDefs.isSecondsIncluded(nodeDef) ? DateFormats.timeWithSeconds : DateFormats.timeStorage,
      formatsFrom: [
        DateFormats.datetimeStorage,
        DateFormats.datetimeDefault,
        DateFormats.timeWithSeconds,
        DateFormats.timeStorage,
      ],
      timezoneOffset,
    })
  },
```

(`nodeDef` is already present on every call because the caller passes the full `ToNodeValueParams` object — only this function's own narrowed inline parameter type was omitting it.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/record/recordNodesUpdater/recordExpressionValueConverter.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the full arena-core test suite to check for regressions**

Run: `npx jest`
Expected: PASS (no regressions in other suites that exercise `time` expression conversion, e.g. `recordUpdater.attributeUpdate*.test.ts`)

- [ ] **Step 6: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/record/recordNodesUpdater/recordExpressionValueConverter.ts src/record/recordNodesUpdater/recordExpressionValueConverter.test.ts
git commit -m "Expression-assigned time values respect includeSeconds

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7 (arena): core data model — `includeSeconds` prop, `valuePropsTime.seconds`, `getTimeSeconds`

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Modify: `core/survey/nodeDef.js`
- Modify: `core/survey/nodeValueProps.js`
- Modify: `core/record/node.js`
- Test: `test/unit/tests/timeIncludeSeconds.test.js` (new)

**Interfaces:**
- Produces: `NodeDef.propKeys.includeSeconds` (string `'includeSeconds'`), `NodeDef.isSecondsIncluded(nodeDef): boolean`, `valuePropsTime.seconds` (string `'seconds'`), `Node.getTimeSeconds(node): number`.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/timeIncludeSeconds.test.js`:

```js
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

describe('time node def: includeSeconds', () => {
  it('NodeDef.isSecondsIncluded is false when the prop is not set', () => {
    const nodeDef = { props: {} }
    expect(NodeDef.isSecondsIncluded(nodeDef)).toBe(false)
  })

  it('NodeDef.isSecondsIncluded is true when the prop is true', () => {
    const nodeDef = { props: { [NodeDef.propKeys.includeSeconds]: true } }
    expect(NodeDef.isSecondsIncluded(nodeDef)).toBe(true)
  })

  it('Node.getTimeSeconds reads the third part of an HH:mm:ss value', () => {
    const node = { value: '14:30:45' }
    expect(Node.getTimeSeconds(node)).toBe(45)
  })

  it('Node.getTimeSeconds defaults to 0 for an HH:mm value', () => {
    const node = { value: '14:30' }
    expect(Node.getTimeSeconds(node)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && yarn jest:unit -t "time node def: includeSeconds"`
Expected: FAIL — `NodeDef.isSecondsIncluded is not a function`, `NodeDef.propKeys.includeSeconds` is `undefined`, `Node.getTimeSeconds is not a function`.

- [ ] **Step 3: Implement**

In `core/survey/nodeDef.js`, in the `propKeys` object, change:

```js
  // File
  maxFileSize: 'maxFileSize', // max file size in MB
  fileType: 'fileType',
  geotagInformationShown: 'geotagInformationShown',

  // Coordinate
```

to:

```js
  // File
  maxFileSize: 'maxFileSize', // max file size in MB
  fileType: 'fileType',
  geotagInformationShown: 'geotagInformationShown',

  // Time
  includeSeconds: 'includeSeconds',

  // Coordinate
```

Then, right after the existing `export const isGeotagInformationShown = ObjectUtils.isPropTrue(propKeys.geotagInformationShown)` line (line 312), add:

```js
export const isSecondsIncluded = ObjectUtils.isPropTrue(propKeys.includeSeconds)
```

In `core/survey/nodeValueProps.js`, change:

```js
export const valuePropsTime = {
  hour: 'hour',
  minute: 'minute',
}
```

to:

```js
export const valuePropsTime = {
  hour: 'hour',
  minute: 'minute',
  seconds: 'seconds',
}
```

In `core/record/node.js`, change:

```js
// Time
const _getTimePart = _getDateTimePart(':')
export const getTimeHour = _getTimePart(0)
export const getTimeMinute = _getTimePart(1)
```

to:

```js
// Time
const _getTimePart = _getDateTimePart(':')
export const getTimeHour = _getTimePart(0)
export const getTimeMinute = _getTimePart(1)
export const getTimeSeconds = _getTimePart(2)
```

and change:

```js
const _timePropGetters = {
  [valuePropsTime.hour]: getTimeHour,
  [valuePropsTime.minute]: getTimeMinute,
}
```

to:

```js
const _timePropGetters = {
  [valuePropsTime.hour]: getTimeHour,
  [valuePropsTime.minute]: getTimeMinute,
  [valuePropsTime.seconds]: getTimeSeconds,
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn build:test:unit && yarn jest:unit -t "time node def: includeSeconds"`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add core/survey/nodeDef.js core/survey/nodeValueProps.js core/record/node.js test/unit/tests/timeIncludeSeconds.test.js
git commit -m "Add includeSeconds prop and getTimeSeconds getter for time node defs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8 (arena): `core/dateUtils.ts` — `timeWithSeconds` format, `getTimeFormat`, `isValidTime`/`formatTime` seconds param

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Modify: `core/dateUtils.ts`
- Test: `test/unit/tests/timeIncludeSeconds.test.js` (extend, from Task 7)

**Interfaces:**
- Consumes: `NodeDef.isSecondsIncluded` (Task 7).
- Produces: `DateUtils.formats.timeWithSeconds` (`'HH:mm:ss'`), `DateUtils.getTimeFormat(nodeDef): string`, `DateUtils.isValidTime(hour, minutes, seconds?): boolean`, `DateUtils.formatTime(hour, minute, seconds?): string`.

- [ ] **Step 1: Write the failing test**

Append to `test/unit/tests/timeIncludeSeconds.test.js`:

```js
import * as DateUtils from '@core/dateUtils'

describe('DateUtils time-with-seconds helpers', () => {
  it('exposes formats.timeWithSeconds', () => {
    expect(DateUtils.formats.timeWithSeconds).toBe('HH:mm:ss')
  })

  it('getTimeFormat returns timeStorage when includeSeconds is not set', () => {
    const nodeDef = { props: {} }
    expect(DateUtils.getTimeFormat(nodeDef)).toBe(DateUtils.formats.timeStorage)
  })

  it('getTimeFormat returns timeWithSeconds when includeSeconds is true', () => {
    const nodeDef = { props: { includeSeconds: true } }
    expect(DateUtils.getTimeFormat(nodeDef)).toBe(DateUtils.formats.timeWithSeconds)
  })

  it('formatTime with 2 args keeps existing HH:mm behavior', () => {
    expect(DateUtils.formatTime(9, 5)).toBe('09:05')
  })

  it('formatTime with 3 args includes seconds', () => {
    expect(DateUtils.formatTime(9, 5, 3)).toBe('09:05:03')
  })

  it('isValidTime with 2 args keeps existing behavior', () => {
    expect(DateUtils.isValidTime(14, 30)).toBe(true)
    expect(DateUtils.isValidTime(24, 30)).toBe(false)
  })

  it('isValidTime with 3 args also validates seconds range', () => {
    expect(DateUtils.isValidTime(14, 30, 45)).toBe(true)
    expect(DateUtils.isValidTime(14, 30, 60)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && yarn jest:unit -t "DateUtils time-with-seconds helpers"`
Expected: FAIL — `formats.timeWithSeconds` is `undefined`, `getTimeFormat is not a function`, and `formatTime(9, 5, 3)` currently returns `'09:05'` (3rd arg ignored).

- [ ] **Step 3: Implement**

In `core/dateUtils.ts`, change:

```ts
export const formats = {
  dateDefault: DateFormats.dateDisplay,
  dateISO: DateFormats.dateStorage,
  datetimeDefault: DateFormats.datetimeDefault,
  datetimeExport: 'YYYY-MM-DD HH:mm:ss',
  datetimeDisplay: DateFormats.datetimeDisplay,
  datetimeISO: DateFormats.datetimeStorage,
  timeStorage: DateFormats.timeStorage,
} as const
```

to:

```ts
export const formats = {
  dateDefault: DateFormats.dateDisplay,
  dateISO: DateFormats.dateStorage,
  datetimeDefault: DateFormats.datetimeDefault,
  datetimeExport: 'YYYY-MM-DD HH:mm:ss',
  datetimeDisplay: DateFormats.datetimeDisplay,
  datetimeISO: DateFormats.datetimeStorage,
  timeStorage: DateFormats.timeStorage,
  timeWithSeconds: DateFormats.timeWithSeconds,
} as const
```

Add this import at the top (alongside the existing `import { isBlank } from './stringUtils'`):

```ts
import * as NodeDef from './survey/nodeDef'
```

Change:

```ts
/**
 * Check if time (hour:minute) is valid.
 */
export const isValidTime = (hour: unknown = '', minutes: unknown = ''): boolean =>
  isBlank(hour) || isBlank(minutes)
    ? false
    : Number(hour) >= 0 && Number(hour) < 24 && Number(minutes) >= 0 && Number(minutes) < 60
```

to:

```ts
/**
 * Check if time (hour:minute:seconds) is valid. Seconds default to a valid 0 when omitted.
 */
export const isValidTime = (hour: unknown = '', minutes: unknown = '', seconds: unknown = 0): boolean => {
  if (isBlank(hour) || isBlank(minutes)) return false
  if (!(Number(hour) >= 0 && Number(hour) < 24 && Number(minutes) >= 0 && Number(minutes) < 60)) return false
  return Number(seconds) >= 0 && Number(seconds) < 60
}
```

Change:

```ts
export const formatTime = (hour: unknown, minute: unknown): string =>
  `${normalizeDateTimeValue(2)(hour)}:${normalizeDateTimeValue(2)(minute)}`
```

to:

```ts
export const formatTime = (hour: unknown, minute: unknown, seconds?: unknown): string => {
  const base = `${normalizeDateTimeValue(2)(hour)}:${normalizeDateTimeValue(2)(minute)}`
  return seconds === undefined ? base : `${base}:${normalizeDateTimeValue(2)(seconds)}`
}
```

Add, right after `formatTime`:

```ts
export const getTimeFormat = (nodeDef: unknown): string =>
  NodeDef.isSecondsIncluded(nodeDef as never) ? formats.timeWithSeconds : formats.timeStorage
```

**No circular import:** `core/survey/nodeDef.js` does not import `core/dateUtils.ts` (verified — `grep -n "dateUtils" core/survey/nodeDef.js` returns nothing), so this new import direction is safe.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn build:test:unit && yarn jest:unit -t "DateUtils time-with-seconds helpers"`
Expected: PASS (7 tests)

- [ ] **Step 5: Run the full unit suite to check for regressions**

Run: `yarn jest:unit`
Expected: PASS (no regressions in existing `dateUtils`/`formatTime`/`isValidTime` consumers — Collect import, RDB column processor, etc., are updated in later tasks, but their *current* 2-arg call sites must still behave identically after this change)

- [ ] **Step 6: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add core/dateUtils.ts test/unit/tests/timeIncludeSeconds.test.js
git commit -m "dateUtils: add timeWithSeconds format, getTimeFormat, seconds-aware isValidTime/formatTime

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9 (arena): time value comparator compares at second granularity

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Modify: `core/record/nodeValues.js`
- Test: `test/unit/tests/timeValueComparator.test.js` (new)

**Interfaces:**
- Consumes: `NodeValues.isValueEqual` (existing export from `core/record/nodeValues.js`).

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/timeValueComparator.test.js`:

```js
import { NodeValues } from '@core/record/nodeValues'
import { nodeDefType } from '@core/survey/nodeDefType'

describe('NodeValues.isValueEqual - time', () => {
  const nodeDef = { type: nodeDefType.time }

  it('treats "14:30" and "14:30:00" as equal', () => {
    expect(NodeValues.isValueEqual({ nodeDef, value: '14:30', valueSearch: '14:30:00' })).toBe(true)
  })

  it('treats "14:30:00" and "14:30:45" as different', () => {
    expect(NodeValues.isValueEqual({ nodeDef, value: '14:30:00', valueSearch: '14:30:45' })).toBe(false)
  })

  it('still treats two identical HH:mm values as equal', () => {
    expect(NodeValues.isValueEqual({ nodeDef, value: '09:15', valueSearch: '09:15' })).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && yarn jest:unit -t "NodeValues.isValueEqual - time"`
Expected: FAIL on "treats '14:30:00' and '14:30:45' as different" — today both collapse to `'14:30'` (formatTo is `timeStorage`) and are considered equal.

- [ ] **Step 3: Implement**

In `core/record/nodeValues.js`, change:

```js
  [NodeDef.nodeDefType.time]: dateTimeComparator({
    formatsSource: [DateFormats.timeStorage, 'HH:mm:ss'],
    formatTo: DateFormats.timeStorage,
  }),
```

to:

```js
  [NodeDef.nodeDefType.time]: dateTimeComparator({
    formatsSource: [DateFormats.timeStorage, DateFormats.timeWithSeconds],
    formatTo: DateFormats.timeWithSeconds,
  }),
```

(This also replaces the ad hoc literal `'HH:mm:ss'` with the proper `DateFormats.timeWithSeconds` constant, already imported from `@openforis/arena-core` at the top of this file.)

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn build:test:unit && yarn jest:unit -t "NodeValues.isValueEqual - time"`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add core/record/nodeValues.js test/unit/tests/timeValueComparator.test.js
git commit -m "Time value comparator: compare at second granularity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10 (arena): Designer — "Include seconds" checkbox

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Create: `webapp/components/survey/NodeDefDetails/TimeProps.tsx`
- Modify: `webapp/components/survey/NodeDefDetails/BasicProps/BasicProps.js`
- Modify: `core/i18n/resources/en/common.js`
- Modify: `core/i18n/resources/es/common.js`
- Modify: `core/i18n/resources/fr/common.js`
- Modify: `core/i18n/resources/mn/common.js`
- Modify: `core/i18n/resources/pt/common.js`
- Modify: `core/i18n/resources/ru/common.js`

**Interfaces:**
- Consumes: `NodeDef.propKeys.includeSeconds`, `NodeDef.isSecondsIncluded` (Task 7); `Actions.setProp` and `State.getNodeDef`/`useNodeDefEditReadOnly` from `./store` (existing, same contract `FileProps.js` already uses).
- Produces: default-exported `TimeProps` React component with the same `{ state, Actions }` prop contract as `FileProps`, registered for `NodeDef.nodeDefType.time`.

No automated test for this task — this repo has no unit-test harness for React components (Designer settings are covered by Playwright e2e, and there's no existing e2e coverage for per-type prop toggles to extend safely without a live app). Verify manually in Step 3.

- [ ] **Step 1: Create `TimeProps.tsx`**

```tsx
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

import { useNodeDefEditReadOnly } from './store'

type NodeDefEditState = {
  nodeDef: Parameters<typeof NodeDef.isSecondsIncluded>[0]
}

type TimePropsProps = {
  state: NodeDefEditState
  Actions: { setProp: (args: { state: NodeDefEditState; key: string; value: boolean }) => void }
}

const TimeProps = (props: TimePropsProps) => {
  const { state, Actions } = props
  const readOnly = useNodeDefEditReadOnly()

  const nodeDef = state.nodeDef

  return (
    <FormItem label="">
      <Checkbox
        checked={NodeDef.isSecondsIncluded(nodeDef)}
        disabled={readOnly}
        label="nodeDefEdit.timeProps.includeSeconds"
        onChange={(value: boolean) => Actions.setProp({ state, key: NodeDef.propKeys.includeSeconds, value })}
      />
    </FormItem>
  )
}

TimeProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default TimeProps
```

(`Checkbox`'s `onChange` fires with just the new boolean value — confirmed in `webapp/components/form/checkbox.js` — matching `FileProps.js`'s existing `onChange={(value) => Actions.setProp({ ..., value })}` usage that this component's code mirrors.)

- [ ] **Step 2: Register it in `BasicProps.js`**

In `webapp/components/survey/NodeDefDetails/BasicProps/BasicProps.js`, change:

```js
import TaxonProps from '../TaxonProps'
import TextProps from '../TextProps'
import AnalysisProps from '../AnalysisProps'

const basicPropsComponentByType = {
  [NodeDef.nodeDefType.boolean]: BooleanProps,
  [NodeDef.nodeDefType.code]: CodeProps,
  [NodeDef.nodeDefType.coordinate]: CoordinateProps,
  [NodeDef.nodeDefType.decimal]: DecimalProps,
  [NodeDef.nodeDefType.file]: FileProps,
  [NodeDef.nodeDefType.formHeader]: FormHeaderProps,
  [NodeDef.nodeDefType.integer]: IntegerProps,
  [NodeDef.nodeDefType.taxon]: TaxonProps,
  [NodeDef.nodeDefType.text]: TextProps,
}
```

to:

```js
import TaxonProps from '../TaxonProps'
import TextProps from '../TextProps'
import TimeProps from '../TimeProps'
import AnalysisProps from '../AnalysisProps'

const basicPropsComponentByType = {
  [NodeDef.nodeDefType.boolean]: BooleanProps,
  [NodeDef.nodeDefType.code]: CodeProps,
  [NodeDef.nodeDefType.coordinate]: CoordinateProps,
  [NodeDef.nodeDefType.decimal]: DecimalProps,
  [NodeDef.nodeDefType.file]: FileProps,
  [NodeDef.nodeDefType.formHeader]: FormHeaderProps,
  [NodeDef.nodeDefType.integer]: IntegerProps,
  [NodeDef.nodeDefType.taxon]: TaxonProps,
  [NodeDef.nodeDefType.text]: TextProps,
  [NodeDef.nodeDefType.time]: TimeProps,
}
```

- [ ] **Step 3: Add i18n key to all six locales**

In `core/i18n/resources/en/common.js`, change:

```js
    mobileProps: {
      title: 'Mobile App',
    },
    formHeaderProps: {
```

to:

```js
    mobileProps: {
      title: 'Mobile App',
    },
    timeProps: {
      includeSeconds: 'Include seconds',
    },
    formHeaderProps: {
```

In `core/i18n/resources/es/common.js`, change:

```js
    mobileProps: {
      title: 'Aplicación móvil',
    },
    formHeaderProps: {
```

to:

```js
    mobileProps: {
      title: 'Aplicación móvil',
    },
    timeProps: {
      includeSeconds: 'Incluir segundos',
    },
    formHeaderProps: {
```

In `core/i18n/resources/fr/common.js`, change:

```js
    mobileProps: {
      title: 'Application mobile',
    },
    formHeaderProps: {
```

to:

```js
    mobileProps: {
      title: 'Application mobile',
    },
    timeProps: {
      includeSeconds: 'Inclure les secondes',
    },
    formHeaderProps: {
```

In `core/i18n/resources/mn/common.js`, change:

```js
    mobileProps: {
      title: 'Мобайл апп',
    },
    formHeaderProps: {
```

to:

```js
    mobileProps: {
      title: 'Мобайл апп',
    },
    timeProps: {
      includeSeconds: 'Секунд оруулах',
    },
    formHeaderProps: {
```

In `core/i18n/resources/pt/common.js`, change:

```js
    mobileProps: {
      title: 'Aplicativo móvel',
    },
    formHeaderProps: {
```

to:

```js
    mobileProps: {
      title: 'Aplicativo móvel',
    },
    timeProps: {
      includeSeconds: 'Incluir segundos',
    },
    formHeaderProps: {
```

In `core/i18n/resources/ru/common.js`, change:

```js
    mobileProps: {
      title: 'Мобильное приложение',
    },
    formHeaderProps: {
```

to:

```js
    mobileProps: {
      title: 'Мобильное приложение',
    },
    timeProps: {
      includeSeconds: 'Включить секунды',
    },
    formHeaderProps: {
```

- [ ] **Step 4: Manual verification**

Run: `yarn watch` (or `yarn dev:server` + `yarn client:dev-server` if already running), open the Designer, add or select a `time` attribute, confirm an "Include seconds" checkbox appears in its Basic properties panel, toggling it persists (survey saved, reload keeps the state).

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add webapp/components/survey/NodeDefDetails/TimeProps.tsx webapp/components/survey/NodeDefDetails/BasicProps/BasicProps.js core/i18n/resources/*/common.js
git commit -m "Designer: add Include seconds checkbox for time node defs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11 (arena): data entry widget captures seconds when enabled

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Modify: `webapp/components/form/DateTimeInput/TimeInput.js`
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefTime.js`

**Interfaces:**
- Consumes: `NodeDef.isSecondsIncluded` (Task 7), `DateUtils.formats.timeWithSeconds` (Task 8).
- Produces: `TimeInput` gains a `withSeconds` boolean prop (default `false`); `nodeDefTime.js` passes it through.

No automated test — same reasoning as Task 10 (no component-test harness in this repo for the data-entry form). Verify manually in Step 3.

- [ ] **Step 1: Update `TimeInput.js`**

Change:

```js
import './TimeInput.scss'

import PropTypes from 'prop-types'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'

import * as DateUtils from '@core/dateUtils'
import { useDateTimeInput } from './useDateTimeInput'

const valueFormat = DateUtils.formats.timeStorage

const TimeInput = (props) => {
  const { disabled = false, onChange, value } = props

  const { dateValue, onInputChange, errorRef } = useDateTimeInput({ onChange, value, valueFormat })

  return (
    <TimePicker
      ampm={false}
      disabled={disabled}
      onChange={onInputChange}
      slotProps={{ textField: { className: 'time-picker__text-field', error: errorRef.current } }}
      value={dateValue}
    />
  )
}

TimeInput.propTypes = {
  disabled: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

export default TimeInput
```

to:

```js
import './TimeInput.scss'

import PropTypes from 'prop-types'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'

import * as DateUtils from '@core/dateUtils'
import { useDateTimeInput } from './useDateTimeInput'

const TimeInput = (props) => {
  const { disabled = false, onChange, value, withSeconds = false } = props

  const valueFormat = withSeconds ? DateUtils.formats.timeWithSeconds : DateUtils.formats.timeStorage

  const { dateValue, onInputChange, errorRef } = useDateTimeInput({ onChange, value, valueFormat })

  return (
    <TimePicker
      ampm={false}
      disabled={disabled}
      onChange={onInputChange}
      slotProps={{ textField: { className: 'time-picker__text-field', error: errorRef.current } }}
      value={dateValue}
      views={withSeconds ? ['hours', 'minutes', 'seconds'] : ['hours', 'minutes']}
    />
  )
}

TimeInput.propTypes = {
  disabled: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  withSeconds: PropTypes.bool,
}

export default TimeInput
```

- [ ] **Step 2: Update `nodeDefTime.js`**

Change:

```js
  return (
    <div className="survey-form__node-def-time">
      <TimeInput disabled={edit || !canEditRecord || readOnly} onChange={onChange} value={timeStr} />
    </div>
  )
```

to:

```js
  return (
    <div className="survey-form__node-def-time">
      <TimeInput
        disabled={edit || !canEditRecord || readOnly}
        onChange={onChange}
        value={timeStr}
        withSeconds={NodeDef.isSecondsIncluded(nodeDef)}
      />
    </div>
  )
```

and add the import (this file currently imports `Node` from `@core/record/node` but not `NodeDef`):

```js
import * as NodeDef from '@core/survey/nodeDef'
```

- [ ] **Step 3: Manual verification**

With `yarn watch` running: on a `time` attribute with "Include seconds" off, confirm data entry still shows only hours/minutes. Turn it on in the Designer, reopen the record, confirm the input now shows and accepts a seconds field, and the saved value round-trips (reload the record, seconds are still there).

- [ ] **Step 4: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add webapp/components/form/DateTimeInput/TimeInput.js webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefTime.js
git commit -m "Data entry: show a seconds field when includeSeconds is enabled

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12 (arena): RDB column write — store the record's real seconds

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Modify: `common/model/db/tables/dataNodeDef/dataColProps.js`
- Test: `test/unit/tests/timeColValueProcessor.test.js` (new)

**Interfaces:**
- Consumes: `Node.getTimeSeconds` (Task 7), `DateTimeUtils.isValidTime` (Task 8) — both already used/imported in this file for hour/minute.
- Produces: no new export; `getColValueProcessor(nodeDef)` (existing export) now writes real seconds for a `time` node def.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/timeColValueProcessor.test.js`:

```js
import { getColValueProcessor } from '@common/model/db/tables/dataNodeDef/dataColProps'
import { nodeDefType } from '@core/survey/nodeDefType'

describe('dataColProps - time column value processor', () => {
  const nodeDef = { type: nodeDefType.time }

  it('writes the real seconds when present', () => {
    const valueFn = getColValueProcessor(nodeDef)({ nodeCol: { value: '14:30:45' } })
    expect(valueFn()).toBe('14:30:45')
  })

  it('writes :00 seconds when the value has none (legacy HH:mm data)', () => {
    const valueFn = getColValueProcessor(nodeDef)({ nodeCol: { value: '14:30' } })
    expect(valueFn()).toBe('14:30:00')
  })

  it('writes null for an invalid time value', () => {
    const valueFn = getColValueProcessor(nodeDef)({ nodeCol: { value: '25:99' } })
    expect(valueFn()).toBe(null)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && yarn jest:unit -t "dataColProps - time column value processor"`
Expected: FAIL on "writes the real seconds when present" — today it always returns `'14:30:00'` (hardcoded `:00`) regardless of actual seconds in the value.

- [ ] **Step 3: Implement**

In `common/model/db/tables/dataNodeDef/dataColProps.js`, change:

```js
  [nodeDefType.time]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const [hour, minute] = [Node.getTimeHour(nodeCol), Node.getTimeMinute(nodeCol)]
      return () =>
        DateTimeUtils.isValidTime(hour, minute) ? `${hour}:${StringUtils.padStart(2, '0')(minute)}:00` : null
    },
  },
```

to:

```js
  [nodeDefType.time]: {
    [colValueProcessor]: ({ nodeCol }) => {
      const [hour, minute, seconds] = [
        Node.getTimeHour(nodeCol),
        Node.getTimeMinute(nodeCol),
        Node.getTimeSeconds(nodeCol),
      ]
      return () =>
        DateTimeUtils.isValidTime(hour, minute, seconds)
          ? `${hour}:${StringUtils.padStart(2, '0')(minute)}:${StringUtils.padStart(2, '0')(seconds)}`
          : null
    },
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn build:test:unit && yarn jest:unit -t "dataColProps - time column value processor"`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add common/model/db/tables/dataNodeDef/dataColProps.js test/unit/tests/timeColValueProcessor.test.js
git commit -m "RDB time column: write the record's actual seconds, not a hardcoded :00

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 13 (arena): RDB column read — TO_CHAR format depends on `includeSeconds`

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Modify: `server/modules/surveyRdb/repository/dataView/read.js`
- Test: `test/unit/tests/timeColumnToCharFormat.test.js` (new)

**Interfaces:**
- Consumes: `NodeDef.isSecondsIncluded` (Task 7).
- Produces: new named export `getTimeColumnToCharFormat(nodeDefCol): string` (extracted for direct unit testing, used inside the existing `columnTransformByNodeDefType[time]` transform).

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/timeColumnToCharFormat.test.js`:

```js
import { getTimeColumnToCharFormat } from '@server/modules/surveyRdb/repository/dataView/read'

describe('getTimeColumnToCharFormat', () => {
  it('returns HH24:MI when includeSeconds is not set', () => {
    const nodeDefCol = { props: {} }
    expect(getTimeColumnToCharFormat(nodeDefCol)).toBe('HH24:MI')
  })

  it('returns HH24:MI:SS when includeSeconds is true', () => {
    const nodeDefCol = { props: { includeSeconds: true } }
    expect(getTimeColumnToCharFormat(nodeDefCol)).toBe('HH24:MI:SS')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && yarn jest:unit -t "getTimeColumnToCharFormat"`
Expected: FAIL — `getTimeColumnToCharFormat` is not exported yet.

- [ ] **Step 3: Implement**

In `server/modules/surveyRdb/repository/dataView/read.js`, change:

```js
const columnTransformByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: ({ streamMode, nameFull, namesFull, alias }) => {
    if (!streamMode) {
      // boolean value, not text
      return [`${nameFull}::boolean AS ${DbUtils.asName(alias)}`]
    }
    // transform not applied
    return namesFull
  },
  [NodeDef.nodeDefType.coordinate]: ({ viewAlias, names, nameFull, alias, streamMode }) => {
    const result = names
      .filter((colName) => colName !== alias || !streamMode) // include default column only when not in reading stream mode (e.g. in data explorer)
      .map((colName) => {
        if (colName === alias) {
          // not in stream mode: read default column as a geometry point string
          return DbUtils.geometryPointColumnAsText({ qualifiedColName: nameFull, alias: DbUtils.asName(alias) })
        }
        return `${DbUtils.asName(viewAlias)}.${DbUtils.asName(colName)} AS ${DbUtils.asName(colName)}`
      })
    return result
  },
  [NodeDef.nodeDefType.date]: ({ nameFull, alias }) => [
    `TO_CHAR(${nameFull}, 'YYYY-MM-DD') AS ${DbUtils.asName(alias)}`,
  ],
  [NodeDef.nodeDefType.time]: ({ nameFull, alias }) => [`TO_CHAR(${nameFull}, 'HH24:MI') AS ${DbUtils.asName(alias)}`],
}

const _selectFieldsByNodeDefType =
  ({ viewDataNodeDef, streamMode }) =>
  (nodeDefCol) => {
    const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDefCol)
    const {
      name: alias, // use column name as alias for easier mapping of transformed columns (e.g. coordinate) and default column in stream mode
      names,
      nameFull,
      namesFull,
    } = columnNodeDef

    const columnTransform = columnTransformByNodeDefType[NodeDef.getType(nodeDefCol)]
    if (columnTransform) {
      return columnTransform({ streamMode, viewAlias: viewDataNodeDef.alias, nameFull, namesFull, names, alias })
    }
    return namesFull
  }
```

to:

```js
export const getTimeColumnToCharFormat = (nodeDefCol) => (NodeDef.isSecondsIncluded(nodeDefCol) ? 'HH24:MI:SS' : 'HH24:MI')

const columnTransformByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: ({ streamMode, nameFull, namesFull, alias }) => {
    if (!streamMode) {
      // boolean value, not text
      return [`${nameFull}::boolean AS ${DbUtils.asName(alias)}`]
    }
    // transform not applied
    return namesFull
  },
  [NodeDef.nodeDefType.coordinate]: ({ viewAlias, names, nameFull, alias, streamMode }) => {
    const result = names
      .filter((colName) => colName !== alias || !streamMode) // include default column only when not in reading stream mode (e.g. in data explorer)
      .map((colName) => {
        if (colName === alias) {
          // not in stream mode: read default column as a geometry point string
          return DbUtils.geometryPointColumnAsText({ qualifiedColName: nameFull, alias: DbUtils.asName(alias) })
        }
        return `${DbUtils.asName(viewAlias)}.${DbUtils.asName(colName)} AS ${DbUtils.asName(colName)}`
      })
    return result
  },
  [NodeDef.nodeDefType.date]: ({ nameFull, alias }) => [
    `TO_CHAR(${nameFull}, 'YYYY-MM-DD') AS ${DbUtils.asName(alias)}`,
  ],
  [NodeDef.nodeDefType.time]: ({ nodeDefCol, nameFull, alias }) => [
    `TO_CHAR(${nameFull}, '${getTimeColumnToCharFormat(nodeDefCol)}') AS ${DbUtils.asName(alias)}`,
  ],
}

const _selectFieldsByNodeDefType =
  ({ viewDataNodeDef, streamMode }) =>
  (nodeDefCol) => {
    const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDefCol)
    const {
      name: alias, // use column name as alias for easier mapping of transformed columns (e.g. coordinate) and default column in stream mode
      names,
      nameFull,
      namesFull,
    } = columnNodeDef

    const columnTransform = columnTransformByNodeDefType[NodeDef.getType(nodeDefCol)]
    if (columnTransform) {
      return columnTransform({
        streamMode,
        viewAlias: viewDataNodeDef.alias,
        nodeDefCol,
        nameFull,
        namesFull,
        names,
        alias,
      })
    }
    return namesFull
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn build:test:unit && yarn jest:unit -t "getTimeColumnToCharFormat"`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the broader unit suite to check for regressions**

Run: `yarn jest:unit`
Expected: PASS (the added `nodeDefCol` param to every `columnTransform` call is additive — the `boolean`, `coordinate`, and `date` transforms simply ignore the new field, since JS destructuring of an unused key is a no-op)

- [ ] **Step 6: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add server/modules/surveyRdb/repository/dataView/read.js test/unit/tests/timeColumnToCharFormat.test.js
git commit -m "RDB time column read: format via TO_CHAR based on includeSeconds

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 14 (arena): CSV import accepts and truncates seconds leniently

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Modify: `server/modules/dataImport/service/DataImportJob/dataImportFlatDataFileReader.js`
- Modify: `core/i18n/resources/en/validationErrors.js`
- Modify: `core/i18n/resources/es/validationErrors.js`
- Modify: `core/i18n/resources/fr/validationErrors.js`
- Modify: `core/i18n/resources/mn/validationErrors.js`
- Modify: `core/i18n/resources/pt/validationErrors.js`
- Modify: `core/i18n/resources/ru/validationErrors.js`
- Test: `test/unit/tests/timeCsvImportExtractor.test.js` (new)

**Interfaces:**
- Consumes: `DateUtils.getTimeFormat` (Task 8).
- Produces: new named export `extractTimeValue({ value, headers, nodeDef })` (extracted from the existing inline map entry for direct unit testing).

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/timeCsvImportExtractor.test.js`:

```js
import { extractTimeValue } from '@server/modules/dataImport/service/DataImportJob/dataImportFlatDataFileReader'

// The file's internal VALUE_PROP_DEFAULT constant is the literal string 'value' —
// this test builds its `value` param the same shape `extractDateOrTime`'s callers use.
describe('CSV import - time value extraction', () => {
  it('accepts HH:mm into a seconds-off attribute, unchanged', () => {
    const nodeDef = { props: {} }
    const result = extractTimeValue({ value: { value: '14:30' }, headers: ['time_col'], nodeDef })
    expect(result.value).toBe('14:30')
  })

  it('truncates HH:mm:ss to HH:mm for a seconds-off attribute', () => {
    const nodeDef = { props: {} }
    const result = extractTimeValue({ value: { value: '14:30:45' }, headers: ['time_col'], nodeDef })
    expect(result.value).toBe('14:30')
  })

  it('keeps seconds for a seconds-on attribute', () => {
    const nodeDef = { props: { includeSeconds: true } }
    const result = extractTimeValue({ value: { value: '14:30:45' }, headers: ['time_col'], nodeDef })
    expect(result.value).toBe('14:30:45')
  })

  it('accepts HH:mm into a seconds-on attribute without forcing :00', () => {
    const nodeDef = { props: { includeSeconds: true } }
    const result = extractTimeValue({ value: { value: '14:30' }, headers: ['time_col'], nodeDef })
    expect(result.value).toBe('14:30')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && yarn jest:unit -t "CSV import - time value extraction"`
Expected: FAIL — `extractTimeValue` is not exported yet, and once exported (Step 3), the "truncates HH:mm:ss" case would currently throw a `SystemError` instead of truncating (today `HH:mm:ss` isn't in `allowedTimeFormats` at all).

- [ ] **Step 3: Implement**

In `server/modules/dataImport/service/DataImportJob/dataImportFlatDataFileReader.js`, change:

```js
const allowedTimeFormats = [DateUtils.formats.timeStorage, 'H:mm']
```

to:

```js
const allowedTimeFormats = [DateUtils.formats.timeStorage, 'H:mm', DateUtils.formats.timeWithSeconds, 'H:mm:ss']
```

Change:

```js
  [NodeDef.nodeDefType.time]: ({ value, headers }) => ({
    value: extractDateOrTime({
      value,
      allowedFormats: allowedTimeFormats,
      formatTo: DateUtils.formats.timeStorage,
      headers,
      errorKey: 'validationErrors:dataImport.invalidTime',
    }),
    refData: null,
  }),
```

to:

```js
  [NodeDef.nodeDefType.time]: extractTimeValue,
```

and add this named function definition right before the `nodeValueAndRefDataExtractorByNodeDefType` object (near the other extractor helpers like `extractVernacularNameUuid`/`findCategoryItem`):

```js
export const extractTimeValue = ({ value, headers, nodeDef }) => ({
  value: extractDateOrTime({
    value,
    allowedFormats: allowedTimeFormats,
    formatTo: DateUtils.getTimeFormat(nodeDef),
    headers,
    errorKey: 'validationErrors:dataImport.invalidTime',
  }),
  refData: null,
})
```

(`nodeDef` is already present in every call to the map's entries — see the `coordinate`/`taxon` entries in the same map, which already destructure it — so no change is needed at the call site that invokes `nodeValueAndRefDataExtractorByNodeDefType[type](params)`.)

In each locale's `validationErrors.js`, update the `invalidTime` message. `en`:

```js
    invalidTime:
      'Invalid time in column {{headers}}: {{value}}. Time should be formatted as HH:mm. E.g. 09:45 or 16:30',
```

to:

```js
    invalidTime:
      'Invalid time in column {{headers}}: {{value}}. Time should be formatted as HH:mm or HH:mm:ss. E.g. 09:45, 16:30 or 09:45:30',
```

`es`:

```js
    invalidTime:
      'Hora no válida en la columna {{headers}}: {{value}}. La hora debe tener el formato HH:mm. Ej.: 09:45 o 16:30',
```

to:

```js
    invalidTime:
      'Hora no válida en la columna {{headers}}: {{value}}. La hora debe tener el formato HH:mm o HH:mm:ss. Ej.: 09:45, 16:30 o 09:45:30',
```

`fr`:

```js
    invalidTime:
      "Heure invalide dans la colonne {{headers}} : {{value}}. L'heure doit être au format HH:mm. Ex. 09:45 ou 16:30",
```

to:

```js
    invalidTime:
      "Heure invalide dans la colonne {{headers}} : {{value}}. L'heure doit être au format HH:mm ou HH:mm:ss. Ex. 09:45, 16:30 ou 09:45:30",
```

`mn`:

```js
    invalidTime:
      'Багана {{headers}}-д хүчингүй цаг: {{value}}. Цагийг ЦАГ:МИНУТ форматаар байх ёстой. Жишээ нь: 09:45 эсвэл 16:30',
```

to:

```js
    invalidTime:
      'Багана {{headers}}-д хүчингүй цаг: {{value}}. Цагийг ЦАГ:МИНУТ эсвэл ЦАГ:МИНУТ:СЕКУНД форматаар байх ёстой. Жишээ нь: 09:45, 16:30 эсвэл 09:45:30',
```

`pt`:

```js
    invalidTime:
      'Hora inválida na coluna {{headers}}: {{value}}. A hora deve estar no formato HH:mm. Ex.: 09:45 ou 16:30',
```

to:

```js
    invalidTime:
      'Hora inválida na coluna {{headers}}: {{value}}. A hora deve estar no formato HH:mm ou HH:mm:ss. Ex.: 09:45, 16:30 ou 09:45:30',
```

`ru`:

```js
    invalidTime:
      'Неверное время в столбце {{headers}}: {{value}}. Время должно быть отформатировано как HH:mm. Например, 09:45 или 16:30',
```

to:

```js
    invalidTime:
      'Неверное время в столбце {{headers}}: {{value}}. Время должно быть отформатировано как HH:mm или HH:mm:ss. Например, 09:45, 16:30 или 09:45:30',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn build:test:unit && yarn jest:unit -t "CSV import - time value extraction"`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the broader unit and integration suites to check for regressions**

Run: `yarn jest:unit`
Run: `yarn test:integration` (if a local Postgres test DB is configured; otherwise skip and note it for manual/CI verification) — pay particular attention to any existing CSV-import integration test involving a `time` attribute.

- [ ] **Step 6: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add server/modules/dataImport/service/DataImportJob/dataImportFlatDataFileReader.js core/i18n/resources/*/validationErrors.js test/unit/tests/timeCsvImportExtractor.test.js
git commit -m "CSV import: accept HH:mm or HH:mm:ss for time columns regardless of includeSeconds

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 15 (arena): CSV import template sample value respects `includeSeconds`

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Modify: `server/modules/dataImport/service/dataImportTemplateService.js`
- Test: `test/unit/tests/timeImportTemplateValue.test.js` (new)

**Interfaces:**
- Consumes: `NodeDef.isSecondsIncluded` (Task 7), `DateUtils.formatTime` (Task 8).
- Produces: new named export `getTimeTemplateValue({ nodeDef }): string`.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/timeImportTemplateValue.test.js`:

```js
import { getTimeTemplateValue } from '@server/modules/dataImport/service/dataImportTemplateService'

describe('getTimeTemplateValue', () => {
  it('returns an HH:mm value when includeSeconds is not set', () => {
    const nodeDef = { props: {} }
    const value = getTimeTemplateValue({ nodeDef })
    expect(value).toMatch(/^\d{2}:\d{2}$/)
  })

  it('returns an HH:mm:ss value when includeSeconds is true', () => {
    const nodeDef = { props: { includeSeconds: true } }
    const value = getTimeTemplateValue({ nodeDef })
    expect(value).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && yarn jest:unit -t "getTimeTemplateValue"`
Expected: FAIL — `getTimeTemplateValue` is not exported yet.

- [ ] **Step 3: Implement**

In `server/modules/dataImport/service/dataImportTemplateService.js`, change:

```js
const valuesByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: () => true,
  [NodeDef.nodeDefType.code]: () => 'CATEGORY_CODE',
  [NodeDef.nodeDefType.coordinate]: ({ valueProp }) => {
    const coordinate = PointFactory.createInstance({ x: 41.8830209, y: 12.4879562 })
    return coordinate[valueProp]
  },
  [NodeDef.nodeDefType.date]: () => DateUtils.formatDateISO(new Date()),
  [NodeDef.nodeDefType.decimal]: () => 123.45,
  [NodeDef.nodeDefType.file]: ({ valueProp }) => templateFileValue[valueProp],
  [NodeDef.nodeDefType.integer]: () => 123,
  [NodeDef.nodeDefType.taxon]: () => 'TAXON_CODE',
  [NodeDef.nodeDefType.text]: () => 'Text',
  [NodeDef.nodeDefType.time]: () => {
    const now = new Date()
    return DateUtils.formatTime(now.getHours(), now.getMinutes())
  },
}
```

to:

```js
export const getTimeTemplateValue = ({ nodeDef }) => {
  const now = new Date()
  return DateUtils.formatTime(
    now.getHours(),
    now.getMinutes(),
    NodeDef.isSecondsIncluded(nodeDef) ? now.getSeconds() : undefined
  )
}

const valuesByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: () => true,
  [NodeDef.nodeDefType.code]: () => 'CATEGORY_CODE',
  [NodeDef.nodeDefType.coordinate]: ({ valueProp }) => {
    const coordinate = PointFactory.createInstance({ x: 41.8830209, y: 12.4879562 })
    return coordinate[valueProp]
  },
  [NodeDef.nodeDefType.date]: () => DateUtils.formatDateISO(new Date()),
  [NodeDef.nodeDefType.decimal]: () => 123.45,
  [NodeDef.nodeDefType.file]: ({ valueProp }) => templateFileValue[valueProp],
  [NodeDef.nodeDefType.integer]: () => 123,
  [NodeDef.nodeDefType.taxon]: () => 'TAXON_CODE',
  [NodeDef.nodeDefType.text]: () => 'Text',
  [NodeDef.nodeDefType.time]: getTimeTemplateValue,
}
```

And in `extractDataImportTemplate`, change:

```js
  const template = exportModel.columns.reduce((acc, column) => {
    const { header, nodeDef, valueProp } = column
    const value = nodeDef ? valuesByNodeDefType[NodeDef.getType(nodeDef)]({ valueProp }) : ''
    return { ...acc, [header]: value }
  }, {})
```

to:

```js
  const template = exportModel.columns.reduce((acc, column) => {
    const { header, nodeDef, valueProp } = column
    const value = nodeDef ? valuesByNodeDefType[NodeDef.getType(nodeDef)]({ valueProp, nodeDef }) : ''
    return { ...acc, [header]: value }
  }, {})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn build:test:unit && yarn jest:unit -t "getTimeTemplateValue"`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add server/modules/dataImport/service/dataImportTemplateService.js test/unit/tests/timeImportTemplateValue.test.js
git commit -m "CSV import template: sample time value respects includeSeconds

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 16 (arena): record keys and record-summary export respect `includeSeconds`

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:**
- Modify: `webapp/views/App/views/Data/Records/recordKeyValuesExtractor.js`
- Modify: `server/modules/record/service/recordService.js`
- Test: `test/unit/tests/timeRecordKeyAndSummaryFormat.test.js` (new)

**Interfaces:**
- Consumes: `NodeDef.isSecondsIncluded` (Task 7), `DateUtils.formats.timeStorage`/`timeWithSeconds` (Task 8).
- Produces: named exports `formatTimeKeyValue({ value, nodeDef })` (from `recordKeyValuesExtractor.js`) and `formatTimeSummaryValue({ value, nodeDef })` (from `recordService.js`), extracted from their respective inline maps for direct unit testing.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/timeRecordKeyAndSummaryFormat.test.js`:

```js
import { formatTimeKeyValue } from '@webapp/views/App/views/Data/Records/recordKeyValuesExtractor'
import { formatTimeSummaryValue } from '@server/modules/record/service/recordService'

describe('time formatting for record keys and record summary export', () => {
  it('formatTimeKeyValue truncates to HH:mm when includeSeconds is not set', () => {
    const nodeDef = { props: {} }
    expect(formatTimeKeyValue({ value: '14:30:45', nodeDef })).toBe('14:30')
  })

  it('formatTimeKeyValue keeps HH:mm:ss when includeSeconds is true', () => {
    const nodeDef = { props: { includeSeconds: true } }
    expect(formatTimeKeyValue({ value: '14:30:45', nodeDef })).toBe('14:30:45')
  })

  it('formatTimeSummaryValue truncates to HH:mm when includeSeconds is not set', () => {
    const nodeDef = { props: {} }
    expect(formatTimeSummaryValue({ value: '14:30:45', nodeDef })).toBe('14:30')
  })

  it('formatTimeSummaryValue keeps HH:mm:ss when includeSeconds is true', () => {
    const nodeDef = { props: { includeSeconds: true } }
    expect(formatTimeSummaryValue({ value: '14:30:45', nodeDef })).toBe('14:30:45')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && yarn jest:unit -t "time formatting for record keys and record summary export"`
Expected: FAIL — neither `formatTimeKeyValue` nor `formatTimeSummaryValue` is exported yet, and both currently ignore `includeSeconds` (always truncate to `HH:mm`).

- [ ] **Step 3: Implement**

In `webapp/views/App/views/Data/Records/recordKeyValuesExtractor.js`, change:

```js
  [NodeDef.nodeDefType.time]: ({ value }) =>
    DateUtils.convertDate({
      dateStr: value,
      formatFrom: 'HH:mm:ss',
      formatTo: DateUtils.formats.timeStorage,
    }),
```

to:

```js
  [NodeDef.nodeDefType.time]: formatTimeKeyValue,
```

and add, right before the `valueFormattersByType` object:

```js
export const formatTimeKeyValue = ({ value, nodeDef }) =>
  DateUtils.convertDate({
    dateStr: value,
    formatFrom: 'HH:mm:ss',
    formatTo: DateUtils.getTimeFormat(nodeDef),
  })
```

(`nodeDef` is already passed into every formatter by `extractKeyOrSummaryValue` — see the `formatter({ survey, srsIndex, cycle, nodeDef, value, ... })` call — so no change is needed at that call site.)

In `server/modules/record/service/recordService.js`, change:

```js
  const valueFormattersByType = {
    [NodeDef.nodeDefType.date]: ({ value }) =>
      DateUtils.convertDate({
        dateStr: value,
        formatFrom: DateUtils.formats.datetimeISO,
        formatTo: DateUtils.formats.dateDefault,
      }),
    [NodeDef.nodeDefType.time]: ({ value }) =>
      DateUtils.convertDate({ dateStr: value, formatFrom: 'HH:mm:ss', formatTo: DateUtils.formats.timeStorage }),
  }
```

to:

```js
  const valueFormattersByType = {
    [NodeDef.nodeDefType.date]: ({ value }) =>
      DateUtils.convertDate({
        dateStr: value,
        formatFrom: DateUtils.formats.datetimeISO,
        formatTo: DateUtils.formats.dateDefault,
      }),
    [NodeDef.nodeDefType.time]: formatTimeSummaryValue,
  }
```

and add this export near the top of the file (module scope, before `exportRecordsSummary`):

```js
export const formatTimeSummaryValue = ({ value, nodeDef }) =>
  DateUtils.convertDate({ dateStr: value, formatFrom: 'HH:mm:ss', formatTo: DateUtils.getTimeFormat(nodeDef) })
```

Then, inside `exportRecordsSummary`'s `objectTransformer`, change:

```js
        nodeDefKeyColumnNames.forEach((nodeDefKeyColumnName) => {
          const value = recordSummary[A.camelize(nodeDefKeyColumnName)]
          const formatter = valueFormattersByType[NodeDef.getType(nodeDefKey)]
          const valueFormatted = formatter ? formatter({ value }) : value
          keysAcc[nodeDefKeyColumnName] = valueFormatted
        })
```

to:

```js
        nodeDefKeyColumnNames.forEach((nodeDefKeyColumnName) => {
          const value = recordSummary[A.camelize(nodeDefKeyColumnName)]
          const formatter = valueFormattersByType[NodeDef.getType(nodeDefKey)]
          const valueFormatted = formatter ? formatter({ value, nodeDef: nodeDefKey }) : value
          keysAcc[nodeDefKeyColumnName] = valueFormatted
        })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn build:test:unit && yarn jest:unit -t "time formatting for record keys and record summary export"`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full unit suite to check for regressions**

Run: `yarn jest:unit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add webapp/views/App/views/Data/Records/recordKeyValuesExtractor.js server/modules/record/service/recordService.js test/unit/tests/timeRecordKeyAndSummaryFormat.test.js
git commit -m "Record keys and record-summary export: respect includeSeconds

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 17 (arena): end-to-end manual verification

**Repo:** `/home/stefano/dev/projects/openforis/arena`

**Files:** none (manual QA pass, no code changes)

- [ ] **Step 1: Run the full automated suites one more time**

```bash
cd /home/stefano/dev/projects/openforis/arena-core && npx jest
cd /home/stefano/dev/projects/openforis/arena && yarn build:test:unit && yarn jest:unit
```

Expected: PASS across both repos.

- [ ] **Step 2: Manual browser walkthrough**

With `yarn watch` running against a local dev DB:

1. Create a `time` attribute in a test survey. Confirm data entry shows only hours/minutes (unchanged default behavior).
2. In the Designer, open that attribute's properties and turn on "Include seconds". Save the survey.
3. Enter a record, set a value with seconds on that attribute, save.
4. Open Data > Explorer, confirm the column shows `HH:mm:ss` for that row.
5. Export the survey's data to CSV, confirm the exported value includes seconds.
6. Download the CSV import template for that entity, confirm the sample time value includes seconds; edit it and re-import, confirm it's accepted.
7. Import a CSV with an `HH:mm` (no-seconds) value into the seconds-on attribute — confirm it's accepted, not rejected.
8. Turn "Include seconds" back off. Reload the record from step 3 — confirm the previously-entered value with seconds is not lost/corrupted (the raw value is intact; re-enable the setting later and confirm the original seconds still show).
9. Import a CSV with an `HH:mm:ss` value into a seconds-off attribute — confirm it's accepted and truncated to `HH:mm`, not rejected.

- [ ] **Step 3: Report results**

Note any discrepancy against the design spec (`docs/superpowers/specs/2026-09-11-time-node-def-seconds-design.md`) back to the user before considering the feature complete. No commit for this task.

---

## Deferred follow-up (explicitly out of scope for this plan)

- Bump `@openforis/arena-core`'s version and publish it to npm.
- Update `arena`'s `package.json` to depend on the new `@openforis/arena-core` version, then `yarn install`.
- Proper translation review of the new/changed i18n strings by native speakers (the translations added in Tasks 10 and 14 are reasonable best-effort, not reviewed by a translator).
