# Time node def: optional seconds — design

## Context

Time attributes (`nodeDefType.time`) are always captured, stored, validated,
exported, and displayed as `HH:mm` (no seconds), via a hardcoded format
constant (`DateFormats.timeStorage = 'HH:mm'`) that recurs across the webapp
input, `core/dateUtils`, the RDB/CSV export pipeline, CSV import, and the
shared `@openforis/arena-core` package (record validation, value comparison,
expression value conversion).

This adds an opt-in, per-node-def **"Include seconds"** setting so a time
attribute can capture/display/export `HH:mm:ss` instead, without breaking
existing surveys or existing recorded data.

Repos touched: this repo (`arena`) and its sibling `arena-core`
(`/home/stefano/dev/projects/openforis/arena-core`, published as
`@openforis/arena-core`). Per agreed scope, `arena-core` is edited and
committed on its own `feat/time-seconds` branch but **not published**; a
version bump/publish and dependency bump in `arena`'s `package.json` is a
follow-up outside this change. New modules are written in TypeScript;
existing JS files being extended stay JS.

## Data model

### New prop: `includeSeconds`

Follows the existing coordinate-attribute pattern (`includeAccuracy`,
`includeAltitude` → `isAccuracyIncluded`, `isAltitudeIncluded`), not a
type-prefixed name.

- `core/survey/nodeDef.js`: add `includeSeconds: 'includeSeconds'` to
  `propKeys`, under a new `// Time` comment block. Add accessor
  `export const isSecondsIncluded = ObjectUtils.isPropTrue(propKeys.includeSeconds)`.
- `arena-core/src/nodeDef/types/time.ts`: add
  `export interface NodeDefTimeProps extends NodeDefProps { includeSeconds?: boolean }`
  and change `NodeDefTime` to `NodeDef<NodeDefType.time, NodeDefTimeProps>`
  (mirrors `NodeDefFileProps`/`NodeDefFile`). Export the new type from
  `arena-core/src/nodeDef/index.ts` alongside the other per-type exports.
- `arena-core/src/nodeDef/nodeDefs.ts`: add
  `isSecondsIncluded = (nodeDef: NodeDefTime): boolean => !!nodeDef.props.includeSeconds`,
  exported from `NodeDefs` (mirrors `isGeotagInformationShown`).

Default is `undefined`/falsy everywhere → **existing surveys are unaffected
until an admin explicitly opts in.**

### Format helper

- `core/dateUtils.ts`: add `timeWithSeconds: DateFormats.timeWithSeconds` to
  the exported `formats` object (the enum value `'HH:mm:ss'` already exists
  in arena-core, just wasn't re-exported here).
- Add a small helper `export const getTimeFormat = (nodeDef) => NodeDef.isSecondsIncluded(nodeDef) ? formats.timeWithSeconds : formats.timeStorage`
  in `core/dateUtils.ts` — this becomes the single place every consumer below
  calls into, instead of each re-deriving the ternary.

## Value getters and validation

### `getTimeSeconds` accessor (new, parallel to `getTimeHour`/`getTimeMinute`)

- `core/record/node.js`: add `export const getTimeSeconds = _getTimePart(2)`,
  add `[valuePropsTime.seconds]: getTimeSeconds` to `_timePropGetters`.
- `core/survey/nodeValueProps.js`: add `seconds: 'seconds'` to
  `valuePropsTime`.
- `arena-core/src/node/nodeValueProps.ts`: add `seconds = 'seconds'` to
  `ValuePropsTime`.
- `arena-core/src/node/nodeValues.ts`: add `getTimeSeconds = _getTimePart(2)`
  and wire it into `_timePropGetters`.

When a value has no third `:`-part, `getTimeSeconds` naturally evaluates to
`0` (via the existing `Number(StringUtils.trim(undefined))` →
`Number('')` → `0` path already used by the hour/minute getters) — no nil
special-casing needed. This also means expressions can now reference
`someTimeAttr.seconds` (previously only `.hour`/`.minute` were valid
properties), consistent across both repos.

### `isValidTime` — optional third parameter

- `core/dateUtils.ts` and `arena-core/src/utils/dates.ts`: extend
  `isValidTime(hour, minutes, seconds = 0)` to additionally require
  `Number(seconds) >= 0 && Number(seconds) < 60`. Since a missing seconds
  part already evaluates to `0`, **every existing 2-arg call site keeps
  passing** — this purely adds a range check when a third value is present.
- `arena-core/src/record/recordValidator/attributeTypeValidator.ts`
  (the validator actually run by `RecordValidator.validateNodes` on every
  record edit): pull `NodeValues.getTimeSeconds(node)` alongside hour/minute
  and pass it to `Dates.isValidTime`. No dependency on the node def's
  `includeSeconds` setting — an out-of-range seconds part is invalid
  regardless of whether the attribute currently shows a seconds field.
- `arena-core/src/record/recordExpressionEvaluator/nodeValueExtractor.ts`:
  same 3-arg extension, for consistency (this path independently decides
  whether an attribute's value is "valid enough" to expose to expressions).

## Value comparison (search / expression equality)

- `arena-core/src/node/nodeValues.ts` (`valueComparatorByNodeDefType[time]`)
  and `core/record/nodeValues.js` (its arena-side duplicate): change
  `formatTo` from `DateFormats.timeStorage` to `DateFormats.timeWithSeconds`
  in the existing `dateTimeComparator({ formatsSource: [timeStorage,
  timeWithSeconds], formatTo })` config. Comparing at the finer granularity
  is a strict superset of today's behavior (an `"HH:mm"` value converts to
  `"HH:mm:00"`, matching another `"HH:mm"` value converted the same way) and
  needs no nodeDef awareness — the config-level format is fixed, not looked
  up per attribute.

## Data entry (webapp)

### Designer: new `includeSeconds` toggle

- New **`webapp/components/survey/NodeDefDetails/TimeProps.tsx`** (new
  module → TypeScript): a single `Checkbox` bound to
  `NodeDef.propKeys.includeSeconds`, same shape as `FileProps.js`'s
  "Show geotag information" checkbox (`Actions.setProp({ state, key, value
  })`), labeled via a new i18n key `nodeDefEdit.timeProps.includeSeconds`.
- `webapp/components/survey/NodeDefDetails/BasicProps/BasicProps.js`:
  import `TimeProps` and add
  `[NodeDef.nodeDefType.time]: TimeProps` to `basicPropsComponentByType`.

### Data entry widget

- `webapp/components/form/DateTimeInput/TimeInput.js`: add a `withSeconds`
  boolean prop (default `false`). When `true`, pass
  `views={['hours', 'minutes', 'seconds']}` and use
  `DateUtils.formats.timeWithSeconds` as `valueFormat` (currently a
  module-level constant; make it a value computed from the prop instead).
  `ampm={false}` stays as-is.
- `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefTime.js`:
  read `NodeDef.isSecondsIncluded(nodeDef)` and pass it through as
  `withSeconds` to `TimeInput`.
- `webapp/components/form/DateTimeInput/useDateTimeInput.js`: unchanged —
  it's already generic over `valueFormat`.

Existing recorded values keep whatever precision they have; toggling the
setting only changes what the widget captures/shows on the *next* edit of a
value (see Backward compatibility below).

## Server: RDB view / CSV export / Data Explorer / CSV import

All three read paths for a `time` node def value are affected because they
each independently hardcode a time format; here is the concrete change to
each.

### 1. RDB column write (`common/model/db/tables/dataNodeDef/dataColProps.js`)

Currently hardcodes `:00` for the Postgres `time`-typed RDB column
regardless of what the record actually holds:

```js
[nodeDefType.time]: {
  [colValueProcessor]: ({ nodeCol }) => {
    const [hour, minute] = [Node.getTimeHour(nodeCol), Node.getTimeMinute(nodeCol)]
    return () =>
      DateTimeUtils.isValidTime(hour, minute) ? `${hour}:${StringUtils.padStart(2, '0')(minute)}:00` : null
  },
},
```

Change to write the record's *actual* seconds (`0` when absent, via the new
`getTimeSeconds` getter) — **not** conditioned on `includeSeconds`: the RDB
column should always faithfully mirror the record value's real precision,
so that toggling the setting later never loses already-recorded seconds:

```js
[nodeDefType.time]: {
  [colValueProcessor]: ({ nodeCol }) => {
    const [hour, minute, seconds] = [Node.getTimeHour(nodeCol), Node.getTimeMinute(nodeCol), Node.getTimeSeconds(nodeCol)]
    return () =>
      DateTimeUtils.isValidTime(hour, minute, seconds)
        ? `${hour}:${StringUtils.padStart(2, '0')(minute)}:${StringUtils.padStart(2, '0')(seconds)}`
        : null
  },
},
```

### 2. RDB column read / Data Explorer / CSV+R export (`server/modules/surveyRdb/repository/dataView/read.js`)

`columnTransformByNodeDefType[time]` currently ignores which node def is
being read:

```js
[NodeDef.nodeDefType.time]: ({ nameFull, alias }) => [`TO_CHAR(${nameFull}, 'HH24:MI') AS ${DbUtils.asName(alias)}`],
```

The enclosing `_selectFieldsByNodeDefType` already has `nodeDefCol` in
scope but doesn't pass it to the transform function — add it, and branch
the `TO_CHAR` pattern on the node def's setting:

```js
[NodeDef.nodeDefType.time]: ({ nodeDefCol, nameFull, alias }) => [
  `TO_CHAR(${nameFull}, '${NodeDef.isSecondsIncluded(nodeDefCol) ? 'HH24:MI:SS' : 'HH24:MI'}') AS ${DbUtils.asName(alias)}`,
],
```

(`_selectFieldsByNodeDefType` passes `nodeDefCol` into every
`columnTransform` call — one-line addition to the existing call.)

This is the single choke point behind the Data Explorer table, CSV data
export, and the R analysis input (`CSVDataExtractionJob` →
`SurveyRdbService` → this view) — no separate change needed in those.

### 3. CSV import (`server/modules/dataImport/service/DataImportJob/dataImportFlatDataFileReader.js`)

- Extend `allowedTimeFormats` to accept seconds too, **regardless of the
  attribute's setting** (lenient on read):
  `[DateUtils.formats.timeStorage, 'H:mm', DateUtils.formats.timeWithSeconds, 'H:mm:ss']`.
- The `[NodeDef.nodeDefType.time]` extractor already receives `nodeDef` in
  its params (same object shape as the `coordinate`/`taxon` extractors
  above it) — use it to pick `formatTo`:
  `formatTo: DateUtils.getTimeFormat(nodeDef)`.
- Net effect: importing `"14:30:45"` into a seconds-off attribute silently
  truncates to `"14:30"` (consistent with "derived views reflect current
  setting, not a hard rejection"); importing `"14:30"` into a seconds-on
  attribute stores `"14:30"` (no forced `:00`).
- `core/i18n/resources/en/validationErrors.js` (`invalidTime` message):
  reword to mention both accepted shapes, e.g. *"Time should be formatted
  as HH:mm or HH:mm:ss. E.g. 09:45, 16:30 or 09:45:30"*. Mirror the
  English text into the other locale files (`es`, `fr`, `mn`, `pt`, `ru`)
  so nothing falls back to a raw key.

### 4. CSV import template (`server/modules/dataImport/service/dataImportTemplateService.js`)

- `extractDataImportTemplate`'s reduce already has `nodeDef` in scope
  (destructured from `column`) but doesn't pass it into
  `valuesByNodeDefType[...]`; add it:
  `valuesByNodeDefType[NodeDef.getType(nodeDef)]({ valueProp, nodeDef })`.
- Time entry becomes:
  ```js
  [NodeDef.nodeDefType.time]: ({ nodeDef }) => {
    const now = new Date()
    return DateUtils.formatTime(now.getHours(), now.getMinutes(), NodeDef.isSecondsIncluded(nodeDef) ? now.getSeconds() : undefined)
  },
  ```
  (`formatTime` gains an optional third param — see below.)

### `formatTime` — optional third parameter

- `core/dateUtils.ts`: `formatTime(hour, minute, seconds)` → when `seconds`
  is provided, append `:${normalizeDateTimeValue(2)(seconds)}`; otherwise
  unchanged 2-part output. The one other existing caller
  (`collectAttributeValueExtractor.js`, Collect-import time extraction)
  keeps calling it with 2 args — Collect's own time type never had
  seconds, so this is correct as-is, not a gap.

## Record keys / record summary export

Two spots read the RDB's native Postgres `time` column serialization
(always `HH:mm:ss`, independent of the TO_CHAR change above, which only
applies to the separate dataView query) and hardcode the *output* format
down to `HH:mm`:

- `webapp/views/App/views/Data/Records/recordKeyValuesExtractor.js`
  (`valueFormattersByType[time]`): `nodeDef` is already passed into the
  formatter (see `extractKeyOrSummaryValue`) — change `formatTo` from
  `DateUtils.formats.timeStorage` to
  `NodeDef.isSecondsIncluded(nodeDef) ? DateUtils.formats.timeWithSeconds : DateUtils.formats.timeStorage`.
  `formatFrom` stays `'HH:mm:ss'` (that's the raw Postgres serialization,
  unrelated to the setting).
- `server/modules/record/service/recordService.js`
  (`exportRecordsSummary`'s `valueFormattersByType[time]`): the caller
  (`objectTransformer`) doesn't currently pass `nodeDef` into the
  formatter — add it (`formatter({ value, nodeDef: nodeDefKey })`), then
  apply the same conditional `formatTo` as above.

## Expression value conversion (arena-core)

`arena-core/src/record/recordNodesUpdater/recordExpressionValueConverter.ts`,
`_valueExprToValueNodeFns[NodeDefType.time]`: currently hardcodes
`format: DateFormats.timeStorage` and omits `timeWithSeconds` from
`formatsFrom`. The full `ToNodeValueParams` (including `nodeDef`) is passed
in by the caller even though the narrowed inline type only lists
`valueExpr`/`timezoneOffset` — widen the destructure to include `nodeDef`
and:

```ts
[NodeDefType.time]: (params: { nodeDef: NodeDef<any>; valueExpr: any; timezoneOffset?: number }) => {
  const { nodeDef, valueExpr, timezoneOffset } = params
  return _toDateTime({
    valueExpr,
    format: NodeDefs.isSecondsIncluded(nodeDef) ? DateFormats.timeWithSeconds : DateFormats.timeStorage,
    formatsFrom: [DateFormats.datetimeStorage, DateFormats.datetimeDefault, DateFormats.timeWithSeconds, DateFormats.timeStorage],
    timezoneOffset,
  })
},
```

This means a formula like `now()` assigned as a default/calculated value to
a seconds-enabled time attribute keeps its seconds instead of always being
truncated.

## i18n

`core/i18n/resources/en/common.js`, under `nodeDefEdit`, add a `timeProps`
block next to the existing `fileProps`/`mobileProps` ones:

```js
timeProps: {
  includeSeconds: 'Include seconds',
},
```

Mirror the same key (English placeholder text) into `es`, `fr`, `mn`,
`pt`, `ru` — consistent with how other recent additions handled
translation (proper translation review is a follow-up, not part of this
change).

## Backward compatibility (explicit trade-offs)

- **Surveys that never enable `includeSeconds`:** byte-for-byte identical
  behavior to today at every layer. Zero risk.
- **Turning it ON for an attribute with existing `"HH:mm"` values:** those
  values are never rewritten. They display/validate exactly as before
  (missing seconds ⇒ treated as `0`, always valid) and simply show no
  seconds in the input until someone re-edits that specific value. The RDB
  column already stores real (`:00`-inferred) seconds today, so Data
  Explorer/CSV/R output for old rows will show `:00` once the setting is
  flipped on — accurate, not misleading.
- **Turning it OFF for an attribute with existing `"HH:mm:ss"` values:**
  the record's raw JSON value is never rewritten or truncated. The RDB
  column keeps the real seconds (write path is setting-independent, see
  above). Only the **derived, read-time projections** (Data Explorer
  table, CSV export, R analysis input, record key/summary display) start
  rendering `HH:mm` going forward — i.e. toggling the setting off changes
  what analysis/export outputs show without touching the source record.
  This is called out here explicitly as an accepted trade-off, not
  something to migrate/backfill.
- **CSV import stays lenient in both directions** regardless of the
  setting (accepts `HH:mm` or `HH:mm:ss` on input, truncates to the
  attribute's configured format on write) rather than rejecting
  mismatched-precision input.

## Out of scope

- No migration/backfill of existing `time` attribute values.
- No change to the Collect-import time extraction (source data has no
  seconds).
- No change to how the expression editor's autocomplete suggests
  attribute properties (no hardcoded `hour`/`minute` list exists in the
  webapp to extend — `seconds` becomes usable the same implicit way
  `hour`/`minute` already are).
- No `arena-core` version bump / npm publish / `arena` dependency bump
  (explicitly deferred, per agreed scope).

## Testing

- `arena-core` unit tests: extend `utils/dates.test.ts` (`isValidTime` with
  a seconds arg), `node/nodeValues.test.ts` (`getTimeSeconds`, comparator
  with `HH:mm` vs `HH:mm:ss` inputs), `record/recordValidator` tests
  (attribute validity with out-of-range seconds), and
  `recordExpressionValueConverter` tests (time value conversion respecting
  `includeSeconds`).
- `arena` unit tests: `core/dateUtils` (`formatTime`/`isValidTime` new
  param), `core/record/node` / `core/survey/nodeDef` (`getTimeSeconds`,
  `isSecondsIncluded`).
- `arena` integration tests: RDB column read/write round-trip for a
  seconds-enabled attribute (`dataColProps`/`read.js`).
- `arena` e2e: extend `test/e2e/tests/_record/utils.js` and
  `test/e2e/tests/exportCsvData.js` (which currently assert `HH:mm`) with a
  seconds-enabled scenario; add a Designer test toggling "Include seconds"
  and entering/reading back a value with seconds.
- Manual verification in the browser: create a time attribute, toggle
  "Include seconds" on, enter a value with seconds in data entry, confirm
  it shows correctly in the Data Explorer and in a CSV export; toggle it
  back off and confirm old data isn't lost (re-enabling shows the original
  seconds again); import a CSV with `HH:mm:ss` values into a seconds-off
  attribute and confirm it's accepted and truncated rather than rejected.
