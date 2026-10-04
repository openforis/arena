# Arena Dashboard Visual Polish — Design Spec

**Date:** 2026-10-02  
**Status:** Implemented — see [implementation plan](../plans/2026-10-02-dashboard-visual-polish.md)  
**Parent:** [Dashboard upgrade design](./2026-10-01-dashboard-upgrade-design.md)  
**Related plan:** [Dashboard visual polish implementation](../plans/2026-10-02-dashboard-visual-polish.md)  
**Related plan (parent):** [Dashboard upgrade implementation](../plans/2026-10-01-dashboard-upgrade.md)

## Goal

Make the upgraded `/app/dashboard` feel **noticeably more modern** through a coherent visual pass on **dashboard-owned surfaces**, while fully respecting the locked product, IA, and stack decisions from the 2026-10-01 upgrade spec.

This is a **style-and-presentation** delivery. No information-architecture changes, no new cards, no data-pipeline changes.

## Priority of sources

1. **2026-10-01 dashboard upgrade design** (locked product / IA / MUI-default / deferred items) — binding  
2. **Arena frontend conventions** — TypeScript for new files; prefer MUI `sx` / `styled` + `defaultTokens` over new SCSS  
3. **This visual polish spec** — how to push modernity within those bounds  

## Locked decisions (from brainstorm)

| Topic | Decision |
| ----- | -------- |
| Ambition | **Noticeably modern** — stronger surfaces, clearer hierarchy, light motion; still unmistakably Arena |
| Scope | **Dashboard-owned surfaces only** — KPI cards, `DashboardSection`, trend / activity / sampling / map chrome |
| Out of visual scope | `SurveyInfo`, period selector, Data `MapView` redesign |
| Card language | **Accent-led** — thin left accent bar + tinted icon chip per KPI; Arena palette only |
| Styling stack | Prefer **MUI `sx` / `styled` + `defaultTokens`**; keep SCSS only where legacy chart/gauge markup still needs it |
| Approach | **Small dashboard-local surface kit** (not a global design system; not Tailwind/shadcn) |
| Product / IA | Unchanged vs 2026-10-01 (no Notifications, no Active Users, no WHISP key UI, same gates and period filter) |

## Architecture

A **dashboard-local** kit under `webapp/views/App/views/Dashboard/` (files live in that folder’s `theme/` subdirectory):

| Module | Role |
| ------ | ---- |
| `theme/dashboardSurfaces.ts` | Shared `sx` recipes from `defaultTokens`: card surface, section shell, detail divider, hover/focus, expand-related transitions |
| `theme/dashboardAccents.ts` | Locked accent map for KPI kinds only |
| `DashboardKpiCard` | Consumes surface + accent; left bar + icon chip; expand/collapse behavior unchanged |
| `DashboardSection` | Neutral section shell (title + content); no colored accent bar |
| Section wrappers | Trend, activity, sampling, map compose via `DashboardSection` + shared recipes; drop redundant chrome SCSS |

**Non-goals for this kit:** repo-wide theme rewrite, second design system, Tailwind-as-app-default, shadcn unless a future slice re-evaluates per Stefano constraints (not expected here).

**Data & behavior:** unchanged — same `RecordsSummaryContext`, APIs, auth gates, lazy-load rules, test IDs.

## Accents & KPI cards

### Accent map

| KPI | Accent token | Color | MUI icon |
| --- | ------------ | ----- | -------- |
| Records | `blue` | `#3885ca` | `DescriptionOutlined` |
| Contributors | `green` | `#84ac67` | `GroupOutlined` |
| Storage | `orange` | `#eba444` | `StorageOutlined` |

### Card chrome

- Soft white surface; radius **8px**; light `greyBorder` (move away from heavy outlined-only look)
- **4px left accent bar** in the KPI’s accent color
- Icon in a small tinted chip (accent fill at **12%** opacity; icon at full accent)
- Title: sentence case (drop aggressive uppercase); `blueDark` (`colorTextPrimary`)
- Value: keep large (~2rem), `black`
- Expand chevron: keep; light rotate + soft hover background on the action area
- Details panel: top divider in `greyBorder`; existing expand/collapse and children unchanged

### API

Extend `DashboardKpiCard` with a thin presentational prop:

- `accent?: 'records' | 'contributors' | 'storage'`

Default icons come from the accent map. Optional icon override is not required for v1.

Each KPI consumer passes its accent kind only; no hardcoded hex in feature modules.

## Section chrome

### `DashboardSection`

- Neutral surface: white fill, same radius as KPI cards, light `greyBorder`, consistent padding
- Title hierarchy: `blueDark`, medium weight, no uppercase
- No colored accent bar (KPI-only)
- Existing `titleKey` / `testId` contracts unchanged

### Per section (chrome only)

| Section | Change |
| ------- | ------ |
| Record trend | Chart inside section shell; remove duplicated ad-hoc bordered box; empty state uses muted token text + comfortable padding |
| Recent activity | List inside section shell; quiet toolbar row; light row hover / clearer separators; empty/error styling aligned to tokens |
| Sampling point | Existing summary inside same shell; do not restyle pie/legend guts beyond fitting the container |
| Map | Section shell around existing map; filter/popup controls unchanged; no Data MapView redesign |

### SCSS cleanup

- Migrate `DashboardKpiCard` and section chrome off co-located SCSS onto `sx` / `styled` + tokens as those files are touched
- Delete hollow SCSS files when unused
- Keep SCSS only for legacy chart/gauge/legend markup that still needs it (e.g. storage gauges, sampling legend) until a later dedicated touch

## Motion

Light only:

- Soft hover on KPI action area (**160ms** background transition)
- Keep MUI `Collapse` for expand/collapse and existing expand-icon rotate
- **No** page-load animations, staggered card entrances, or decorative map motion

## Errors, empty states, auth

- Behavior unchanged: section-level failure isolation; same empty/error copy paths; same auth gates (storage / activity / sampling visibility)
- Presentation only: empty/error text color and spacing aligned to tokens

## Testing

- Keep Playwright smoke `testId`s stable — no product assertion changes required for style alone
- Manual: EN/FR labels still fit; desktop + narrow KPI wrap; accents readable with icon + label (not color alone)
- `yarn typecheck` and lint on touched files

## Acceptance criteria

- Dashboard-owned surfaces share one coherent surface language (KPI accents + neutral sections)
- Accents match the locked map; icons are MUI outlined as specified
- `SurveyInfo` and period selector are visually untouched by this delivery
- No IA / API / auth-gate changes
- Styling for new/changed chrome prefers `sx` / `styled` + `defaultTokens`
- Build, typecheck, and existing dashboard smoke still pass

## Explicit non-goals

- Restyling `SurveyInfo` or the period filter
- Notifications card, Active Users card, survey WHISP API-key UI
- Pixel-perfect Obab ZIP clone
- Tailwind-as-app-default or a second global design system
- Full Data `MapView` embed/redesign
- Changing record-step aggregation, owner filter, or WHISP actions

## Delivery shape (for implementation plan)

Suggested slices (style-only):

1. Surface kit + accent map + `DashboardKpiCard` restyle (Records / Contributors / Storage wired to accents)
2. `DashboardSection` restyle + Record trend + Sampling chrome
3. Recent activity + Map section chrome + SCSS cleanup / dead-file removal

## Sources

- Brainstorm 2026-10-02 (Approach 2 — dashboard surface kit)
- [2026-10-01 dashboard upgrade design](./2026-10-01-dashboard-upgrade-design.md)
- Arena tokens: `webapp/theme/tokens.ts`
- Arena frontend conventions (`.cursor/rules/arena-frontend-conventions.mdc`)
