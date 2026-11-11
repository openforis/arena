# Arena Dashboard Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the upgraded `/app/dashboard` feel noticeably more modern via a coherent visual pass on dashboard-owned surfaces (accent-led KPI cards + neutral section chrome), using Arena tokens and MUI `sx`/`styled`, without changing IA or data behavior.

**Architecture:** Add a dashboard-local surface kit (`theme/dashboardSurfaces.ts`, `theme/dashboardAccents.ts`). Restyle `DashboardKpiCard` and `DashboardSection` onto that kit. Wire KPI consumers with accent kinds. Align trend / sampling / activity / map chrome; delete redundant SCSS. Leave `SurveyInfo` and the period selector untouched.

**Tech Stack:** React 18, TypeScript, MUI 9 (`Card`, `Collapse`, `Box`, `SvgIcon` / `@mui/icons-material` path imports), `defaultTokens` from `@webapp/theme/tokens`, Jest unit tests, Playwright smoke (existing), Arena i18n (no new strings expected).

**Spec:** [docs/superpowers/specs/2026-10-02-dashboard-visual-polish-design.md](../specs/2026-10-02-dashboard-visual-polish-design.md)

## Global Constraints

- Style-and-presentation only — no IA, API, auth-gate, or data-pipeline changes.
- Do not restyle `SurveyInfo` or `RecordsSummaryPeriodSelector`.
- Prefer MUI `sx` / `styled` + `defaultTokens`; keep SCSS only for legacy gauge/legend/layout that still needs it (storage gauges, sampling legend, storage-card flex expand).
- Accent-led KPIs only; section chrome is neutral (no colored bars).
- Accent map locked: Records=`blue`+`DescriptionOutlined`, Contributors=`green`+`GroupOutlined`, Storage=`orange`+`StorageOutlined`.
- Radius **8px**; accent bar **4px**; icon chip fill **12%** opacity; KPI hover transition **160ms**.
- Keep existing `testId`s stable.
- New files TypeScript only; cognitive complexity ≤ 15; prefer `for...of`; no `any`; no `console.log`.
- No Tailwind, no shadcn, no pixel-perfect Obab ZIP paste.
- After each task: `yarn typecheck` must pass; commit on the feature branch.

---

## File structure (target)

```
webapp/views/App/views/Dashboard/
  theme/
    dashboardSurfaces.ts          # shared sx recipes
    dashboardAccents.ts           # accent kinds + colors + icons + helpers
  components/
    DashboardKpiCard.tsx          # sx-based; no .scss
    DashboardSection.tsx          # sx-based section shell
  RecordsSummaryCard/RecordsSummaryCard.tsx   # accent="records"
  ContributorsCard/ContributorsCard.tsx       # accent="contributors"
  StorageCard/StorageCard.tsx                 # accent="storage"; keep StorageCard.scss for flex expand
  RecordTrendSection/RecordTrendSection.tsx   # drop chrome SCSS wrapper
  SamplingPointSection/SamplingPointSection.tsx
  RecentActivitySection/
    RecentActivitySection.tsx
    RecentActivityRow.tsx
    RecentActivitySection.scss    # keep only what sx cannot easily replace (list scroll + highlight animation), or migrate fully
  DashboardMapSection/
    DashboardMapContent.tsx
    DashboardMapSection.scss      # keep popup/filter layout; soft-align map chrome radius/border

test/unit/tests/
  048dashboardAccents.test.js     # accent map + withAlpha helper
```

Delete when unused: `components/DashboardKpiCard.scss`, `RecordTrendSection/RecordTrendSection.scss`.

---

### Task 1: Surface kit + accent map + dependency

**Files:**
- Create: `webapp/views/App/views/Dashboard/theme/dashboardSurfaces.ts`
- Create: `webapp/views/App/views/Dashboard/theme/dashboardAccents.ts`
- Modify: `package.json` (and lockfile via yarn) — add `@mui/icons-material`
- Test: `test/unit/tests/048dashboardAccents.test.js`

**Interfaces:**
- Consumes: `defaultTokens` from `@webapp/theme/tokens`
- Produces:
  - `DashboardAccentKind = 'records' | 'contributors' | 'storage'`
  - `DashboardAccent = { color: string; Icon: React.ElementType }`
  - `getDashboardAccent(kind: DashboardAccentKind): DashboardAccent`
  - `withAlpha(hex: string, alpha: number): string` — returns `#RRGGBBAA` for 7-char hex
  - `dashboardSurfaces.card` / `.section` / `.kpiActionHover` / `.detailDivider` — `SxProps` objects (or plain objects suitable for MUI `sx`)

- [ ] **Step 1: Add `@mui/icons-material`**

```bash
yarn add @mui/icons-material
```

Expected: package appears in `package.json` dependencies alongside `@mui/material`.

- [ ] **Step 2: Write the failing unit test**

Create `test/unit/tests/048dashboardAccents.test.js`:

```javascript
import { defaultTokens } from '@webapp/theme/tokens'
import {
  getDashboardAccent,
  withAlpha,
} from '@webapp/views/App/views/Dashboard/theme/dashboardAccents'

describe('withAlpha', () => {
  it('appends AA from alpha 0–1 on a 7-char hex', () => {
    expect(withAlpha('#3885ca', 0.12)).toBe('#3885ca1f')
  })
})

describe('getDashboardAccent', () => {
  it('maps records to blue', () => {
    expect(getDashboardAccent('records').color).toBe(defaultTokens.colors.blue)
  })

  it('maps contributors to green', () => {
    expect(getDashboardAccent('contributors').color).toBe(defaultTokens.colors.green)
  })

  it('maps storage to orange', () => {
    expect(getDashboardAccent('storage').color).toBe(defaultTokens.colors.orange)
  })

  it('exposes an Icon component for each kind', () => {
    for (const kind of ['records', 'contributors', 'storage']) {
      expect(typeof getDashboardAccent(kind).Icon).toBe('object')
    }
  })
})
```

- [ ] **Step 3: Run unit test to verify it fails**

```bash
yarn build:test:unit
yarn jest:unit -t 'withAlpha|getDashboardAccent'
```

Expected: FAIL (module not found / undefined exports).

- [ ] **Step 4: Implement `dashboardAccents.ts`**

```typescript
import type { ElementType } from 'react'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import GroupOutlined from '@mui/icons-material/GroupOutlined'
import StorageOutlined from '@mui/icons-material/StorageOutlined'

import { defaultTokens } from '@webapp/theme/tokens'

export type DashboardAccentKind = 'records' | 'contributors' | 'storage'

export type DashboardAccent = {
  color: string
  Icon: ElementType
}

/**
 * Converts a #RRGGBB color to #RRGGBBAA using alpha in [0, 1].
 *
 * @param {string} hex - Six-digit hex color with leading #.
 * @param {number} alpha - Opacity from 0 to 1.
 * @returns {string} Eight-digit hex color.
 */
export const withAlpha = (hex: string, alpha: number): string => {
  const clamped = Math.min(1, Math.max(0, alpha))
  const aa = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex.toLowerCase()}${aa}`
}

const ACCENTS: Record<DashboardAccentKind, DashboardAccent> = {
  records: { color: defaultTokens.colors.blue, Icon: DescriptionOutlined },
  contributors: { color: defaultTokens.colors.green, Icon: GroupOutlined },
  storage: { color: defaultTokens.colors.orange, Icon: StorageOutlined },
}

/**
 * Returns the locked accent color and icon for a KPI kind.
 *
 * @param {DashboardAccentKind} kind - KPI accent kind.
 * @returns {DashboardAccent} Accent definition.
 */
export const getDashboardAccent = (kind: DashboardAccentKind): DashboardAccent => ACCENTS[kind]
```

- [ ] **Step 5: Implement `dashboardSurfaces.ts`**

```typescript
import { defaultTokens } from '@webapp/theme/tokens'

const RADIUS_PX = 8

export const dashboardSurfaces = {
  card: {
    borderRadius: `${RADIUS_PX}px`,
    border: `1px solid ${defaultTokens.colors.greyBorder}`,
    backgroundColor: defaultTokens.colors.white,
    boxShadow: 'none',
    minWidth: 220,
    flex: 1,
    overflow: 'hidden',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    borderRadius: `${RADIUS_PX}px`,
    border: `1px solid ${defaultTokens.colors.greyBorder}`,
    backgroundColor: defaultTokens.colors.white,
    padding: '1rem',
  },
  sectionTitle: {
    margin: 0,
    textTransform: 'none',
    color: defaultTokens.colors.blueDark,
    fontWeight: 600,
    fontSize: '1rem',
  },
  kpiActionHover: {
    transition: 'background-color 160ms ease',
    '&:hover': {
      backgroundColor: defaultTokens.colors.blueLightFocus,
    },
  },
  detailDivider: {
    borderTop: `1px solid ${defaultTokens.colors.greyBorder}`,
  },
} as const
```

- [ ] **Step 6: Re-run unit tests**

```bash
yarn build:test:unit
yarn jest:unit -t 'withAlpha|getDashboardAccent'
```

Expected: PASS.

- [ ] **Step 7: Typecheck**

```bash
yarn typecheck
```

Expected: no errors in new theme files.

- [ ] **Step 8: Commit**

```bash
git add package.json yarn.lock \
  webapp/views/App/views/Dashboard/theme/dashboardAccents.ts \
  webapp/views/App/views/Dashboard/theme/dashboardSurfaces.ts \
  test/unit/tests/048dashboardAccents.test.js
git commit -m "$(cat <<'EOF'
feat(dashboard): add visual polish surface kit and accents

Introduce dashboard-local sx recipes and locked KPI accent map
with MUI outlined icons for the modern visual pass.
EOF
)"
```

---

### Task 2: Restyle `DashboardKpiCard` and wire accents

**Files:**
- Modify: `webapp/views/App/views/Dashboard/components/DashboardKpiCard.tsx`
- Delete: `webapp/views/App/views/Dashboard/components/DashboardKpiCard.scss`
- Modify: `webapp/views/App/views/Dashboard/RecordsSummaryCard/RecordsSummaryCard.tsx`
- Modify: `webapp/views/App/views/Dashboard/ContributorsCard/ContributorsCard.tsx`
- Modify: `webapp/views/App/views/Dashboard/StorageCard/StorageCard.tsx`
- Keep: `webapp/views/App/views/Dashboard/StorageCard/StorageCard.scss` (flex expand layout only)

**Interfaces:**
- Consumes: `getDashboardAccent`, `withAlpha`, `dashboardSurfaces`, `DashboardAccentKind`
- Produces: `DashboardKpiCardProps` extended with `accent?: DashboardAccentKind`

- [ ] **Step 1: Rewrite `DashboardKpiCard.tsx` to `sx` + accent**

Replace the component with:

```tsx
import React from 'react'
import Box from '@mui/material/Box'
import MuiCard from '@mui/material/Card'
import MuiCardActionArea from '@mui/material/CardActionArea'
import MuiCardContent from '@mui/material/CardContent'
import MuiCollapse from '@mui/material/Collapse'

import { useI18n } from '@webapp/store/system'
import { defaultTokens } from '@webapp/theme/tokens'

import { getDashboardAccent, withAlpha, type DashboardAccentKind } from '../theme/dashboardAccents'
import { dashboardSurfaces } from '../theme/dashboardSurfaces'

export type DashboardKpiCardProps = {
  titleKey: string
  value: string | number
  accent?: DashboardAccentKind
  testId?: string
  expanded?: boolean
  onToggleExpand?: () => void
  children?: React.ReactNode
}

type KpiHeaderProps = {
  title: string
  value: string | number
  expanded: boolean
  expandable: boolean
  accentKind?: DashboardAccentKind
}

const ACCENT_BAR_WIDTH_PX = 4
const ICON_CHIP_ALPHA = 0.12

const KpiHeader = (props: KpiHeaderProps) => {
  const { title, value, expanded, expandable, accentKind } = props
  const accent = accentKind ? getDashboardAccent(accentKind) : null
  const Icon = accent?.Icon

  return (
    <MuiCardContent
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0.5,
        position: 'relative',
        pl: accent ? `${12 + ACCENT_BAR_WIDTH_PX}px` : 2,
      }}
    >
      {accent && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${ACCENT_BAR_WIDTH_PX}px`,
            bgcolor: accent.color,
          }}
        />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', pr: expandable ? 3 : 0 }}>
        {Icon && (
          <Box
            aria-hidden
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: withAlpha(accent.color, ICON_CHIP_ALPHA),
              color: accent.color,
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
        )}
        <Box
          component="span"
          sx={{
            fontSize: '0.85rem',
            textTransform: 'none',
            color: defaultTokens.colors.blueDark,
            fontWeight: 500,
          }}
        >
          {title}
        </Box>
      </Box>
      <Box
        component="span"
        sx={{ fontSize: '2rem', fontWeight: 600, color: defaultTokens.colors.black, lineHeight: 1.2 }}
      >
        {value}
      </Box>
      {expandable && (
        <Box
          component="span"
          className={`icon icon-ctrl icon-12px${expanded ? ' expanded' : ''}`}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            transition: 'transform 0.2s',
            '&.expanded': { transform: 'rotate(180deg)' },
          }}
        />
      )}
    </MuiCardContent>
  )
}

/**
 * KPI card showing a title and a value, with optional accent and expandable details.
 *
 * @param {DashboardKpiCardProps} props - The component props.
 * @returns {React.ReactElement} The card.
 */
export const DashboardKpiCard = (props: DashboardKpiCardProps) => {
  const { titleKey, value, accent, testId, expanded = false, onToggleExpand, children } = props
  const i18n = useI18n()

  const title = i18n.t(titleKey) as string
  const expandable = Boolean(onToggleExpand)
  const toggleLabel = i18n.t(
    expanded ? 'homeView:dashboard.kpi.collapseDetails' : 'homeView:dashboard.kpi.expandDetails'
  )

  return (
    <MuiCard data-testid={testId} variant="outlined" sx={dashboardSurfaces.card}>
      {expandable ? (
        <MuiCardActionArea
          aria-expanded={expanded}
          aria-label={`${title}: ${toggleLabel}`}
          onClick={onToggleExpand}
          sx={dashboardSurfaces.kpiActionHover}
        >
          <KpiHeader title={title} value={value} expanded={expanded} expandable accentKind={accent} />
        </MuiCardActionArea>
      ) : (
        <KpiHeader title={title} value={value} expanded={expanded} expandable={false} accentKind={accent} />
      )}
      {children && (
        <MuiCollapse in={expandable ? expanded : true} unmountOnExit>
          <MuiCardContent sx={dashboardSurfaces.detailDivider}>{children}</MuiCardContent>
        </MuiCollapse>
      )}
    </MuiCard>
  )
}
```

Remove `import './DashboardKpiCard.scss'`.

- [ ] **Step 2: Delete `DashboardKpiCard.scss`**

```bash
rm webapp/views/App/views/Dashboard/components/DashboardKpiCard.scss
```

- [ ] **Step 3: Pass accents from KPI consumers**

In `RecordsSummaryCard.tsx`, add `accent="records"` to `<DashboardKpiCard ...>`.

In `ContributorsCard.tsx`, add `accent="contributors"`.

In `StorageCard.tsx`, add `accent="storage"`. Leave `StorageCard.scss` and the outer `storage-card` wrapper intact (flex expand).

- [ ] **Step 4: Typecheck**

```bash
yarn typecheck
```

Expected: PASS.

- [ ] **Step 5: Manual smoke**

Open `/app/dashboard` with a survey that has records. Confirm:

- Three KPI cards show left accent bars (blue / green / orange) and icons
- Titles are sentence case (not uppercase)
- Expand/collapse still works; storage card still expands to full width
- `SurveyInfo` and period selector look unchanged

- [ ] **Step 6: Commit**

```bash
git add webapp/views/App/views/Dashboard/components/DashboardKpiCard.tsx \
  webapp/views/App/views/Dashboard/RecordsSummaryCard/RecordsSummaryCard.tsx \
  webapp/views/App/views/Dashboard/ContributorsCard/ContributorsCard.tsx \
  webapp/views/App/views/Dashboard/StorageCard/StorageCard.tsx
git add -u webapp/views/App/views/Dashboard/components/DashboardKpiCard.scss
git commit -m "$(cat <<'EOF'
feat(dashboard): restyle KPI cards with accent-led surfaces

Move DashboardKpiCard to sx/tokens with left accent bar and icon
chip; wire Records, Contributors, and Storage accents.
EOF
)"
```

---

### Task 3: Restyle `DashboardSection` + Record trend + Sampling

**Files:**
- Modify: `webapp/views/App/views/Dashboard/components/DashboardSection.tsx`
- Modify: `webapp/views/App/views/Dashboard/Dashboard.scss` (remove section title rules that move into the component, if unused)
- Modify: `webapp/views/App/views/Dashboard/RecordTrendSection/RecordTrendSection.tsx`
- Delete: `webapp/views/App/views/Dashboard/RecordTrendSection/RecordTrendSection.scss`
- Modify: `webapp/views/App/views/Dashboard/SamplingPointSection/SamplingPointSection.tsx` (only if needed for shell padding; usually none)

**Interfaces:**
- Consumes: `dashboardSurfaces.section`, `dashboardSurfaces.sectionTitle`
- Produces: same `DashboardSection` props (`titleKey?`, `testId?`, `children`)

- [ ] **Step 1: Restyle `DashboardSection` with `sx`**

```tsx
import React from 'react'
import Box from '@mui/material/Box'

import { useI18n } from '@webapp/store/system'

import { dashboardSurfaces } from '../theme/dashboardSurfaces'

type DashboardSectionProps = {
  titleKey?: string
  testId?: string
  children: React.ReactNode
}

/**
 * Titled container grouping related dashboard content.
 *
 * @param {DashboardSectionProps} props - The component props.
 * @returns {React.ReactElement} The section.
 */
export const DashboardSection = (props: DashboardSectionProps) => {
  const { titleKey, testId, children } = props
  const i18n = useI18n()

  return (
    <Box component="section" data-testid={testId} sx={dashboardSurfaces.section}>
      {titleKey && (
        <Box component="h3" sx={dashboardSurfaces.sectionTitle}>
          {i18n.t(titleKey) as string}
        </Box>
      )}
      {children}
    </Box>
  )
}
```

- [ ] **Step 2: Simplify Record trend chrome**

Update `RecordTrendSection.tsx` to drop the inner bordered box and SCSS import:

```tsx
import React from 'react'
import Box from '@mui/material/Box'

import { TestId } from '@webapp/utils/testId'
import { defaultTokens } from '@webapp/theme/tokens'

import { DashboardSection } from '../components/DashboardSection'
import { useRecordsSummaryContext } from '../RecordsSummaryContext'
import TotalRecordsSummaryChart from '../TotalRecordsSummaryChart'

/**
 * Section with the trend of records added over the selected period.
 *
 * @returns {React.ReactElement} The section.
 */
const RecordTrendSection = () => {
  const { counts } = useRecordsSummaryContext()

  return (
    <DashboardSection titleKey="homeView:dashboard.totalRecords" testId={TestId.dashboard.trendSection}>
      <Box
        sx={{
          '& .no-records-added': {
            padding: '2rem 0',
            textAlign: 'center',
            color: defaultTokens.colors.blueDark,
          },
        }}
      >
        <TotalRecordsSummaryChart counts={counts} />
      </Box>
    </DashboardSection>
  )
}

export default RecordTrendSection
```

Delete `RecordTrendSection.scss`.

Sampling: confirm `SamplingPointSection` already uses `DashboardSection` only — no extra bordered wrapper. Do not restyle pie/legend SCSS.

- [ ] **Step 3: Clean unused section rules in `Dashboard.scss`**

If `.home-dashboard__section` / `__section-title` are unused after the component move, remove them. Keep `__kpi-row` and page layout.

- [ ] **Step 4: Typecheck + manual check**

```bash
yarn typecheck
```

Manual: trend and sampling sections share the same white shell + radius as KPI cards; empty trend state still readable; sampling chart fits inside the shell.

- [ ] **Step 5: Commit**

```bash
git add webapp/views/App/views/Dashboard/components/DashboardSection.tsx \
  webapp/views/App/views/Dashboard/RecordTrendSection/RecordTrendSection.tsx \
  webapp/views/App/views/Dashboard/Dashboard.scss
git add -u webapp/views/App/views/Dashboard/RecordTrendSection/RecordTrendSection.scss
git commit -m "$(cat <<'EOF'
feat(dashboard): restyle section shell and trend chrome

Align DashboardSection and record trend with shared surface
recipes; drop redundant trend border SCSS.
EOF
)"
```

---

### Task 4: Recent activity + map chrome + residual cleanup

**Files:**
- Modify: `webapp/views/App/views/Dashboard/RecentActivitySection/RecentActivitySection.scss`
- Modify: `webapp/views/App/views/Dashboard/RecentActivitySection/RecentActivityRow.tsx` (optional class tweaks only if needed)
- Modify: `webapp/views/App/views/Dashboard/DashboardMapSection/DashboardMapSection.scss`
- Modify: `docs/superpowers/specs/2026-10-02-dashboard-visual-polish-design.md` (status → Implemented / plan linked)

**Interfaces:**
- Consumes: existing activity/map structure; `defaultTokens` colors via SCSS vars already (`$blueDark`, `$greyBorder`, `$red`)
- Produces: token-aligned hover/separators/radius only — no behavior changes

- [ ] **Step 1: Soft-modernize activity list SCSS**

Update `RecentActivitySection.scss` row/separator/hover (keep highlight animation and grid):

```scss
@use '~@webapp/style/vars' as *;
@use '~@webapp/style/animate' as *;

.recent-activity {
  min-height: 3rem;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    color: $blueDark;
  }

  &__error {
    margin: 0;
    color: $red;
    font-size: 0.85rem;
  }

  &__empty {
    margin: 0;
    color: $blueDark;
    font-size: 0.85rem;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 22rem;
    overflow-y: auto;
  }

  &__row {
    display: grid;
    grid-template-columns: 8rem 10rem 1fr;
    align-items: baseline;
    gap: 0.75rem;
    padding: 0.45rem 0.25rem;
    border-bottom: 1px solid $greyBorder;
    font-size: 0.8rem;
    transition: background-color 160ms ease;

    &:hover {
      background-color: $blueLightFocus;
    }

    &--deleted {
      text-decoration: line-through;
    }

    &--highlighted {
      animation-name: animate-highlight;
      animation-duration: 4s;
    }
  }

  &__date {
    color: $blueDark;
  }

  &__user {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__message p {
    margin: 0;
  }
}
```

Keep lazy-load / empty / error behavior in `RecentActivitySection.tsx` unchanged.

- [ ] **Step 2: Align map section chrome radius/border**

In `DashboardMapSection.scss`, update the map frame to match the 8px radius language (filter/popup layout stays):

```scss
  &__map {
    height: 25rem;
    border: 1px solid $greyBorder;
    border-radius: 8px;
    overflow: hidden;
  }
```

Do not change owner filter or popup markup/behavior.

- [ ] **Step 3: Grep for dead KPI SCSS imports**

```bash
rg "DashboardKpiCard\\.scss|RecordTrendSection\\.scss|dashboard-kpi-card__" webapp/views/App/views/Dashboard
```

Expected: no imports of deleted files; remaining `dashboard-kpi-card` class references only if intentionally kept (prefer none after Task 2).

- [ ] **Step 4: Typecheck + existing smoke**

```bash
yarn typecheck
yarn test:e2e test/e2e/specs/dashboardUpgrade.spec.ts
```

Expected: typecheck clean; Playwright smoke still passes (stable testIds). If e2e env is unavailable in the agent session, note that and run typecheck + manual checklist instead; human must run e2e before merge.

Manual checklist:

- Activity rows hover; empty/error colors readable
- Map frame radius matches sections
- EN/FR labels still fit in KPI headers with icons
- Narrow viewport: KPI row wraps; accents remain visible
- Period selector + SurveyInfo unchanged

- [ ] **Step 5: Update design spec status**

In `docs/superpowers/specs/2026-10-02-dashboard-visual-polish-design.md`, set:

`**Status:** Implemented — see [implementation plan](../plans/2026-10-02-dashboard-visual-polish.md)`

- [ ] **Step 6: Commit**

```bash
git add webapp/views/App/views/Dashboard/RecentActivitySection/RecentActivitySection.scss \
  webapp/views/App/views/Dashboard/DashboardMapSection/DashboardMapSection.scss \
  docs/superpowers/specs/2026-10-02-dashboard-visual-polish-design.md
git commit -m "$(cat <<'EOF'
feat(dashboard): polish activity and map chrome

Align recent activity separators/hover and map frame radius with
the shared dashboard surface language; mark visual polish spec done.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| ---------------- | ---- |
| `dashboardSurfaces.ts` / `dashboardAccents.ts` | Task 1 |
| Accent map + MUI outlined icons | Task 1–2 |
| KPI card chrome (bar, chip, sentence case, hover 160ms) | Task 2 |
| Wire Records / Contributors / Storage accents | Task 2 |
| Neutral `DashboardSection` shell | Task 3 |
| Record trend chrome / drop duplicate border | Task 3 |
| Sampling stays in shell; no pie restyle | Task 3 |
| Activity toolbar/rows/empty-error presentation | Task 4 |
| Map section chrome radius; no MapView redesign | Task 4 |
| SCSS cleanup for KPI + trend | Tasks 2–3 |
| Keep SurveyInfo / period selector | All (explicit non-touch) |
| Stable testIds / typecheck | Tasks 1–4 |
| No IA/API changes | All |

---

## Execution notes

- Prefer path imports (`@mui/icons-material/DescriptionOutlined`) for tree-shaking.
- Do not convert Storage gauges or SamplingPointDataSummary legend to `sx` in this plan.
- If `@mui/icons-material` install is blocked, fall back to inline Material path data via `SvgIcon` (same glyphs) and note the deviation in the PR — do not invent a second icon system.
