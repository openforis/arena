# Arena Dashboard Upgrade — Design Spec

**Date:** 2026-10-01  
**Status:** Approved — implementation plan written  
**Trello:** [SSiIk18R — Integrate the improved dashboard into Arena](https://trello.com/c/SSiIk18R)  
**Related:** [What's next overview](../../dashboard-upgrade-next-steps.md) · [Implementation plan](../plans/2026-10-01-dashboard-upgrade.md)

## Priority of sources

1. **Obab UI decisions** (most recent product/UX communication) — highest priority
2. **Stefano technical constraints** — binding for implementation approach
3. **Trello card** — original wishlist; items that conflict with (1) are deferred or cut

## Goal

Replace the current tabbed `/app/dashboard` with a modern, single-page dashboard that surfaces the highest-value survey health signals (records, contributors, storage, trend, conditional map / sampling / activity), using real Arena data. Rebuild in-repo with the prototype ZIP as visual/behavior reference only — do not paste prototype code.

## Locked product decisions


| Topic                     | Decision                                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery approach         | **Incremental slices** on the same route (Approach 2)                                                                                         |
| Layout                    | **Full replace** of vertical tabs; rehome needed pieces into new sections                                                                     |
| Visual fidelity           | **Middle path** — Obab card/map composition; Arena styling (not pixel-perfect ZIP)                                                            |
| Progress under Records    | Counts by existing record `step` (entry / cleansing / analysis). Nested labels map to those steps (e.g. “Data Entry” = entry-step count).     |
| Cleansing sub-stat        | **Conditional** — show when the survey’s workflow includes the cleansing step (Arena record steps config), not only when counts are non-zero  |
| Active contributors       | Contributors with at least one record activity in the **selected period** (folded into Contributors detail; no separate card)                 |
| Sampling point completion | **Keep** as its own conditional section when survey has sampling-point data                                                                   |
| Active Users card         | **Remove** (fold active contributors into Contributors)                                                                                       |
| Notifications card        | **Defer** (future admin/community messaging)                                                                                                  |
| WHISP                     | **Reuse** existing Data MapView WHISP actions (Earth Map / CSV) on polygon select — **no** survey-level encrypted API-key UI in this delivery |
| Map implementation        | Lighter dashboard map first; extract shared geo/WHISP helpers with Data MapView over time                                                     |
| UI stack default          | MUI behind Arena wrappers; per-element MUI vs shadcn evaluation (see below)                                                                   |
| Languages                 | Arena i18n; EN/FR required; other langs fall back per Arena defaults                                                                          |




## Information architecture

Single scrollable page on `/app/dashboard`:

1. **Survey header** — existing `SurveyInfo` (or thin TS equivalent)
2. **Global period filter** — reuse year/week/etc.; drives time-bound stats
3. **KPI row**
  - **Records** — total; detail/expand → step breakdown (Data Entry / Analysis; Cleansing if applicable)  
  - **Contributors** — count; detail → email list + active contributors + light per-user stats  
  - **Storage** — existing data, restyled as a card
4. **Map** (conditional) — geo/polygon surveys only; owner filter; polygon popup + WHISP actions
5. **Record trend** — existing chart, visually improved; same period filter
6. **Sampling point completion** (conditional)
7. **Recent activity** — rewrite; inspire from current Activity log; do not reuse buggy presentation as-is

**Out of scope for this delivery:** Notifications card, Active Users card, survey WHISP API-key encryption/config UI, Tailwind-as-app-default, blind ZIP paste.

## Architecture



### Repo standards

- All **new** files in TypeScript (`.ts` / `.tsx`); convert substantially rewritten `.js` modules (including `Dashboard.js`) to TypeScript  
- Domain types from `@openforis/arena-core` where available  
- Cognitive complexity ≤ 15; prefer `for...of`; short “why” comments/JSDoc  
- Verify with `yarn typecheck` and lint on each slice



### Frontend structure

Under `webapp/views/App/views/Dashboard/`:

- Thin `Dashboard.tsx` shell: header + period filter + section slots  
- Shared wrappers with clear props (Stefano): e.g. `DashboardKpiCard`, `DashboardSection`  
- Feature modules (UI + local hooks), for example:
  - `RecordsSummaryCard`
  - `ContributorsCard`
  - `StorageCard` (wrap/restyle current storage summary)
  - `RecordTrendSection`
  - `SamplingPointSection`
  - `DashboardMapSection` (lighter Leaflet map)
  - `RecentActivitySection`

Period state stays in a shared context (evolve today’s `RecordsSummaryContext` pattern).

### Data & performance

- Do not fetch all dashboard data on mount  
- Lazy-load heavy sections (map, storage detail) when visible or first opened  
- Map mounts only after a cheap “has geo attributes?” check  
- Prefer existing APIs for v1; new/changed backend only if step breakdown or owner-filter geo cannot be derived cleanly — confirm with Bab before that slice  
- Section-level failure isolation



### Modern look & MUI vs shadcn policy

Aim for a cool, modern dashboard **within Arena’s visual system** (theme tokens in `webapp/theme/tokens.ts`, careful SCSS, hierarchy, light motion).

When introducing a non-trivial UI primitive, record a short trade-off scored in this order:

1. **Stefano constraints** — wrapper-friendly; avoids locking the app to a new stack; no repo-wide second design system / Tailwind unless explicitly approved
2. **Look / modernity**
3. **Performance** — bundle cost, render cost, lazy-load fit

**Default:** MUI behind Arena wrappers (already in the repo).  

**shadcn / Radix:** only if a specific element wins on look/performance **and** still satisfies Stefano constraints (thin wrapped primitive without forcing Tailwind across Arena). If it implies a new global styling toolchain, it loses for this delivery — push modernity through MUI wrappers + tokens/SCSS instead.

Each slice that adds a shared primitive documents: *element → choice → why*.

## Interactions & errors

- Cards: clear face metrics; expand/detail for nested info; no accidental whole-page navigation  
- Map: hidden without geo; owner filter; popup with survey/record label, attribute, record link, WHISP actions; loading/empty states  
- Activity/trend/storage: empty and error messages; failed section does not blank the page  
- Preserve existing auth gates (e.g. storage/activity visibility consistent with current dashboard)



## Delivery slices

1. Shell + period filter + Records card (step breakdown; conditional Cleansing)
2. Contributors card
3. Storage + Record trend restyle
4. Sampling-point section (conditional)
5. Dashboard map (polygons → owner filter → WHISP actions)
6. Recent activity rewrite

Process: development plan reviewed with Stefano/Bab **before** opening the implementation branch; then land slices as reviewable PRs.

## Testing

- Unit/hook tests for non-trivial logic (step aggregation, owner filter, geo/cleansing/sampling gates)  
- Playwright smoke: cards with real fixture data, period filter updates counts, conditional sections hide when N/A, map popup record link when geo fixture exists  
- Manual: EN/FR, responsive desktop/narrow, no full-page fetch storm



## Acceptance criteria (this delivery)

- Dashboard shows real Arena data (not demos)  
- Tabbed layout removed; Obab IA live  
- Period/date filtering preserved  
- Map only when geo present; owner filter works; WHISP via existing actions  
- No Notifications / Active Users / survey WHISP key UI  
- TypeScript standards met for new/rewritten code  
- Build, typecheck, and functional checks pass; existing surveys continue to work



## Deferred (explicit)

- Admin/community notifications product  
- Survey-level WHISP API key encryption + config UI (Trello)  
- Pixel-perfect ZIP visual clone  
- Full Data `MapView` embed on Home  
- Stored per-record progress beyond existing `step` (unless Bab later requires it)



## Sources

- Obab UI notes + [Internal with Obab](https://app.notion.com/p/3eba458bdbaf8073940ee35b392a4dd7)  
- [Technical with Stefano](https://app.notion.com/p/3eba458bdbaf8030b6b8e074e5a10666)  
- Trello card PDF / [SSiIk18R](https://trello.com/c/SSiIk18R)  
- Prior context: `internal/dashboard-brainstorm-context.md`

