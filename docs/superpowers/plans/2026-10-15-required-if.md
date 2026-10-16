# Conditionally Required Attributes ("Required if") Implementation Plan

**Goal:** Let survey designers make a single attribute required only when a condition is met, using the same
expression editor as the relevancy (`applicable`) and `editableIf` conditions. Today the only option is the
"Required" checkbox in the node def details, Validations tab (`validations.required: boolean`).

**Repositories involved:** `arena-core` (model, dependency graph, record validation), `arena` (designer UI, survey
validation, imports, schema summary, record UI), `arena-mobile` (dependency bump only, no code required).
`arena-server` is not affected.

## Design

### Data model (backwards compatible)

Add one optional property next to the existing ones in `NodeDefValidations` (`arena-core/src/nodeDef/nodeDef.ts`):

```ts
export interface NodeDefValidations {
  count?: NodeDefCountValidations
  expressions?: NodeDefExpression[]
  required?: boolean
  requiredIf?: NodeDefExpression[] // NEW
  unique?: boolean
}
```

The designer offers three mutually exclusive modes, stored as follows:

| Mode                           | `required`       | `requiredIf`    |
| ------------------------------ | ---------------- | --------------- |
| Not required (default)         | absent / `false` | absent / empty  |
| Always required (today's flag) | `true`           | absent / empty  |
| Required when condition is met | absent / `false` | non-empty array |

Why this shape:

- **Existing surveys are untouched:** no DB migration, no data migration. `required: true` keeps meaning "always
  required"; surveys without `requiredIf` behave exactly as today.
- **Old clients degrade leniently:** an old arena-core (e.g. an outdated Arena Mobile install) ignores `requiredIf`,
  sees `required: false` and simply does not flag the missing value on the device. It never shows a false
  "value required" error that the user cannot fix. The server re-validates records on upload/import and on the
  "Validate records" job, so the error is still reported there.
- Re-uses `NodeDefExpression` (`expression` + `applyIf`), so the existing `NodeDefExpressionsProp` editor, the
  expression validator and the dependency graph builder work unchanged.
- Stays inside `propsAdvanced.validations`, so publish/unpublish (`propsAdvancedDraft`), survey clone, backup
  export/import and the activity log already carry it with no changes.

Alternative considered and rejected: `required: true` + `requiredIf` (condition narrowing the flag). Old clients would
then treat every conditional attribute as always required and flag errors in the field that should not exist.

Scope: like the current checkbox, only **single, non-key attributes** (multiple attributes/entities use
min count, which already supports expressions; key attributes are always required). Entities are excluded because
`required` is not enforced for entities by the record validator.

### Decisions (agreed)

- **Three exclusive options**: not required / always required / required when condition is met.
- **Always an error** when a required value is missing (same severity as today's `required`, no severity selector).
- **Table layouts (multiple entities)**: no asterisk in the cells; conditionally required cells just show the
  existing validation feedback. Headers show the asterisk only for always-required attributes.
- **No asterisk on key attributes** (web and mobile): the key icon is enough. The marker condition is
  `!isKey && Records.isNodeRequired(...)` (`isNodeRequired` itself stays true for keys, for validation/completion).
- **The data entry form marks the attribute as required** (web and mobile) when it is always required, or when its
  condition is met in that entity. Today no required marker is shown at all, so the marker is new for both cases.

### Evaluation: stored flag on the parent node, like `editableIf` / `visibleIf`

The form marker needs a synchronous, per-node answer ("is this attribute required _here, now_?"). The web form does
not run the record updater on the client (updates come from the server), so the answer must travel with the nodes.
We therefore follow the `editableIf` (`cEdit`) / `visibleIf` (`cVis`) pattern:

- new parent node meta `cReq?: { [childDefUuid]: boolean }`, computed by a new
  `recordNodeDependentsRequiredUpdater` (dependency type `required`) whenever a referenced node changes or an entity
  is created;
- only stored for child defs with `requiredIf` (explicit `true`/`false`); **absent = not computed**;
- `Records.isNodeRequired(node)(record)` (sync): `isKey || required || (requiredIf && parent.meta.cReq[defUuid] === true)`;
  used by the validator, the form marker, completion stats and the record tree status.

Existing records (created before the condition was defined or changed) must not get a stale or missing flag:

- **Validator fallback**: if the def has `requiredIf` and the flag is absent, the validator evaluates the condition
  itself. Validation is therefore always correct, including the "Validate records" job and records uploaded by old
  mobile versions (which do not compute `cReq`).
- **On publish** (`RecordCheckJob`), node defs whose `requiredIf` changed are put in a dedicated bucket: only their
  `cReq` flags are recomputed (via a new arena-core helper), then the nodes are re-validated. They are **not** added
  to the "value affecting" bucket, so default values/code attributes are not touched (see the comment on
  `_classifyNodeDefs` about dependent code values being wiped).

Note: today `editableIf`/`visibleIf` flags are not refreshed on publish for existing records either; out of scope
here, but the new helper could be generalised later.

Expression context: the **parent entity** (same as `applicable` / `editableIf`), self reference **not allowed**
(a "required if" that depends on the attribute's own value is meaningless).

Re-validation when a referenced attribute changes: `SurveyDependencyType.required` is added to the dependency graph
and to the dependency types used to collect the nodes to re-validate after an update (the flag updater runs first,
inside `updateNodesDependents`, so validation sees the updated flag).

---

## Part 1 — arena-core (`feat: conditionally required attributes (requiredIf)`)

PR title must start with `feat:` (minor bump, see CLAUDE.md). No `BREAKING CHANGE`/`major` words.

### 1.1 Model and getters

- `src/nodeDef/nodeDef.ts`: add `requiredIf?: NodeDefExpression[]` to `NodeDefValidations`.
- `src/nodeDef/nodeDefs.ts`:
  - `getRequiredIf(nodeDef): NodeDefExpression[]` → `getValidations(nodeDef)?.requiredIf ?? []`
  - `isRequiredIfDefined(nodeDef): boolean` (non-empty `requiredIf`)
  - `isRequiredOrConditionallyRequired(nodeDef)` (`isRequired || isRequiredIfDefined`) for static, def-level
    answers (designer, schema summary, page "has completable attributes" check).
  - Keep `isRequired` semantics unchanged ("always required").
- `src/tests/builder/surveyBuilder/nodeDefBuilder.ts`: `requiredIf(...expressions: (string | NodeDefExpression)[])`,
  mirroring `editableIf(...)`.

### 1.2 Dependency graph

- `src/survey/survey.ts`: add `required = 'required'` to `SurveyDependencyType`.
- `src/survey/surveys/dependencies.ts`:
  - `isContextParentByDependencyType[required] = true`, `selfReferenceAllowedByDependencyType[required] = false`;
  - in `addNodeDefDependencies`: `_addDependencies(SurveyDependencyType.required, NodeDefs.getRequiredIf(nodeDef))`.
- Check `removeNodeDefDependencies` / graph initialisation iterate over all `SurveyDependencyType` values (a survey
  graph built by an older version simply lacks the `required` key: getters must default to `{}`; it is rebuilt on
  survey load anyway).

### 1.3 Node meta, getters and updater

- `src/node/node.ts`: `NodeMeta.cReq?: { [uuid: string]: boolean }` (doc comment like `cEdit`).
- `src/node/nodes.ts`: `getChildRequired(node, nodeDefUuid): boolean | undefined`, `assocChildRequired(...)`
  (options object, `MutationOptions`), `dissocChildRequired(...)`.
- `src/record/_records/recordGetters.ts`: `isNodeRequired(node)(record)` (positional, allocation-free, see CLAUDE.md
  "Record getters"); exported through `Records`.
- `src/record/recordNodesUpdater/recordNodeDependentsBooleanUpdater.ts`: today, with no expressions, it returns
  `true` (the editable/visible default). Add a `defaultValue` param (default `true`, unchanged for existing callers)
  and skip pointers whose def has no expressions when `defaultValue` is `false`, so `cReq` is never written for defs
  without `requiredIf` (new entities create pointers for all child defs).
- New `recordNodeDependentsRequiredUpdater.ts` (`dependencyType: required`, `getExpressions: getRequiredIf`,
  `getValuePrev: getChildRequired`, `assocValue: assocChildRequired`, `defaultValue: false`), registered in
  `dependentsUpdaters` (`recordNodesUpdater.ts`) after `updateSelfAndDependentsEditable`.
- New helper for the publish job: `RecordUpdater.updateRequiredFlags({ user, survey, record, nodeDefUuids, sideEffect })`:
  for every parent entity of the nodes of those defs, recompute (or dissoc, if `requiredIf` was removed) the `cReq`
  entry; returns a `RecordUpdateResult` with the updated parent nodes.

### 1.4 Record validation

- `src/record/recordValidator/attributeValidator.ts`, `_validateRequired`:
  - becomes async and receives `{ user, survey, record, nodeDef }`;
  - a non-blank value is valid (short-circuit, no evaluation);
  - `isKey || isRequired` → as today;
  - `requiredIf` defined → use the parent flag `cReq`; if absent, evaluate with
    `expressionEvaluator.evalApplicableExpression({ user, survey, record, nodeCtx: parentNode, expressions })`;
  - always severity `error`, same key `record.attribute.valueRequired` → no new i18n key in clients.
- `src/record/recordUpdater.ts`: add `SurveyDependencyType.required` to `validationDependencyTypes`.
- `findSortedNodesToValidate` (same file): also collect dependents of type `required` (today only `validations`).

### 1.4b Completion / pages validation

- `src/record/_records/recordCompletion.ts` (`getAttributeCompletionStats`): replace
  `!NodeDefs.isRequired(nodeDef) && !NodeDefs.isKey(nodeDef)` with "not required for this node": for single
  attributes use `Records.isNodeRequired(node)(record)` (attribute with condition not met → not counted).
- `recordPagesValidation`: relies on record validation (no change expected; add a test).

### 1.5 Tests (Jest, using `SurveyBuilder`/`RecordBuilder`)

- `recordUpdater.attributeUpdate.dependentRequiredIf.test.ts` (new): attribute `b` with `requiredIf('a == 1')`:
  - `a` empty → `b` blank is valid; set `a = 1` → `b` gets `valueRequired`; fill `b` → valid; set `a = 2` with `b`
    blank → valid again;
  - `applyIf` on the expression honoured;
  - inside a multiple entity, context = parent entity instance (two instances with different `a`).
- `attributeValidator`: `required: true` without `requiredIf` unchanged (existing tests stay green);
  `requiredIf` ignored for key attributes (always required).
- `dependencies` test: `requiredIf` adds `required` dependency; self reference rejected.
- `nodeDefs` getters tests.
- `recordNodesUpdater.requiredIf.test.ts`: `cReq` set/updated when the referenced attribute changes and on entity
  creation; never written for defs without `requiredIf`; editable/visible behaviour unchanged (existing tests).
- Validator fallback: record without `cReq` (simulating an old record) still validated correctly.
- `updateRequiredFlags` helper: computes, updates and removes flags.

## Part 2 — arena

Bump `@openforis/arena-core` (and `@openforis/arena-server` if it pins arena-core) to the released version, then
`yarn dedupe @openforis/arena-core` (CI checks a single arena-core version).

### 2.1 Core (isomorphic)

- `core/survey/nodeDefValidations.js`: `keys.requiredIf`, `getRequiredIf`, `assocRequiredIf(expressions)` (dissoc when
  empty, like `assocCountProp`), `dissocRequiredIf`.
- `core/survey/nodeDef.js`:
  - `hasValidations` (line ~465): also true when `requiredIf` is non-empty;
  - `canBeHiddenInMobile` (line ~870): also false when `requiredIf` is defined.
- `core/survey/_survey/surveyDependencyTypes.js`: add `required` (`isContextParent: true`,
  `selfReferenceAllowed: false`).
- `core/survey/_surveyValidator/nodeDefExpressionsValidator.js`: validate `requiredIf` expressions
  (`expressionsByDependencyTypeFns[required]`, `applyIfUniquenessByDependencyType[required] = false`, new error key
  `nodeDefEdit.requiredIfInvalid` + i18n in `core/i18n/resources/*/`).
- `core/survey/_surveyValidator/nodeDefValidator.js`: `requiredIf` not allowed together with `required: true`, on key
  attributes, multiple attributes or entities (defensive: the UI prevents it, but imports/API could produce it).

### 2.2 Designer UI (`webapp/components/survey/NodeDefDetails/ValidationsProps.js`)

Replace the "Required" checkbox (single, non-key nodes) with a `NodeDefExpressionsProp` in radio mode, the same
component and pattern used by `editableIf` in `AdvancedProps.js`:

```
Required:  ( ) Not required   ( ) Always required   ( ) Required when condition is met
           [ expression editor with "+ add condition", visible only in the 3rd mode ]
```

- `radioModes`: `none`, `always`, `defined`; `determineRadioMode`: `defined` if `requiredIf` non-empty, `always` if
  `required`, else `none`;
- `onRadioModeChange`: `none` → dissoc both; `always` → `required: true` + dissoc `requiredIf`; `defined` →
  dissoc `required` (expressions added through the editor);
- `onChange` (expressions) → `assocRequiredIf(expressions)` on validations, `Actions.setProp(validations)`;
- `propName`: `validations.requiredIf`, `isContextParent`, `excludeCurrentNodeDef`, `isBoolean`;
- the "defined" mode is offered only for attributes; entities keep only none/always (today's behaviour);
- i18n keys in `nodeDefEdit.validationsProps` (`notRequired`, `alwaysRequired`, `requiredWhenConditionIsMet`)
  for all languages in `core/i18n/resources/*/` (English text as fallback where no translation is available);
- `TestId.nodeDefDetails.requiredIf` for e2e.
- `store/actions/useSetProp.js` (`_onUpdateMultiple`): when an attribute becomes multiple, also dissoc `requiredIf`
  (today only `required` is removed); same when it becomes a key attribute.

### 2.2b Required marker in the data entry form (web)

- `webapp/components/survey/SurveyForm/nodeDefs/components/NodeDefFormItem/NodeDefFormItemLabel.js`: add a required
  marker (asterisk after the label, `survey-form__node-def-required-marker`, title "Required") when
  `Records.isNodeRequired` is true for the node (single attributes; `parentNode` is already passed to the label),
  or, in designer/preview edit mode without a node, when the def is always required or has `requiredIf`.
- Key attributes keep the key icon (no asterisk, they are implicitly required).
- Table layout (multiple entities, `nodeDefTableCellHeader.js`): the header shows the asterisk for always-required
  attributes only (the condition can differ per row). **No marker in the cells**: conditionally required cells only
  show the existing validation feedback (`valueRequired` error) as today.
- The marker updates live: node updates pushed by the server carry the parent entity with the new `cReq` meta, and
  the web record state already replaces updated nodes.
- `core/record/_node/nodeMeta.js`: add `childRequired: 'cReq'` key, also in `metaKeysOmittedWhenEmpty` (an empty `cReq` is not
  stored and removes the stored one, like `cEdit`/`cVis`) — done.

### 2.3 Other server/webapp usages of `isRequired`

- `webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts` (`pageHasOwnCompletableAttributes`): def-level check,
  use "required or conditionally required" (actual per-record completion comes from arena-core).
- `server/modules/survey/service/recordCheckJob.js` (publish):
  - `_classifyNodeDefs`: new bucket `nodeDefRequiredIfUpdatedUuids` for published defs whose draft changes
    `validations.requiredIf` (compare draft vs published `requiredIf`; the `draftAdvancedValidations` flag alone also
    fires for message-only changes). Keep them out of `nodeDefUpdatedUuids` (value-affecting).
  - also include new (added) defs with `requiredIf` and existing defs whose `requiredIf` was removed;
  - for each record: `RecordUpdater.updateRequiredFlags({ nodeDefUuids })`, persist the updated parent nodes
    (meta only) with the existing `nodesBatchUpdater`, then validate those defs' nodes (`_validateNodes`).
- `server/modules/survey/service/schemaSummary/schemaSummary.js`: keep `required` column, add `requiredIf` column
  (expressions joined like the validations column).
- Imports:
  - **Collect** (`collectImport/.../nodeDefsImportJob.js`): Collect IDML has `requiredIf` (and `required` as an
    expression); convert with `CollectExpressionConverter` into `requiredIf` instead of dropping it.
  - **ODK** (`odkImport/.../nodeDefsImportJob.ts`, `_resolveRequiredValidation`): a non-literal `required` XPath
    expression is currently reported as unsupported; convert it into `requiredIf` (same converter used for
    `relevant`).
  - Both import improvements can be done in a follow-up PR.
- AI expression features (`ButtonAiGenerateExpression`, explain panel): pass the `requiredIf` prop name/context if
  they need a dependency type (check `NodeDefExpressionsProp` props).
- Survey Collect export (if any) / Arena→Collect conversion: map `requiredIf` back where supported.

### 2.4 Tests

- Unit (`test/unit`): `NodeDefValidations` helpers, `nodeDefValidator` / expressions validator for `requiredIf`.
- Integration: record update via `RecordManager` with a `requiredIf` attribute; `RecordsValidationJob` on an
  existing record after adding a `requiredIf` to a published survey.
- Integration: publish a survey adding/changing/removing a `requiredIf` on a def with existing records →
  `cReq` meta recomputed, validation updated, dependent code attribute values untouched.
- E2E (`test/e2e/specs/`): designer sets "Required when condition is met", publishes; in data entry the asterisk and
  the "value required" error appear/disappear when the referenced attribute changes; always-required attribute
  shows the asterisk.

## Part 3 — arena-mobile

- Bump `@openforis/arena-core`. Validation comes from arena-core, so required-if errors appear automatically in the
  record editor and in the validation report.
- Mobile runs the arena-core record updater locally, so `cReq` is computed on the device for new and edited records.
- Required marker: `src/screens/RecordEditor/NodeDefFormItem/NodeDefFormItemHeader.tsx` shows an asterisk after
  the label when `Records.isNodeRequired(node)(record)` (it already receives `parentNodeUuid`; add a selector in
  `state/dataEntry/selectors.ts` next to the editable one, line ~194). Same for the nodes carousel; multiple entity
  list/table headers show it for always-required attributes only, with no marker in the cells (existing validation
  feedback only).
- Key attributes: no asterisk, the existing key icon is enough.
- `NodeCoordinateComponent/useNodeCoordinateComponent.ts:355` uses `NodeDefs.isRequired`: switch to the node-level
  `Records.isNodeRequired`.
- Records downloaded from the server already carry `cReq`; records created on older app versions lack it → the
  validator fallback evaluates the condition, and editing any referenced attribute computes the flag.
- Older app versions: lenient fallback described above (no false errors, no marker); the server flags missing
  values on upload. Optionally: if surveys carry a minimum app version, bump it when `requiredIf` is used.

## Backwards compatibility checklist

- [ ] No DB migration; no change to existing `validations.required` meaning.
- [ ] Survey JSON from older versions (no `requiredIf`) loads and validates identically (existing tests unchanged).
- [ ] Dependency graphs built by older code (no `required` key) handled (defaults to `{}`), or rebuilt on load.
- [ ] Old arena-core consumers ignore `requiredIf` → field becomes "not required" there (never stricter).
- [ ] Survey backup export/import, clone, publish/unpublish round-trip `requiredIf` (covered by `propsAdvanced`;
      add an assertion in an existing integration test).
- [ ] Records created before the condition was added: `cReq` computed on publish (`RecordCheckJob`), and the
      validator falls back to evaluating the condition when `cReq` is absent (e.g. `RecordsValidationJob`,
      uploads from old mobile versions).
- [ ] `cReq` is a new, optional node meta key: old clients ignore it; nothing written for defs without `requiredIf`.
- [ ] Boolean updater change keeps `editableIf`/`visibleIf` behaviour identical (default `defaultValue: true`).
- [ ] Same error key (`record.attribute.valueRequired`) → validation report, exports and mobile show it without
      new translations.

## Rollout order

1. arena-core PR (`feat:`), released (minor).
2. arena PR (bump core + UI + validators), then arena-server bump if it pins arena-core.
3. arena-mobile dependency bump in the next app release.
4. Follow-up: Collect/ODK import of conditional required.

## Implementation status and changes from the plan

- **arena-core** ([#476](https://github.com/openforis/arena-core/pull/476), released in 2.7.0):
  - `cReq` follows the `cEdit`/`cVis` pattern: `Nodes.isChildRequired` (default `false`), only `true` values stored,
    an emptied dictionary kept as `{}` (omitted when saved, see `metaKeysOmittedWhenEmpty`).
  - The validator always evaluates the condition itself (no fallback logic): `cReq` is used only for display (required
    marker, completion stats).
  - `RecordNodesUpdater.updateRequiredFlags` used by the publish job.
- **arena** (this branch):
  - Designer: the three exclusive options are shown for single non-key attributes; single entities keep the
    "Required" checkbox.
  - Required marker: in the survey designer (no record) only always-required attributes are marked.
  - Publish (`RecordCheckJob`): node defs whose `requiredIf` changed get their `cReq` flags recomputed and their
    attributes re-validated explicitly. Note: attributes of node defs with other validation-only changes are not
    re-validated on publish (only their parent entities are); pre-existing behaviour, out of scope here.
  - Collect/ODK import of conditional required: follow-up.
- **arena-mobile**: to do.
