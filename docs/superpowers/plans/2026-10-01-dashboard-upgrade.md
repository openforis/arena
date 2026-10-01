# Arena Dashboard Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Arena’s tabbed `/app/dashboard` with a modern single-page dashboard (KPI cards, conditional map, trend, sampling, activity) using real data, TypeScript, and Arena/MUI wrappers.

**Architecture:** Incremental slices on the same route. Thin `Dashboard.tsx` shell + shared period context + feature sections. Prefer existing APIs (`/records/dashboard/count`, storage on survey info, activity log, geo export/WHISP). Lazy-load heavy sections. Lighter dashboard map that reuses/extracts geo + WHISP helpers from Data `MapView`.

**Tech Stack:** React 18, TypeScript, MUI 9 (default behind Arena wrappers), Recharts (existing), Leaflet/`MapContainer` + `GeoAttributeDataLayer`, Redux survey store, Axios APIs, Playwright e2e, Jest unit tests, Arena i18n.

**Spec:** [docs/superpowers/specs/2026-10-01-dashboard-upgrade-design.md](../specs/2026-10-01-dashboard-upgrade-design.md)

## Global Constraints

- New files must be TypeScript (`.ts` / `.tsx`); convert rewritten `.js` dashboard modules to TS.
- Domain types from `@openforis/arena-core` when available; cognitive complexity ≤ 15; prefer `for...of`.
- UI kit default: **MUI behind Arena wrappers**. Per new primitive, document MUI vs shadcn scored: (1) Stefano constraints (2) look (3) performance. No Tailwind-as-app-default unless explicitly approved.
- Obab UI > Stefano technical constraints > Trello wishlist.
- No Notifications card, no Active Users card, no survey-level WHISP API-key UI in this delivery.
- WHISP = reuse existing Earth Map / CSV actions on polygon select.
- Period/date filtering must remain.
- Prototype ZIP is reference only — do not paste its code.
- Review this plan with Stefano **before** opening the implementation branch.
- After each task: `yarn typecheck` (and relevant tests) must pass; commit on the feature branch.

---



## File structure (target)

```
webapp/views/App/views/Dashboard/
  Dashboard.tsx                          # shell (replaces Dashboard.js)
  Dashboard.scss                         # layout for card grid + sections
  RecordsSummaryContext.tsx              # typed context (from .js)
  components/
    DashboardKpiCard.tsx                 # shared KPI wrapper (MUI under the hood)
    DashboardKpiCard.scss
    DashboardSection.tsx                 # section chrome wrapper
  utils/
    surveyIncludesCleansingStep.ts
    surveyHasGeoAttributes.ts
    aggregateRecordsTotal.ts
    filterActiveContributors.ts
  RecordsSummaryCard/
    RecordsSummaryCard.tsx
    useRecordsStepBreakdown.ts
  ContributorsCard/
    ContributorsCard.tsx
    ContributorsDetail.tsx
  StorageCard/
    StorageCard.tsx                      # restyle wrap of StorageSummary
  RecordTrendSection/
    RecordTrendSection.tsx
  SamplingPointSection/
    SamplingPointSection.tsx
  DashboardMapSection/
    DashboardMapSection.tsx
    useDashboardMapOwners.ts
    DashboardMapOwnerFilter.tsx
    DashboardPolygonPopup.tsx
  RecentActivitySection/
    RecentActivitySection.tsx
  RecordsSummaryPeriodSelector/         # convert store hooks to TS as touched
  SurveyInfo/                            # keep; convert if substantially touched
  hooks/useHasSamplingPointData.ts       # convert from .js
  index.ts
  DashboardModule.tsx

test/unit/tests/
  046dashboardSurveyGates.test.js       # or .ts if unit bundler allows; follow existing unit test style
  047dashboardAggregations.test.js

webapp/utils/testId/index.js             # add dashboard KPI/map test ids
core/i18n/resources/en/homeView.js       # new dashboard strings
core/i18n/resources/fr/homeView.js
```

Optional later extraction (Task 5): shared WHISP URL helpers from `WhispMenuButton.js` into a small TS module used by Data MapView + dashboard popup.

---



### Task 0: Plan review gate (human)

**Files:** none (process only)

**Interfaces:**

- Consumes: this plan + design spec
- Produces: go/no-go to open feature branch

- [ ] **Step 1: Share plan with Stefano**

Send links to the design spec and this plan. Confirm: slice order, cleansing gate rule, WHISP = existing actions only, no API-key work, MUI-default + per-primitive evaluation.

- [ ] **Step 2: Record outcomes**

If Stefano requires a backend change for step counts or owner-filter geo, note it under Task 1 / Task 5 before coding. Existing `/api/survey/:surveyId/records/dashboard/count?countType=step` already returns step counts — prefer it.

- [ ] **Step 3: Open branch only after approval**

```bash
cd /path/to/arena
git fetch origin master
git checkout master
git pull origin master
git checkout -b cursor/dashboard-upgrade-<suffix>
```

---



### Task 1: Shell + period filter + Records KPI card

**Files:**

- Create: `webapp/views/App/views/Dashboard/components/DashboardKpiCard.tsx`
- Create: `webapp/views/App/views/Dashboard/components/DashboardKpiCard.scss`
- Create: `webapp/views/App/views/Dashboard/components/DashboardSection.tsx`
- Create: `webapp/views/App/views/Dashboard/utils/surveyIncludesCleansingStep.ts`
- Create: `webapp/views/App/views/Dashboard/utils/aggregateRecordsTotal.ts`
- Create: `webapp/views/App/views/Dashboard/RecordsSummaryCard/RecordsSummaryCard.tsx`
- Create: `webapp/views/App/views/Dashboard/RecordsSummaryCard/useRecordsStepBreakdown.ts`
- Create: `webapp/views/App/views/Dashboard/Dashboard.tsx`
- Create: `webapp/views/App/views/Dashboard/RecordsSummaryContext.tsx`
- Modify: `webapp/views/App/views/Dashboard/DashboardModule.tsx`
- Modify: `webapp/views/App/views/Dashboard/Dashboard.scss`
- Modify: `webapp/views/App/views/Dashboard/index.ts`
- Modify: `webapp/utils/testId/index.js`
- Modify: `core/i18n/resources/en/homeView.js`
- Modify: `core/i18n/resources/fr/homeView.js`
- Delete (after switch): `webapp/views/App/views/Dashboard/Dashboard.js`
- Delete (after switch): `webapp/views/App/views/Dashboard/RecordsSummaryContext.js`
- Test: `test/unit/tests/046dashboardSurveyGates.test.js`
- Test: `test/unit/tests/047dashboardAggregations.test.js`

**Interfaces:**

- Consumes: `useRecordsSummary()` → `{ counts, userCounts, userDateCounts, dataEntry, dataCleansing, dataAnalysis, timeRange, onChangeTimeRange, from, to }`; API already used in `useGetRecordsSummary.js`
- Produces:
  - `surveyIncludesCleansingStep(surveyInfo: unknown): boolean`
  - `aggregateRecordsTotal(counts: Array<{ count?: string | number }>): number`
  - `DashboardKpiCard` props: `{ titleKey: string; value: string | number; testId?: string; expanded?: boolean; onToggleExpand?: () => void; children?: React.ReactNode }`
  - `RecordsSummaryContext` typed value matching summary state + actions

**UI kit note for this task:** `DashboardKpiCard` → **MUI** (`Card`/`CardActionArea` or Arena `Button` patterns) behind the wrapper. Reject shadcn for this primitive (would pull Tailwind). Document in PR: *KPI card shell → MUI wrapper → Stefano + already in repo*.

- [ ] **Step 1: Write failing unit tests for pure helpers**

Create `test/unit/tests/046dashboardSurveyGates.test.js`:

```javascript
import * as RecordStep from '@core/record/recordStep'
import { surveyIncludesCleansingStep } from '@webapp/views/App/views/Dashboard/utils/surveyIncludesCleansingStep'

describe('surveyIncludesCleansingStep', () => {
  it('returns true when an auth group has cleansing step', () => {
    const surveyInfo = {
      authGroups: [{ recordSteps: { [RecordStep.entryCode]: 'own', [RecordStep.cleansingCode]: 'all' } }],
    }
    expect(surveyIncludesCleansingStep(surveyInfo)).toBe(true)
  })

  it('returns false when no group has cleansing step', () => {
    const surveyInfo = {
      authGroups: [{ recordSteps: { [RecordStep.entryCode]: 'own' } }],
    }
    expect(surveyIncludesCleansingStep(surveyInfo)).toBe(false)
  })
})
```

Create `test/unit/tests/047dashboardAggregations.test.js`:

```javascript
import { aggregateRecordsTotal } from '@webapp/views/App/views/Dashboard/utils/aggregateRecordsTotal'

describe('aggregateRecordsTotal', () => {
  it('sums count fields', () => {
    expect(aggregateRecordsTotal([{ count: '2' }, { count: 3 }])).toBe(5)
  })

  it('returns 0 for empty list', () => {
    expect(aggregateRecordsTotal([])).toBe(0)
  })
})
```

- [ ] **Step 2: Run unit tests to verify they fail**

```bash
yarn build:test:unit
jest dist/__tests__/bundle.unit.js -t "surveyIncludesCleansingStep"
```

Expected: FAIL (module not found / export missing).

- [ ] **Step 3: Implement helpers**

`surveyIncludesCleansingStep.ts`:

```typescript
import * as AuthGroup from '@core/auth/authGroup'
import * as RecordStep from '@core/record/recordStep'
import * as Survey from '@core/survey/survey'

/**
 * True when any survey auth group can act on the cleansing record step.
 */
export const surveyIncludesCleansingStep = (surveyInfo: unknown): boolean => {
  const groups = Survey.getAuthGroups(surveyInfo) ?? []
  for (const group of groups) {
    const steps = AuthGroup.getRecordSteps(group) as Record<string, unknown> | unknown[]
    if (steps && !Array.isArray(steps) && RecordStep.cleansingCode in steps) {
      return true
    }
  }
  return false
}
```

`aggregateRecordsTotal.ts`:

```typescript
type CountRow = { count?: string | number }

export const aggregateRecordsTotal = (counts: CountRow[]): number => {
  let total = 0
  for (const row of counts) {
    total += Number(row.count ?? 0)
  }
  return total
}
```

- [ ] **Step 4: Re-run unit tests — expect PASS**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "surveyIncludesCleansingStep|aggregateRecordsTotal"
```

- [ ] **Step 5: Add i18n keys (EN + FR)**

In `core/i18n/resources/en/homeView.js` under `dashboard`, add:

```javascript
kpi: {
  records: 'Records',
  contributors: 'Contributors',
  storage: 'Storage',
  expandDetails: 'Show details',
  collapseDetails: 'Hide details',
},
recordsCard: {
  total: 'Total records',
  byStep: 'By workflow step',
},
```

Mirror French strings in `core/i18n/resources/fr/homeView.js` (e.g. Records → `Enregistrements`, Contributors → `Contributeurs`, Storage → `Stockage`).

- [ ] **Step 6: Add test ids**

In `webapp/utils/testId/index.js` `dashboard` object, add:

```javascript
kpiRecords: 'dashboard-kpi-records',
kpiContributors: 'dashboard-kpi-contributors',
kpiStorage: 'dashboard-kpi-storage',
periodSelector: 'dashboard-period-selector',
mapSection: 'dashboard-map-section',
activitySection: 'dashboard-activity-section',
trendSection: 'dashboard-trend-section',
samplingSection: 'dashboard-sampling-section',
```

- [ ] **Step 7: Implement** `DashboardKpiCard` **+** `DashboardSection` **(TS)**

`DashboardKpiCard.tsx` — MUI/`Card`-based wrapper with title, value, optional expand, `data-testid`. Keep props stable so later cards reuse it.

`DashboardSection.tsx` — simple titled section container with `testId` prop.

- [ ] **Step 8: Implement** `RecordsSummaryCard`

Use context values `dataEntry`, `dataCleansing`, `dataAnalysis` and `aggregateRecordsTotal(counts)` for the face value. Expand shows step rows using `homeView:dashboard.step.*` labels. Hide cleansing row unless `surveyIncludesCleansingStep(surveyInfo)`.

- [ ] **Step 9: Replace tab shell with** `Dashboard.tsx`

Convert provider to `RecordsSummaryContext.tsx`. Render:

1. `SurveyInfo`
2. `RecordsSummaryPeriodSelector` (add `testId={TestId.dashboard.periodSelector}` on root)
3. KPI row with `RecordsSummaryCard` only for now (placeholders optional — prefer omit empty slots)
4. Do **not** render vertical `Tabs`

Wire `DashboardModule.tsx` to import `./Dashboard` (TS default export). Remove `Dashboard.js`.

Ensure `useRecordsSummary` initial state includes `dataAnalysis: 0` when converting/touching the hook (migrate hook file to `.ts` if edited).

- [ ] **Step 10: Typecheck + lint**

```bash
yarn typecheck
npx eslint --cache --fix webapp/views/App/views/Dashboard
```

Expected: no errors in new files.

- [ ] **Step 11: Manual smoke**

```bash
yarn watch
```

Open `/app/dashboard`: no vertical tabs; Records card shows total; expand shows steps; period selector still fetches; cleansing row absent only when gate is false.

- [ ] **Step 12: Commit**

```bash
git add webapp/views/App/views/Dashboard webapp/utils/testId/index.js core/i18n/resources/en/homeView.js core/i18n/resources/fr/homeView.js test/unit/tests/046dashboardSurveyGates.test.js test/unit/tests/047dashboardAggregations.test.js
git commit -m "feat(dashboard): replace tabs with shell and Records KPI card"
```

---



### Task 2: Contributors card

**Files:**

- Create: `webapp/views/App/views/Dashboard/ContributorsCard/ContributorsCard.tsx`
- Create: `webapp/views/App/views/Dashboard/ContributorsCard/ContributorsDetail.tsx`
- Create: `webapp/views/App/views/Dashboard/utils/filterActiveContributors.ts`
- Modify: `webapp/views/App/views/Dashboard/Dashboard.tsx`
- Modify: `core/i18n/resources/en/homeView.js`, `fr/homeView.js`
- Test: extend `test/unit/tests/047dashboardAggregations.test.js`

**Interfaces:**

- Consumes: `RecordsSummaryContext.userCounts` as `Array<{ owner_uuid?: string; owner_name?: string; owner_email?: string; count: string | number }>`
- Produces: `filterActiveContributors(userCounts): userCounts` — rows with `Number(count) > 0` for selected period (period already applied by API)

- [ ] **Step 1: Failing test for active filter**

```javascript
import { filterActiveContributors } from '@webapp/views/App/views/Dashboard/utils/filterActiveContributors'

describe('filterActiveContributors', () => {
  it('keeps only contributors with count > 0', () => {
    const rows = [
      { owner_email: 'a@x.com', count: '2' },
      { owner_email: 'b@x.com', count: 0 },
    ]
    expect(filterActiveContributors(rows)).toEqual([{ owner_email: 'a@x.com', count: '2' }])
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "filterActiveContributors"
```

- [ ] **Step 3: Implement helper + card UI**

```typescript
type UserCountRow = { owner_email?: string; owner_name?: string; count?: string | number }

export const filterActiveContributors = (userCounts: UserCountRow[]): UserCountRow[] => {
  const active: UserCountRow[] = []
  for (const row of userCounts) {
    if (Number(row.count ?? 0) > 0) {
      active.push(row)
    }
  }
  return active
}
```

`ContributorsCard`: face = number of distinct contributors in `userCounts` (or active count — use `userCounts.length` for total with activity in period). Expand/detail lists email (fallback name) + count. Show “Active contributors” subsection using `filterActiveContributors` (same period data; label clarifies “in selected period”).

- [ ] **Step 4: Mount card in** `Dashboard.tsx` **KPI row**

Place beside Records. `testId={TestId.dashboard.kpiContributors}`.

- [ ] **Step 5: Tests + typecheck + commit**

```bash
yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "filterActiveContributors"
yarn typecheck
git add webapp/views/App/views/Dashboard core/i18n/resources/en/homeView.js core/i18n/resources/fr/homeView.js test/unit/tests/047dashboardAggregations.test.js
git commit -m "feat(dashboard): add Contributors KPI card"
```

---



### Task 3: Storage card + Record trend restyle

**Files:**

- Create: `webapp/views/App/views/Dashboard/StorageCard/StorageCard.tsx`
- Create: `webapp/views/App/views/Dashboard/RecordTrendSection/RecordTrendSection.tsx`
- Modify: `webapp/views/App/views/Dashboard/Dashboard.tsx`
- Modify: `webapp/views/App/views/Dashboard/Dashboard.scss`
- Optionally convert: `StorageSummary/StorageSummary.js` → `.tsx` if substantially restyled
- Optionally convert/restyle: `TotalRecordsSummaryChart/*`

**Interfaces:**

- Consumes: `Survey.getFilesStatistics` / `Survey.getDbStatistics` (same as current `StorageSummary`); `RecordsSummaryContext.counts` for trend
- Produces: lazy Storage detail — face metrics always; gauge/detail mounts when card expanded or section visible

**UI kit note:** Chart chrome stays **Recharts** (existing). Card shell = `DashboardKpiCard` / `DashboardSection` (MUI). No shadcn.

- [ ] **Step 1: Implement** `StorageCard`

Face: used/total percent for files (primary) using existing statistics. Expand renders current `StorageSummary` content (files + DB gauges). Gate visibility with `useAuthCanEditSurvey()` like today’s dashboard tab.

- [ ] **Step 2: Implement** `RecordTrendSection`

Wrap `TotalRecordsSummaryChart` with `DashboardSection`, `testId={TestId.dashboard.trendSection}`. Improve SCSS (spacing, header, empty state) without changing data pipeline. Keep period selector at page level (do not duplicate).

- [ ] **Step 3: Wire into** `Dashboard.tsx`

KPI row: Records | Contributors | Storage. Below: Record trend section.

- [ ] **Step 4: Manual check — no extra network for storage** (stats already on survey info). Trend still reacts to period changes via context.

- [ ] **Step 5: Typecheck + commit**

```bash
yarn typecheck
git add webapp/views/App/views/Dashboard
git commit -m "feat(dashboard): restyle Storage card and Record trend section"
```

---



### Task 4: Sampling-point section (conditional)

**Files:**

- Create: `webapp/views/App/views/Dashboard/SamplingPointSection/SamplingPointSection.tsx`
- Convert: `webapp/views/App/views/Dashboard/hooks/useHasSamplingPointData.js` → `useHasSamplingPointData.ts`
- Modify: `webapp/views/App/views/Dashboard/Dashboard.tsx`

**Interfaces:**

- Consumes: `useHasSamplingPointData(): boolean`; existing `SamplingPointDataSummary` + step counts from context
- Produces: section rendered only when hook is true; `testId={TestId.dashboard.samplingSection}`

- [ ] **Step 1: Convert hook to TypeScript** without behavior change.
- [ ] **Step 2: Wrap** `SamplingPointDataSummary` **in** `SamplingPointSection` **/** `DashboardSection`**.**
- [ ] **Step 3: Conditionally render in** `Dashboard.tsx`**:**

```tsx
{hasSamplingPointData && canEditSurvey && <SamplingPointSection />}
```

- [ ] **Step 4: Manual verify** — survey without sampling keys: section absent; with sampling: section present.

- [ ] **Step 5: Typecheck + commit**

```bash
yarn typecheck
git add webapp/views/App/views/Dashboard
git commit -m "feat(dashboard): add conditional sampling-point section"
```

---



### Task 5: Dashboard map (polygons → owner filter → WHISP)

**Files:**

- Create: `webapp/views/App/views/Dashboard/utils/surveyHasGeoAttributes.ts`
- Create: `webapp/views/App/views/Dashboard/DashboardMapSection/DashboardMapSection.tsx`
- Create: `webapp/views/App/views/Dashboard/DashboardMapSection/useDashboardMapOwners.ts`
- Create: `webapp/views/App/views/Dashboard/DashboardMapSection/DashboardMapOwnerFilter.tsx`
- Create: `webapp/views/App/views/Dashboard/DashboardMapSection/DashboardPolygonPopup.tsx`
- Optional extract: `webapp/views/App/views/Data/MapView/GeoAttributeDataLayer/whispUrls.ts` (from `WhispMenuButton.js` URL helpers)
- Modify: `webapp/views/App/views/Dashboard/Dashboard.tsx`
- Test: extend `046dashboardSurveyGates.test.js`

**Interfaces:**

- Consumes: `Survey.getNodeDefsArray` + `NodeDef.isGeo` (polygons) — optionally include `NodeDef.isCoordinate` only if product asks; **default v1 = geo (Polygon/MultiPolygon) per Trello**
- Consumes: existing `GeoAttributeDataLayer` / geojson export job APIs; WHISP post `/api/survey/:surveyId/geo/whisp/geojson/csv`
- Produces:
  - `surveyHasGeoAttributes(survey): boolean` — any `NodeDef.isGeo`
  - Owner filter state: `selectedOwnerUuid: string | null`
  - Popup fields: record label/name, attribute label, link to record editor route, WHISP Earth Map + CSV actions

**UI kit note:** Map = Leaflet via existing `MapContainer` (not shadcn). Owner filter dropdown = existing Arena `Dropdown` / MUI select wrapped.

- [ ] **Step 1: Failing test for geo gate**

```javascript
import * as NodeDef from '@core/survey/nodeDef'
import { surveyHasGeoAttributes } from '@webapp/views/App/views/Dashboard/utils/surveyHasGeoAttributes'

describe('surveyHasGeoAttributes', () => {
  it('detects geo node defs', () => {
    const survey = {
      nodeDefs: {
        a: { uuid: 'a', type: NodeDef.nodeDefType.geo },
        b: { uuid: 'b', type: NodeDef.nodeDefType.text },
      },
    }
    expect(surveyHasGeoAttributes(survey)).toBe(true)
  })

  it('returns false without geo defs', () => {
    const survey = { nodeDefs: { b: { uuid: 'b', type: NodeDef.nodeDefType.text } } }
    expect(surveyHasGeoAttributes(survey)).toBe(false)
  })
})
```

Adjust fixture shape to match whatever `Survey.getNodeDefsArray` expects in unit tests (follow patterns from other survey unit tests if the stub above is insufficient).

- [ ] **Step 2: Implement** `surveyHasGeoAttributes`

```typescript
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

export const surveyHasGeoAttributes = (survey: unknown): boolean => {
  const defs = Survey.getNodeDefsArray(survey)
  for (const nodeDef of defs) {
    if (NodeDef.isGeo(nodeDef)) {
      return true
    }
  }
  return false
}
```

- [ ] **Step 3: Build lazy** `DashboardMapSection`

- Return `null` if `!surveyHasGeoAttributes(survey)`
- Otherwise render section shell immediately; mount `MapContainer` + geo layers only when section is in view (IntersectionObserver) or on first user expand — mirror “don’t fetch everything”
- Reuse `GeoAttributeDataLayer` for each geo def (checked by default for dashboard)
- **Do not** mount full Data `MapView` chrome / layers panel

- [ ] **Step 4: Owner filter**

Derive owner options from loaded feature properties / record owner fields available on geo export payloads (inspect `GeoAttributeDataLayer` / `convertDataToGeoJsonPoints` for owner fields). Filter layer features client-side by `selectedOwnerUuid`. If export payload lacks owner, stop and confirm with Stefano before adding a backend field — do not invent silent wrong filters.

- [ ] **Step 5: Polygon popup + WHISP**

Popup shows record label, attribute, link to record (same navigation pattern as MapView `onRecordEditClick` / record route). WHISP: reuse Earth Map URL + CSV POST from `WhispMenuButton` (extract shared helpers if needed). **No** API-key settings UI.

- [ ] **Step 6: Wire into Dashboard below KPI/trend (above or below sampling — prefer above activity, below trend)**

`testId={TestId.dashboard.mapSection}`.

- [ ] **Step 7: Manual + typecheck**

Survey without geo: no map DOM. Survey with geo: polygons load after section visible; owner filter narrows; WHISP actions open expected targets; record link works.

```bash
yarn typecheck
git add webapp/views/App/views/Dashboard webapp/views/App/views/Data/MapView/GeoAttributeDataLayer test/unit/tests/046dashboardSurveyGates.test.js
git commit -m "feat(dashboard): add conditional map with owner filter and WHISP actions"
```

---



### Task 6: Recent activity rewrite

**Files:**

- Create: `webapp/views/App/views/Dashboard/RecentActivitySection/RecentActivitySection.tsx`
- Modify: reuse fetch hooks from `ActivityLog/store` (`useActivityLog`, `useGetActivityLogMessages`) without copying buggy list UI
- Modify: `webapp/views/App/views/Dashboard/Dashboard.tsx`
- Optionally leave old `ActivityLog/` components unused or delete in a cleanup commit if nothing else imports them

**Interfaces:**

- Consumes: existing activity log messages API via current store hooks
- Produces: virtualized or windowed list (prefer simple paginated/infinite list first; virtualize if message volume hurts — Stefano perf). Gate with `!activityLogDisabled && canEditSurvey` like today.

- [ ] **Step 1: Implement** `RecentActivitySection`

New presentation: compact rows (timestamp, user, message). Use Arena typography/spacing. `testId={TestId.dashboard.activitySection}`. Isolate fetch errors into an inline error state.

- [ ] **Step 2: Lazy-load** — start fetching when section enters view (or on mount only after KPIs painted — prefer intersection).

- [ ] **Step 3: Wire into Dashboard at bottom.**

- [ ] **Step 4: Manual** — activity appears; failure in activity does not blank KPI cards.

- [ ] **Step 5: Typecheck + commit**

```bash
yarn typecheck
git add webapp/views/App/views/Dashboard
git commit -m "feat(dashboard): rewrite recent activity section"
```

---



### Task 7: Playwright smoke + acceptance pass

**Files:**

- Create: `test/e2e/specs/dashboardUpgrade.spec.ts` (name may follow local e2e naming)
- Modify: `test/e2e/helpers/dashboard.ts` if helpers needed
- Modify: `webapp/utils/testId/index.js` if any ids missing

**Interfaces:**

- Consumes: e2e fixtures (logged-in worker, sample survey) from `test/e2e/fixtures/`
- Produces: smoke coverage for shell + cards + period selector; conditional map skipped or covered when fixture has geo

- [ ] **Step 1: Write Playwright smoke**

```typescript
import { expect, test } from '@playwright/test'
import { TestId } from '@webapp/utils/testId'
import { Urls } from '../helpers/urls'
// use project fixtures for auth + survey as in other specs

test('dashboard upgrade smoke', async ({ page }) => {
  await page.goto(Urls.dashboard)
  await expect(page.getByTestId(TestId.dashboard.kpiRecords)).toBeVisible()
  await expect(page.getByTestId(TestId.dashboard.kpiContributors)).toBeVisible()
  await expect(page.getByTestId(TestId.dashboard.periodSelector)).toBeVisible()
  // vertical tabs gone
  await expect(page.getByRole('tab', { name: /records by user/i })).toHaveCount(0)
})
```

Adapt imports/fixtures to match existing e2e patterns in `test/e2e/specs/`.

- [ ] **Step 2: Run e2e**

```bash
yarn test:e2e test/e2e/specs/dashboardUpgrade.spec.ts
```

Expected: PASS against running server.

- [ ] **Step 3: Acceptance checklist (manual)**

- Real data (not demos)
- EN/FR labels for new keys
- Responsive narrow width usable
- Network: map/activity not all fetched before interaction/visibility
- No Notifications / Active Users / WHISP key UI
- `yarn typecheck` clean

- [ ] **Step 4: Commit**

```bash
git add test/e2e webapp/utils/testId/index.js
git commit -m "test(dashboard): add Playwright smoke for upgraded dashboard"
```

---



## Self-review (plan vs spec)


| Spec requirement                               | Task                                   |
| ---------------------------------------------- | -------------------------------------- |
| Full replace tabs                              | Task 1                                 |
| Period filter                                  | Task 1                                 |
| Records + step breakdown                       | Task 1                                 |
| Conditional cleansing                          | Task 1 (`surveyIncludesCleansingStep`) |
| Contributors + active folded in                | Task 2                                 |
| Storage restyle                                | Task 3                                 |
| Record trend nicer                             | Task 3                                 |
| Conditional sampling section                   | Task 4                                 |
| Conditional map + owner filter + WHISP actions | Task 5                                 |
| No WHISP API key UI                            | Task 5 (explicit)                      |
| Recent activity rewrite                        | Task 6                                 |
| TypeScript + MUI wrappers + kit evaluation     | Tasks 1–6                              |
| EN/FR i18n                                     | Tasks 1–2 (+ as strings added)         |
| Tests / acceptance                             | Tasks 1,2,5,7                          |
| Deferred notifications / active users card     | Not scheduled                          |


**Gaps handled:** Owner-filter depends on geo payload fields — Task 5 Step 4 includes Stefano checkpoint if missing. Step counts already available from API — no new backend assumed.

---



## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-01-dashboard-upgrade.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session with checkpoints

Which approach?