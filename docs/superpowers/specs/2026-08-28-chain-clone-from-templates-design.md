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

## Authorization investigation (why this touches three repos)

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

Both `canViewSurvey` implementations are `isSystemAdmin(user) || hasAuthGroupForSurvey(user, survey)`
— true for admins or survey collaborators, false for anyone else, template or not.

`canViewSurvey` is safe to broaden for published templates: every route gated by it
(`requireSurveyViewPermission`) is read-only — survey/full, node defs, categories, taxonomies, users
list, activity log. None of them mutate state.

`canAnalyzeRecords` is **not** safe to broaden: `requireRecordAnalysisPermission` gates both the
read routes (list/view chains) *and* the write routes (create/update/delete/validate chain,
clone/validate records) on the same middleware. Broadening it would let any authenticated user
create, edit, or delete chains inside any published template, not just view them. It is left
untouched.

Consequence: fixing `canViewSurvey` alone resolves (1) and (3) automatically, once the fixed version
is consumed. (2) still needs a workaround, since the route it currently calls is gated by the
write-capable permission — solved with one new endpoint in `arena` (see below) that performs its own
`canViewSurvey`-based check instead of going through the generic, write-gated route.

## Design

### 1. `arena-core` repo — `src/auth/authorizer.ts`

Broaden `canViewSurvey`:

```ts
const canViewSurvey = (user: User, surveyInfo: Survey): boolean =>
  Users.isSystemAdmin(user) || _hasAuthGroupForSurvey({ user, surveyInfo }) || (surveyInfo.template && surveyInfo.published)
```

`canAnalyzeRecords` and every other permission function are unchanged.

Bump the package's minor version (currently `2.1.2`). This is a feature-request-driven behavior
change, not a patch. No other code in this file changes.

**Process:** branch + PR in `arena-core`, opened by this work but merged/published by the user.

### 2. `arena-server` repo

No source change expected — `ApiAuthMiddleware`'s `requireSurveyViewPermission` /
`requireRecordAnalysisPermission` just call into `Authorizer` re-exported from `@openforis/arena-core`.
Bump the `@openforis/arena-core` dependency (currently `^2.1.2`) to the new version once published,
and bump `arena-server`'s own version (currently `2.2.3`) to trigger a republish.

**Process:** branch + PR in `arena-server`, opened by this work but merged/published by the user.

### 3. `arena` repo (this repo)

**Dependency bump:** `package.json`'s `@openforis/arena-server` (currently `^2.2.3`) to the new
published version, once available.

**`core/auth/authorizer.ts`:** apply the identical `canViewSurvey` broadening, so behavior is
consistent between arena-server-gated routes and this repo's own inline checks (used by the chain
clone POST route today, and incidentally by `categoryService.js`/`taxonomyService.js`'s
clone-from-survey checks — no UI changes are being made for those, see Out of scope).

**New endpoint — `server/modules/analysis/api/chainApi.js`:**

```
GET /survey/:surveyId/chain/clone-from-survey/chains?sourceSurveyId=X
```

- `:surveyId` is the **target** (current) survey; gated by the existing
  `AuthMiddleware.requireRecordAnalysisPermission`, same as the clone POST route.
- Handler validates `sourceSurveyId` is present, fetches `sourceSurveyInfo` via
  `SurveyManager.fetchSurveyById`, and checks `Authorizer.canViewSurvey(user, sourceSurveyInfo)`
  (the now-broadened local copy), throwing `UnauthorizedError` if it fails — identical pattern to the
  existing clone POST handler.
- On success, calls `AnalysisService.fetchChains({ surveyId: sourceSurveyId })` directly (the same
  service function the generic `/processing-chains` route uses) and returns `{ list }`.

**New API client — `webapp/service/api/analysis/index.js`:**

```js
export const fetchChainsForCloneFromSurvey = async ({ targetSurveyId, sourceSurveyId }) => {
  const {
    data: { list: chains },
  } = await axios.get(`/api/survey/${targetSurveyId}/chain/clone-from-survey/chains`, {
    params: { sourceSurveyId },
  })
  return { chains }
}
```

**`ChainCloneFromSurveyDialog.tsx`:**

- `onSurveyChange` calls `API.fetchChainsForCloneFromSurvey({ targetSurveyId: currentSurveyId,
  sourceSurveyId: item.value })` instead of `API.fetchChains({ surveyId: item.value })`. This is used
  for every selected source survey, template or not — one code path, no branching on template-ness.
- `onChainChange` (entity-compatibility check via `API.fetchSurveyFull`) is **unchanged** — it already
  goes through `canViewSurvey`/`requireSurveyViewPermission`, so it's fixed automatically once the
  authorizer change is consumed.
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

- Category and taxonomy clone-from-survey dialogs are not updated to offer templates. The
  `canViewSurvey` fix incidentally makes their existing inline checks template-aware too (they use
  the same `arena` authorizer function), but no UI or endpoint change is made for them in this task.
- Draft templates as clone sources.
- Per-item "(template)" badges or descriptions on dropdown options.
- Any change to `canAnalyzeRecords` or the generic `/processing-chains` route — deliberately left
  write-gated as today.

## Testing

- `arena-core`: unit test for `canViewSurvey` returning `true` for a published template with no
  matching auth group, and still `false` for a draft template / non-template survey with no matching
  auth group.
- `arena` integration tests (alongside the existing
  `test/integration/tests/011chainCloneFromSurveyCategoryTest.js` suite):
  1. A non-admin user with no auth group on a published template can list its chains via the new
     `GET .../chain/clone-from-survey/chains` endpoint, and can successfully clone a chain from it.
  2. The same user gets `UnauthorizedError` from that endpoint when `sourceSurveyId` refers to a
     regular (non-template) survey they have no access to, and when it refers to a draft template.
  3. Existing clone-from-regular-survey behavior (including the `skipMissingEntityAttributes` flow
     from the prior feature) is unaffected.
- Webapp: manually verify the dropdown renders two labeled groups ("Surveys" / "Templates"), omits
  either group when empty, and that selecting a template source flows through entity-check → chain
  list → clone exactly like a regular survey.
