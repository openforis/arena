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

### Evaluation: at validation time (not stored in node meta)

`editableIf`/`visibleIf` store their result on the parent node meta (`cEdit`/`cVis`) via the
`recordNodeDependents*Updater`s. For `requiredIf` we instead evaluate the condition **inside the attribute validator**,
because:

- "required" only affects validation; no form behaviour depends on it;
- stored meta would be missing/stale for records created before the condition was defined. The
  `RecordsValidationJob` (arena `server/modules/record/service/recordsValidationJob.js`) only re-validates, it does
  not recompute node meta, so it would produce wrong results for existing records. Evaluating in the validator makes
  that job (and record import/upload validation) correct out of the box;
- no new meta key → no record format change, nothing for older clients to misread.

Expression context: the **parent entity** (same as `applicable` / `editableIf`), self reference **not allowed**
(a "required if" that depends on the attribute's own value is meaningless).

Re-validation when a referenced attribute changes: a new `SurveyDependencyType.required` is added to the
dependency graph and to the dependency types used to collect the nodes to re-validate after an update.

---

## Part 1 — arena-core (`feat: conditionally required attributes (requiredIf)`)

PR title must start with `feat:` (minor bump, see CLAUDE.md). No `BREAKING CHANGE`/`major` words.

### 1.1 Model and getters

- `src/nodeDef/nodeDef.ts`: add `requiredIf?: NodeDefExpression[]` to `NodeDefValidations`.
- `src/nodeDef/nodeDefs.ts`:
  - `getRequiredIf(nodeDef): NodeDefExpression[]` → `getValidations(nodeDef)?.requiredIf ?? []`
  - `isRequiredIfDefined(nodeDef): boolean` (non-empty `requiredIf`)
  - `isRequiredOrConditionallyRequired(nodeDef)` (`isRequired || isRequiredIfDefined`) for callers that need a
    static "may be required" answer (completion stats, tree status).
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

### 1.3 Record validation

- `src/record/recordValidator/attributeValidator.ts`, `_validateRequired`:
  - becomes async and receives `{ user, survey, record, nodeDef }`;
  - `isKey || isRequired` → as today;
  - else if `requiredIf` defined → evaluate with
    `expressionEvaluator.evalApplicableExpression({ user, survey, record, nodeCtx: parentNode, expressions })`;
    required when the result value is truthy;
  - only evaluate when the value is blank (cheap short-circuit: a non-blank value is valid regardless);
  - same error key `record.attribute.valueRequired` → no new i18n key needed in clients.
- `src/record/recordUpdater.ts`: add `SurveyDependencyType.required` to `validationDependencyTypes`, so changing an
  attribute referenced by a `requiredIf` re-validates the dependent attributes.
- `src/record/recordValidator/attributeValidator.ts`, `findSortedNodesToValidate`: also collect dependents of type
  `required` (today only `validations`).

### 1.4 Completion / pages validation

- `src/record/_records/recordCompletion.ts` (`getAttributeCompletionStats`) is synchronous, so it cannot evaluate
  expressions. For an attribute with `requiredIf`, read the node validation in `record.validation`
  (`RecordValidations.getValidationNode`): a `record.attribute.valueRequired` error → `{ total: 1, filled: 0 }`,
  otherwise `emptyStats()` (filling it removes it from the total, so the percentage still reaches 100%).
  Behaviour for `required`/key attributes unchanged.
- `recordPagesValidation`: verify it already relies on record validation (no change expected).

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

### 2.3 Other server/webapp usages of `isRequired`

- `webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts` (`pageHasOwnCompletableAttributes`): use
  "required or conditionally required".
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
- E2E (`test/e2e/specs/`): designer sets "Required when condition is met", publishes; data entry shows/clears the
  "value required" error when the referenced attribute changes.

## Part 3 — arena-mobile

- Bump `@openforis/arena-core`. Validation comes from arena-core, so required-if errors appear automatically in the
  record editor and in the validation report.
- `NodeCoordinateComponent/useNodeCoordinateComponent.ts:355` uses `NodeDefs.isRequired`: decide whether
  "conditionally required" should behave as required there (probably use the record validation of the node).
- Older app versions: lenient fallback described above (no false errors); the server flags missing values on
  upload. Optionally: if surveys carry a minimum app version, bump it when `requiredIf` is used.

## Backwards compatibility checklist

- [ ] No DB migration; no change to existing `validations.required` meaning.
- [ ] Survey JSON from older versions (no `requiredIf`) loads and validates identically (existing tests unchanged).
- [ ] Dependency graphs built by older code (no `required` key) handled (defaults to `{}`), or rebuilt on load.
- [ ] Old arena-core consumers ignore `requiredIf` → field becomes "not required" there (never stricter).
- [ ] Survey backup export/import, clone, publish/unpublish round-trip `requiredIf` (covered by `propsAdvanced`;
      add an assertion in an existing integration test).
- [ ] Records created before the condition was added are correctly validated by `RecordsValidationJob`.
- [ ] Same error key (`record.attribute.valueRequired`) → validation report, exports and mobile show it without
      new translations.

## Rollout order

1. arena-core PR (`feat:`), released (minor).
2. arena PR (bump core + UI + validators), then arena-server bump if it pins arena-core.
3. arena-mobile dependency bump in the next app release.
4. Follow-up: Collect/ODK import of conditional required.

## Open questions

- Should "Always required" + condition be allowed (e.g. `applyIf` per cycle)? `NodeDefExpression.applyIf` already
  covers it within the conditional mode, so the plan keeps the three modes exclusive.
- Should the data entry form show a "required" marker (asterisk) for conditionally required attributes when the
  condition is met? Not shown today for always-required ones either; if wanted, it can read the node validation.
- Severity: keep "error" like `required`, or allow choosing warning (as validation expressions do)?
