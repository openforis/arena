# Dynamic (Expression-Based) Enumeration for Multiple Entities

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a multiple entity's rows be auto-generated from an arbitrary expression (e.g. `unique(table_source.table_source_type)`) instead of only "all items of a fixed category", while keeping the existing category-enumerate identity model (and all of its safety nets) unchanged, and without destroying manually-entered data in unrelated rows when the source data changes.

**Architecture:** Model this as an *additive, optional filter* on top of arena-core's existing category-based `enumerate` mechanism, not a parallel system. A new `enumeratingItemsExpression` prop on the entity, when set, restricts which category items get enumerated to the (deduped) result of evaluating that expression, instead of "all items". A new `SurveyDependencyType.enumeratingItems` tracks what the expression depends on, using the already-fixed filter-predicate-aware static analyzer. A new incremental (create-only-new/delete-only-removed) updater — distinct from the legacy wholesale delete-all/recreate-all sync used by category-enumerate — keeps rows in sync as source data changes, reusing `Records.getDependentNodePointers`' existing generic cross-branch/cousin fan-out. No new "extract current iteration value" expression function is needed: the engine seeds each row's key attribute imperatively during creation (exactly like today), before sibling default-value expressions run.

**Tech Stack:** TypeScript (`arena-core`, isomorphic domain library), Node.js/React 18/Express (`arena`), Jest (arena-core: `npx jest`; arena: webpack-bundled `test/unit`).

**Repos:** `/home/stefano/dev/projects/openforis/arena-core` (engine — Part A/B) and `/home/stefano/dev/projects/openforis/arena` (Designer UI/i18n/validator — Part C). Both on branch `feat/dynamic-enumerate`.

**Rollout note (outside this plan's scope):** `arena` depends on `@openforis/arena-server`, which depends on `arena-core` — shipping end-to-end requires publishing arena-core, then arena-server, then bumping arena's `package.json`/`yarn.lock`.

---

## Global Constraints

- Do not change the *behavior* of the existing category-based `enumerate` feature when `enumeratingItemsExpression` is unset — every new code path must be a no-op in that case (verified backward compatible at each step below).
- `src/record/_records/recordUtils.ts` (arena-core) must never import `RecordExpressionEvaluator` — confirmed this creates a real circular require (`recordUtils.ts` → `recordExpressionEvaluator.ts` → `records.ts` → `recordUtils.ts`). All expression evaluation for this feature lives in a new file at the `recordNodesUpdater/` layer, which already safely imports `RecordExpressionEvaluator` (same pattern as `recordNodeDependentsApplicableUpdater.ts`).
- New expression-bearing prop goes on `NodeDefPropsAdvanced` (`src/nodeDef/nodeDef.ts`), not on `NodeDefEntityProps` — confirmed this is where every other expression prop (`applicable`, `defaultValues`, `fileNameExpression`, ...) already lives.
- Row sync for the new feature must be **incremental** (diff-based: create only newly-appeared values, delete only newly-disappeared values, leave matched rows' node UUIDs untouched) — explicitly NOT the legacy wholesale delete-all-and-recreate-all strategy used by category-enumerate today, since that would destroy any data accumulated in unrelated existing rows on every unrelated `table_source` edit.
- Match existing code conventions exactly: function/file naming, `Dictionary`/`Objects`/`Arrays` utility usage, JSDoc style (arena-core does use TSDoc-lite comments on exported functions in touched files — match whatever the specific file already does, don't introduce a new comment style).

---

## File Structure

**arena-core:**
- Modify: `src/nodeDef/nodeDef.ts` — add `enumeratingItemsExpression?: string` to `NodeDefPropsAdvanced`.
- Modify: `src/nodeDef/nodeDefs.ts` — add `getEnumeratingItemsExpression` getter.
- Modify: `src/survey/survey.ts` — add `SurveyDependencyType.enumeratingItems`.
- Modify: `src/survey/surveys/dependencies.ts` — wire the new dependency type end-to-end.
- Modify: `src/nodeDefExpressionEvaluator/functions.ts` — add design-time `unique` function.
- Modify: `src/record/recordExpressionEvaluator/functions.ts` — add runtime `unique` function.
- Modify: `src/record/_records/recordUtils.ts` — add `allowedCodes` filter param to `getEnumeratingCategoryItems`.
- Create: `src/record/recordNodesUpdater/recordEnumeratingItemsExpressionEvaluator.ts` — owns expression evaluation for this feature.
- Modify: `src/record/recordNodesUpdater/recordNodesCreator.ts` — extract `createEnumeratedEntityNode` (singular); make `createEnumeratedEntityNodes` filter-aware.
- Modify: `src/record/recordNodesUpdater/recordNodeDependentsEnumeratedEntitiesUpdater.ts` — additive-only: make `shouldExistingEntitiesBeDeleted` filter-aware.
- Create: `src/record/recordNodesUpdater/recordNodeDependentsEnumeratingItemsUpdater.ts` — the new incremental sync logic.
- Modify: `src/record/recordNodesUpdater/recordNodesUpdater.ts` — wire the new updater into the dispatch loop + re-visit queue.
- Modify: `src/tests/builder/surveyBuilder/nodeDefEntityBuilder.ts` — add `enumeratingItemsExpression(expression)` builder method.
- Modify: `src/survey/surveys/dependencies.test.ts` — new dependency-type coverage.
- Modify: `src/nodeDefExpressionEvaluator/expressionValidator.test.ts` (or sibling) — `unique` design-time coverage.
- Modify: `src/record/recordExpressionEvaluator/recordExpressionEvaluator.test.ts` — `unique` runtime coverage.
- Create: `src/record/recordUpdater.attributeUpdate.dependentEnumeratingItemsEntity.test.ts` — end-to-end incremental sync coverage.

**arena:**
- Modify: `core/survey/nodeDef.js` — add prop key + getter.
- Modify: `webapp/components/survey/NodeDefDetails/BasicProps/BasicProps.js` — new expression field, gated on `NodeDef.isEnumerate(nodeDef)`.
- Modify: `core/survey/_surveyValidator/nodeDefValidator.js` — validate the new expression.
- Modify: `webapp/components/survey/NodeDefDetails/store/actions/useSetProp.js` — clear field when "Enumerate" unchecked.
- Modify: `core/i18n/resources/en/common.js` (+ other locales, lower priority) — new labels.

---

### Task 1: arena-core — data model + dependency graph wiring

**Files:** `src/nodeDef/nodeDef.ts`, `src/nodeDef/nodeDefs.ts`, `src/survey/survey.ts`, `src/survey/surveys/dependencies.ts`, `src/tests/builder/surveyBuilder/nodeDefEntityBuilder.ts`, `src/survey/surveys/dependencies.test.ts`

**Interfaces produced:**
- `NodeDefPropsAdvanced.enumeratingItemsExpression?: string`
- `NodeDefs.getEnumeratingItemsExpression(nodeDef: NodeDefEntity): string | undefined`
- `SurveyDependencyType.enumeratingItems` (new enum member, inserted alphabetically between `editable` and `fileName`)
- `dependencies.ts`: `isContextParentByDependencyType.enumeratingItems = true`, `selfReferenceAllowedByDependencyType.enumeratingItems = false`, `newDependecyGraph()` includes it, and `addNodeDefDependencies` registers it for entity node defs:
  ```ts
  if (NodeDefs.isEntity(nodeDef)) {
    const enumeratingItemsExpression = NodeDefs.getEnumeratingItemsExpression(nodeDef as NodeDefEntity)
    if (enumeratingItemsExpression) {
      graphsUpdated = await _addDependencies(SurveyDependencyType.enumeratingItems, [
        NodeDefExpressionFactory.createInstance({ expression: enumeratingItemsExpression }),
      ])
    }
  }
  ```
- Test builder: `nodeDefEntityBuilder.enumeratingItemsExpression(expression: string): this`

**Verification:** New test in `dependencies.test.ts` — build a survey with an enumerate entity whose `enumeratingItemsExpression` references a sibling/cousin attribute; assert `Surveys.getNodeDefDependents({dependencyType: SurveyDependencyType.enumeratingItems, nodeDefUuid: <sourceAttr>.uuid})` returns the enumerate entity.

---

### Task 2: arena-core — `unique` expression function

**Files:** `src/nodeDefExpressionEvaluator/functions.ts`, `src/record/recordExpressionEvaluator/functions.ts`, `src/nodeDefExpressionEvaluator/expressionValidator.test.ts`, `src/record/recordExpressionEvaluator/recordExpressionEvaluator.test.ts`

**Interfaces produced:** `unique(array)` in both function registries, following the exact `sum`/`count` pattern (arity 1, design-time dummy executor, runtime executor `[...new Set(nodeSet)]` guarded for non-array input).

**Verification:** Design-time test asserting the expression parses/validates; runtime test(s) against the existing fixture survey/record, e.g. `unique(plot.tree.tree_species)` returns the deduped array.

---

### Task 3: arena-core — filter-aware item resolution + expression evaluation

**Files:** `src/record/_records/recordUtils.ts`, `src/record/recordNodesUpdater/recordEnumeratingItemsExpressionEvaluator.ts` (new)

**Interfaces produced:**
- `getEnumeratingCategoryItems(params: {..., allowedCodes?: Set<string>})` — filters the resolved `CategoryItem[]` down to items whose `.props.code` is in `allowedCodes`, when provided; identical behavior when omitted.
- `getEnumeratingItemsAllowedCodes(params: {survey, user, record, entityDef, parentNode}): Promise<Set<string> | undefined>` — evaluates `entityDef`'s `enumeratingItemsExpression` (if any) via `RecordExpressionEvaluator`, with `node: parentNode` so `nodeContext` resolves to the entity's own parent (matching `isContextParentByDependencyType.enumeratingItems = true`); returns `undefined` when no expression is set.

**Verification:** covered indirectly by Task 5's end-to-end tests; no standalone unit test required if Task 5 covers the behavior, but add one direct test if convenient (e.g. calling `getEnumeratingItemsAllowedCodes` directly against a small fixture).

---

### Task 4: arena-core — row creation, sync, and dispatcher wiring

**Files:** `src/record/recordNodesUpdater/recordNodesCreator.ts`, `src/record/recordNodesUpdater/recordNodeDependentsEnumeratedEntitiesUpdater.ts`, `src/record/recordNodesUpdater/recordNodeDependentsEnumeratingItemsUpdater.ts` (new), `src/record/recordNodesUpdater/recordNodesUpdater.ts`

**Interfaces produced:**
- `createEnumeratedEntityNode(params)` — extracted singular-row creation (pure refactor of existing logic in `createEnumeratedEntityNodes`), reused by both the legacy and new updaters.
- `createEnumeratedEntityNodes(...)` — now filter-aware via `allowedCodes`.
- `recordNodeDependentsEnumeratedEntitiesUpdater.ts`: `shouldExistingEntitiesBeDeleted` made filter-aware (additive only — no other line changes).
- `updateDependentEnumeratingItemsEntities(params): Promise<RecordUpdateResult>` (new file) — uses `Records.getDependentNodePointers({dependencyType: SurveyDependencyType.enumeratingItems})` to find affected `(parentNode, entityDef)` pairs, then does an incremental diff per pair: delete rows for disappeared values, create rows for newly-appeared values (via `createEnumeratedEntityNode`), leave matched rows untouched; handles the entity's own applicability the same way the legacy updater does (delete-all-and-stop when inapplicable).
- `recordNodesUpdater.ts`: new call site after the existing `updateDependentEnumeratedEntities` call, with its `.nodes` folded into `nodesUpdatedCurrent` so newly-created rows (and their `defaultValues`-bearing children) get re-visited on the next pass.

**Verification:** Task 5's end-to-end suite is the primary verification for this task; also run the *existing* `recordUpdater.attributeUpdate.dependentEnumeratedEntity.test.ts` to confirm zero regression in the legacy category-enumerate path.

---

### Task 5: arena-core — end-to-end test coverage

**Files:** Create `src/record/recordUpdater.attributeUpdate.dependentEnumeratingItemsEntity.test.ts` (model directly on `recordUpdater.attributeUpdate.dependentEnumeratedEntity.test.ts`)

**Scenarios (each a separate test):**
1. Initial record creation → one `table_sum`-equivalent row per unique source value.
2. Add a source row with a **new** value → exactly one new row added; existing rows' node UUIDs unchanged.
3. Remove the last source row of a given value → exactly that row removed; others unchanged.
4. Edit an unrelated attribute → no row change at all.
5. **Composability**: add a readOnly `value_sum`-style attribute (`sum(table_source[$context.type == table_source_type].value)`) and assert it computes correctly for a row created via the *incremental* path — proves the Task 4 re-enqueue wiring, not just row counts.
6. Toggle the entity's own `applyIf` false→true → rows deleted then correctly recreated (filtered); proves the legacy applicable-path and new incremental path don't conflict.

**Verification:** `npx jest` (full suite green, including all pre-existing tests), `npx tsc --noEmit`, `npx eslint` on all changed/new files.

---

### Task 6: arena — Designer UI, validation, i18n

**Files:** `core/survey/nodeDef.js`, `webapp/components/survey/NodeDefDetails/BasicProps/BasicProps.js`, `core/survey/_surveyValidator/nodeDefValidator.js`, `webapp/components/survey/NodeDefDetails/store/actions/useSetProp.js`, `core/i18n/resources/en/common.js`

**Interfaces produced:**
- `NodeDef.keysPropsAdvanced.enumeratingItemsExpression`, `NodeDef.getEnumeratingItemsExpression(nodeDef)`.
- New `NodeDefSingleExpressionProp` field in `BasicProps.js`, inside the `NodeDef.isMultipleEntity(nodeDef)` branch, gated on `NodeDef.isEnumerate(nodeDef)`, right after the existing "Enumerate" checkbox — exact same pattern already used for `fileNameExpression` on File attributes (`ExpressionsProp/NodeDefSingleExpressionProp.js`).
- `validateEnumeratingItemsExpression` in `nodeDefValidator.js`, mirroring `validateFileNameExpression`.
- Clear the field when "Enumerate" is unchecked, extending the existing `dissocEnumerate`-on-multiple-toggle-off cascade in `useSetProp.js`.
- i18n keys under `nodeDefEdit.basicProps.enumeratingItemsExpression.{label,info}` in `en/common.js` (other locales optional/lower priority — English fallback).

**Verification:** `yarn test:unit` stays green; manual check via `yarn watch` against the `test_enumerated_dynamic` survey once arena-core's build is available locally (e.g. temporary `yarn link`), confirming the new field appears/behaves and rows sync correctly in the Data view.

---

## Risks / Edge Cases (accepted, documented)

- Expression value with no matching category item → silently produces zero rows for that value (consistent with the existing silent-no-op precedent when an enumerator is misconfigured).
- `unique(...)` is re-evaluated once per visit of a node with a registered `enumeratingItems` edge (bounded by the existing `MAX_DEPENDENTS_VISITING_TIMES = 2` ceiling) — same order of cost as the already-existing `sum(...)`-based recompute on the same trigger set.
- Combining `enumeratingItemsExpression` with a hierarchical `parentCodeDefUuid` enumerator composes for free (parent-code filtering, then expression filtering, intersected) — not required scope, worth a one-line mention if convenient.
