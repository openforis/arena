# Chain clone: allow cloning from templates, group surveys and templates in the list

Date: 2026-08-28

## Problem

`ChainCloneFromSurveyDialog` (`webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog.tsx`)
lets a user pick a source survey and one of its chains to clone into the currently open survey. The
source-survey dropdown (`loadSurveys`) only fetches regular, non-template surveys
(`API.fetchSurveys({ draft, withChains: true })`, which defaults `template` to `false`), and renders
them as a single flat, alphabetically sorted list.

Published template surveys are a natural source for chains (they're already the standard starting
point for "create a new survey from a template"), but they're invisible to this dialog today, and
simply adding `template: true` to the fetch would not work end-to-end: the dialog's later steps
re-use generic, permission-gated routes keyed on the *source* survey id, and those permission checks
require the requesting user to already have an auth-group membership on that specific survey — which
essentially no one has for a template they don't own or collaborate on.

## Goal

Any authenticated user can pick a **published** template as a chain-clone source, in addition to
regular surveys. The source-survey dropdown groups its options under "Surveys" and "Templates"
headings.

## Authorization investigation

The dialog's flow touches three permission-gated code paths, keyed on the *source* survey id:

1. `GET /api/survey/:surveyId/full` (entity-compatibility check, `onChainChange`) — gated by
   `requireSurveyViewPermission`, which resolves to `Authorizer.canViewSurvey` from
   `@openforis/arena-core`.
2. `GET /api/survey/:surveyId/processing-chains` (chain list for the selected source survey,
   `onSurveyChange`) — gated by `requireRecordAnalysisPermission`, which resolves to
   `Authorizer.canAnalyzeRecords` from `@openforis/arena-core`.
3. `POST /api/survey/:surveyId/chain/clone-from-survey` (the actual clone) — the target `:surveyId`
   is gated by `requireRecordAnalysisPermission` (fine, that's the survey the user is already working
   in), and the handler additionally checks `Authorizer.canViewSurvey(user, sourceSurveyInfo)` from
   `arena`'s own `core/auth/authorizer.ts` (a hand-duplicated copy of the same logic, not imported
   from `arena-core`).

### Rejected approach: broadening the shared `canViewSurvey`

The first design attempt broadened `canViewSurvey` itself (in both `arena-core` and `arena`'s
duplicated copy) to return `true` for a published template. This was implemented, and a final
whole-branch review on the `arena-core` change caught a real problem before merge: `canViewSurvey`'s
actual blast radius is much wider than "read-only structural metadata." `arena-server` builds a
*second* middleware, `requireRecordListViewPermission`, on the exact same `canViewSurvey` function,
and `arena` consumes it. Broadening `canViewSurvey` therefore also opens, for any authenticated user,
on any published template: record listing/summaries/counts, arbitrary RDB queries over collected
data values, the activity log, full survey export (which defaults to including data *and* the
activity log), and a user-group-members endpoint that returns emails. None of that is needed by this
feature. The review also found `canViewSurvey(undefined, publishedTemplate)` returned `true` — no
guard requiring a user to exist at all, unlike every sibling permission function.

**Decision:** do not touch the shared `canViewSurvey` (in either repo) at all. `arena-core` and
`arena-server` need no changes for this feature — the earlier `arena-core` PR branch
(`feat/can-view-survey-template`) is abandoned, not merged. Everything is now self-contained in
`arena`: a new, narrow, additive predicate lives only in `arena`'s own `core/auth/authorizer.ts`, used
only by the three call sites this feature actually needs, added alongside `canViewSurvey` rather than
folded into it.

### The narrow predicate

```ts
export const canViewSurveyOrPublishedTemplate = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  canViewSurvey(user, surveyInfo) || Boolean(user && Survey.isTemplate(surveyInfo) && Survey.isPublished(surveyInfo))
```

The `Boolean(user && ...)` guard is included from the start (the reviewed-and-rejected branch was
missing the equivalent guard on `canViewSurvey` itself — applying it here avoids repeating that gap).

`canAnalyzeRecords` remains completely untouched, as does every route built on it
(`requireRecordAnalysisPermission` gates both read and write chain routes on the same middleware, so
it must never become template-permissive).

Consequence: since `canViewSurvey`/`requireSurveyViewPermission` are unchanged, (1) above
(`/survey/:surveyId/full`) is **not** fixed for free anymore — it still requires membership. Both (1)
and (2) now need a dedicated `arena`-only endpoint that performs its own
`canViewSurveyOrPublishedTemplate` check instead of going through the generic, still-membership-gated
route. (3)'s existing inline check swaps from `canViewSurvey` to `canViewSurveyOrPublishedTemplate`.

## Design

Everything below is in the `arena` repo. No other repo changes.

### `core/auth/authorizer.ts`

Add the new predicate alongside the existing `canViewSurvey` (do not modify `canViewSurvey` itself):

```ts
export const canViewSurveyOrPublishedTemplate = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  canViewSurvey(user, surveyInfo) || Boolean(user && Survey.isTemplate(surveyInfo) && Survey.isPublished(surveyInfo))
```

`server/modules/analysis/api/chainApi.js`'s existing POST clone route swaps its inline check from
`Authorizer.canViewSurvey(user, sourceSurveyInfo)` to
`Authorizer.canViewSurveyOrPublishedTemplate(user, sourceSurveyInfo)`. `categoryService.js` and
`taxonomyService.js` are not touched (see Out of scope) — they keep using plain `canViewSurvey`.

### New endpoint 1 — chains list — `server/modules/analysis/api/chainApi.js`

```
GET /survey/:surveyId/chain/clone-from-survey/chains?sourceSurveyId=X
```

- `:surveyId` is the **target** (current) survey; gated by the existing
  `AuthMiddleware.requireRecordAnalysisPermission`, same as the clone POST route.
- Handler validates `sourceSurveyId` is present, fetches `sourceSurveyInfo` via
  `SurveyManager.fetchSurveyById`, and checks
  `Authorizer.canViewSurveyOrPublishedTemplate(user, sourceSurveyInfo)`, throwing `UnauthorizedError`
  if it fails — identical pattern to the existing clone POST handler, just with the narrow predicate.
- On success, calls `AnalysisService.fetchChains({ surveyId: sourceSurveyId })` directly (the same
  service function the generic `/processing-chains` route uses) and returns `{ list }`.
- Backed by a new manager function, `AnalysisManager.fetchChainsForCloneFromSurvey({ user,
  sourceSurveyId })`, doing the check-then-fetch above.

### New endpoint 2 — source-chain entity names — `server/modules/analysis/api/chainApi.js`

Needed because `canViewSurvey`/`requireSurveyViewPermission` are unchanged, so
`GET /survey/:surveyId/full` (what `onChainChange` used to call for the entity-compatibility check)
still requires membership and cannot be used for a template source anymore.

```
GET /survey/:surveyId/chain/clone-from-survey/entities?sourceSurveyId=X&sourceChainUuid=Y
```

- Same target-survey gating and same `canViewSurveyOrPublishedTemplate` inline check on the source as
  endpoint 1.
- Backed by a new manager function, `AnalysisManager.fetchChainSourceEntityNames({ user,
  sourceSurveyId, sourceChainUuid })`: after the access check, fetches the source survey via
  `SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId: sourceSurveyId, draft: true, advanced:
  true, includeAnalysis: true })`, filters node defs to `NodeDef.isAnalysis(nd) &&
  NodeDef.getChainUuid(nd) === sourceChainUuid`, and returns the de-duplicated array of each one's
  parent entity name — exactly the computation `onChainChange` used to do client-side over a raw
  survey structure it can no longer fetch directly for a template. Returns `{ entityNames: string[]
  }` — nothing else about the source survey's structure is exposed.

### `webapp/service/api/analysis/index.js` — new API clients

```js
export const fetchChainsForCloneFromSurvey = async ({ targetSurveyId, sourceSurveyId }) => {
  const {
    data: { list: chains },
  } = await axios.get(`/api/survey/${targetSurveyId}/chain/clone-from-survey/chains`, {
    params: { sourceSurveyId },
  })
  return { chains }
}

export const fetchChainSourceEntityNames = async ({ targetSurveyId, sourceSurveyId, sourceChainUuid }) => {
  const {
    data: { entityNames },
  } = await axios.get(`/api/survey/${targetSurveyId}/chain/clone-from-survey/entities`, {
    params: { sourceSurveyId, sourceChainUuid },
  })
  return { entityNames }
}
```

### `ChainCloneFromSurveyDialog.tsx`

- `onSurveyChange` calls `API.fetchChainsForCloneFromSurvey({ targetSurveyId: currentSurveyId,
  sourceSurveyId: item.value })` instead of `API.fetchChains({ surveyId: item.value })`. Used for
  every selected source survey, template or not — one code path, no branching on template-ness.
- `onChainChange` calls `API.fetchChainSourceEntityNames({ targetSurveyId: currentSurveyId,
  sourceSurveyId: selectedSurveyItem.value, sourceChainUuid: item.value })` instead of fetching the
  full source survey via `API.fetchSurveyFull` and computing parent entity names client-side. The
  returned `entityNames` are mapped against the already-known `targetEntityNames` exactly as before
  (`entityNames.map((entityName) => ({ entityName, found: targetEntityNames.has(entityName) }))`) —
  only where the entity names come from changes, not the found/missing logic itself.
- `loadSurveys` additionally fetches `API.fetchSurveys({ draft: false, template: true, withChains:
  true })` (published templates only — draft templates are never offered, matching the existing
  "create survey from template" flow, which also only ever shows published templates). Template
  items are built with the exact same label logic as regular surveys (`label [name]` when the label
  differs from the name, otherwise just `name`), excluding the current survey, sorted alphabetically
  — no special "(template)" suffix on the label; the group header is the only visual distinction.
- `surveyItems` state changes from a flat `SurveyItem[]` to `SurveyItemGroup[]`:
  ```ts
  type SurveyItemGroup = { label: string; options: SurveyItem[] }
  ```
  built as:
  ```js
  const groups = [
    { label: i18n.t('appModules.surveys'), options: surveyGroupItems },
    { label: i18n.t('appModules.templates'), options: templateItems },
  ].filter((group) => group.options.length > 0)
  setSurveyItems(groups)
  ```
  Reuses the existing `appModules.surveys` / `appModules.templates` i18n keys (already `"Surveys"` /
  `"Templates"` in `core/i18n/resources/en/common.js`) rather than adding new ones.
- No changes to `Dropdown`/`useDropdown` — they already support react-select's native grouped-options
  shape (`{ label, options }`), as used today in
  `webapp/views/App/views/Analysis/Chain/StatisticalAnalysis/DimensionsSelector/DimensionsSelector.js`.
  `useDropdown`'s `getItemFromOption` already flattens `options` groups when resolving a selection, so
  `selectedSurveyItem` downstream is unaffected — still a plain `{ value, label, surveyInfo }`.

## Out of scope

- Category and taxonomy clone-from-survey dialogs are not updated to offer templates, and their
  `canViewSurvey`-based checks are not changed to the new predicate — no UI or endpoint change is
  made for them in this task.
- Draft templates as clone sources.
- Per-item "(template)" badges or descriptions on dropdown options.
- Any change to `canAnalyzeRecords`, `canViewSurvey` itself, or the generic `/processing-chains` /
  `/survey/:surveyId/full` routes — deliberately left exactly as gated as today for every other
  caller.
- Any change to `arena-core` or `arena-server` — both repos are untouched by the final design. (An
  earlier `arena-core` branch, `feat/can-view-survey-template`, explored broadening the shared
  `canViewSurvey` and was abandoned after review — see "Rejected approach" above.)

## Testing

- `arena` unit tests: `canViewSurveyOrPublishedTemplate` returns `true` for a published template
  regardless of group membership, `false` for a draft/unpublished template, `false` for a regular
  survey with no membership, `true` for any survey the user already has membership on, and `false`
  when `user` is falsy even for a published template.
- `arena` integration tests (alongside the existing
  `test/integration/tests/011chainCloneFromSurveyCategoryTest.js` suite):
  1. A non-admin user with no auth group on a published template can list its chains via
     `AnalysisManager.fetchChainsForCloneFromSurvey` and fetch its entity names via
     `AnalysisManager.fetchChainSourceEntityNames`, and can successfully clone a chain from it via
     `cloneChainFromSurvey`.
  2. The same user gets `UnauthorizedError` from both new manager functions when `sourceSurveyId`
     refers to a regular (non-template) survey they have no access to, and when it refers to a draft
     template.
  3. Existing clone-from-regular-survey behavior (including the `skipMissingEntityAttributes` flow
     from the prior feature) is unaffected.
- Webapp: manually verify the dropdown renders two labeled groups ("Surveys" / "Templates"), omits
  either group when empty, and that selecting a template source flows through entity-check → chain
  list → clone exactly like a regular survey.
