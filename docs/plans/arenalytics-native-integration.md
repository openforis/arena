# Plan: Native Arenalytics-equivalent analytics in Arena

Status: draft, not yet implemented
Owner: TBD
Related: Analysis/Chain module, Data Explorer / DataQuery, surveyRdb

## 1. Context and goal

[Arenalytics](https://github.com/openforis/arenalytics) is a standalone R/Shiny app that
survey teams use to compute design-based (weighted) statistics — means, totals, area
estimates, confidence intervals — from an Arena data export, and to view/export the
results as tables and charts. It is fully decoupled from Arena: export a ZIP, upload it,
analyze, export a report.

Arena already contains most of the building blocks Arenalytics duplicates externally:

- The **Analysis/Chain (R Chain)** module runs `survey`/`srvyr`-based weighted statistics
  directly against the survey's own Postgres data, using RStudio Server sessions
  (`server/modules/analysis/service/rChain/`, `server/modules/analysis/service/rStudio/`).
- The **DataQuery / Data Explorer** engine (`webapp/components/DataQuery/`) already offers
  entity-scoped querying, aggregation, and Recharts-based visualization
  (`webapp/components/DataQuery/Visualizer/`, `webapp/charts/*`).
- The **surveyRdb** layer (`server/modules/surveyRdb/`) is the shared query/export backbone
  used by both of the above.

Goal: stop treating "view chain results as charts/dashboards" as a gap that requires a
separate app. Wire the R chain's output into the existing query/visualization pipeline so
weighted survey statistics can be browsed and charted inside Arena, with report export as
a later, lower-priority step.

## 2. Architecture decision: how are chain results exposed for querying?

**Recommendation: do NOT bolt OLAP/result data onto the existing `surveyRdb` entity-query
API (`POST /surveyRdb/:surveyId/:nodeDefUuidTable/query`) as-is. Add a small, separate,
purpose-built API and query path for chain/OLAP results, reusing the *rendering* layer
(Visualizer, Recharts components) but not the *aggregation* layer (`SqlSelectAggBuilder`).**

Reasoning, grounded in what the code actually does:

- The existing aggregate path is structurally tied to `NodeDef`s that are part of the
  survey definition tree: the URL param is literally a node def UUID
  (`webapp/service/api/surveyRdb/index.js`), and the server resolves it via
  `Survey.getNodeDefByUuid` before building a `ViewDataNodeDef`
  (`server/modules/surveyRdb/repository/dataView/read.js`,
  `readAgg.js`). `olap_data_cycle_<cycle>_<entity>` tables
  (`common/model/db/tables/olapData/table.js`) are not addressable this way — they are
  chain-scoped, cycle-scoped tables outside the node-def hierarchy, with all columns typed
  `varchar` and an extra `exp_factor_` weight column and `<baseUnit>_uuid` column that have
  no `NodeDef` counterpart in the query model.
- Even if a synthetic `NodeDef`/`ViewDataNodeDef` were faked to satisfy the query builder,
  `SqlSelectAggBuilder` (`common/model/db/sql/sqlSelectAggBuilder.js`) only knows unweighted
  `AVG/SUM/COUNT/MIN/MAX/MEDIAN`. Running `AVG(value)` over `olap_data_*` rows ignores
  `exp_factor_` entirely and silently produces **statistically wrong** estimates for any
  non-self-weighting design (stratified, two-phase, clustered) — the exact class of error
  Arenalytics/`srvyr` exists to avoid. Weighted aggregation belongs in R (already solved,
  via `init-packages.R`'s `survey`/`srvyr`) or in a small dedicated SQL/aggregation layer
  that explicitly multiplies by `exp_factor_` and is aware of `stratumNodeDefUuid` /
  `postStratificationAttributeDefUuid` from `ChainSamplingDesign` — never through the
  generic entity aggregate builder, which has no such concept and shouldn't grow one just
  for this.
- Consequence: the cleanest seam is to let R continue to be the place where weighted
  statistics are computed (mean, total, SE, CI bounds per dimension/stratum combination),
  persist that *already-aggregated* result as a new, small "chain result" table (see §4),
  and query that table in **raw/pass-through mode** (no re-aggregation, no weighting logic
  in SQL) through a new lightweight endpoint. The existing `DataQuery`/`Visualizer`/
  `useDataQueryChartData` layer can then render it because by that point it's just rows of
  `{dimension label, mean, ci_low, ci_upp, n, ...}` — structurally identical to what
  `Visualizer` already consumes, it just doesn't need `Query`'s aggregate-mode branch.

This keeps the statistically load-bearing part of the system (weighting, design effects,
lonely-PSU handling) in the one place that already does it correctly, and reuses Arena's
UI stack purely for presentation.

## 3. Phased implementation

### Phase 1 — Bridge chain/OLAP results into the DataQuery rendering pipeline

**Goal:** prove the end-to-end path — chain produces weighted results → results land in
Postgres → existing Recharts chart components render them — without an export/upload
round trip.

Server:
- Add a new table shape for **computed statistical results** (see §4), populated by a new
  R chain step alongside `PersistResultsJob`/`PersistOlapDataJob` (`server/modules/analysis/service/rChain/`,
  `server/modules/analysis/service/olap/`). The R side already has the data
  (`olap_data_*` + `exp_factor_`) and the packages (`survey`, `srvyr` per
  `rFile/system/init-packages.R`); add an `RFileStatisticalAnalysis`-adjacent step (see
  existing `server/modules/analysis/service/rChain/rFile/system/RFileStatisticalAnalysis`)
  that calls `svydesign()`/`svyby()`/`svymean()`/`svytotal()` and writes a results CSV,
  consumed by a new `PersistChainStatsJob` modeled on `PersistOlapDataJob.js`.
- New repository module `server/modules/surveyRdb/repository/chainStatsTable/` (mirrors
  `repository/olapDataTable/`: `create.js`, `insert.js`, `delete.js`, `index.js`) plus
  entries in `schemaRdbRepository.js` for a new table-name prefix (e.g. `chain_stats_`) so
  `dropDataTablesAndViewsWithPrefixes` and `selectOlapDataTablesExists`-style existence
  checks cover it.
- New API module `server/modules/analysis/api/chainStatsApi.js` (or extend
  `rChainApi.js`) exposing `GET /chain/:chainId/results/:entityDefUuid` (or similar) that
  does a plain `SELECT` against the chain-stats table for a given chain/entity/dimension
  combination — no `Query`/`SqlSelectAggBuilder` involvement, just filtering/sorting.
- Service layer: `server/modules/analysis/service/chainStatsService.js` wrapping the
  repository, following the pattern of `surveyRdbService.js`.

Web app:
- New API client `webapp/service/api/analysis/chainStats.js` (pattern:
  `webapp/service/api/surveyRdb/index.js`).
- New container component, e.g. `webapp/views/App/views/Analysis/Chain/ChainResultsViewer/`,
  that fetches chain-stats rows and feeds them to a **new, thinner** hook parallel to
  `useDataQueryChartData.js` (call it `useChainStatsChartData.js`) — reuse its
  color/decimal-rounding conventions but drop the `Query`-aggregate-mode-specific parts
  (dimension/measure UUID resolution against `Query.getMeasures`/`Query.getDimensions`)
  since chain-stats rows are already shaped as `{label, value, ...}`.
- Reuse `webapp/components/DataQuery/Visualizer/Visualizer.js`'s table/chart switch
  pattern and `webapp/charts/{BarChart,LineChart}` directly — pass `data`, `dataKeys`,
  `labelDataKey` as already defined by those components' `propTypes`.
- Surface the new viewer as a tab/section inside `ChainDetails.js`
  (`webapp/views/App/views/Analysis/Chain/ChainDetails.js`), next to the existing
  RStudio panel (`ChainRStudioPanel.js`).

This phase deliberately does **not** touch `surveyRdb`'s aggregate query path — it adds a
parallel, narrower one.

### Phase 2 — Multi-widget dashboard

**Goal:** let a user lay out several saved queries/chain-result widgets on one page,
which today's Data Explorer (`webapp/views/App/views/Data/Explorer/Explorer.js`) cannot
do — it is one entity/one chart/one table at a time, and there is currently no persisted
"saved query" concept server-side (state lives only in `webapp/store/dataExplorer/`).

Server:
- New table for dashboards/widgets (survey-scoped): `dashboard`, `dashboard_widget`
  (widget references either a `Query` (DataQuery) or a chain-stats query
  definition + chart-type + display options). Add manager/repository/service/API modules
  under a new `server/modules/dashboard/` following the module layout used by
  `server/modules/analysis/` (`api/`, `manager/`, `repository/`, `service/`).

Web app:
- New Redux slice `webapp/store/dashboard/` (state/reducer/selectors/hooks — same shape as
  `webapp/store/dataExplorer/`).
- New view `webapp/views/App/views/Data/Dashboard/` (or `Analysis/Dashboard/`), added to
  the app's route/menu config alongside `Data/Explorer`.
- A `DashboardWidget` component that embeds either `DataQuery`'s `Visualizer` (existing
  entity queries) or the Phase-1 `ChainResultsViewer` chart, in a grid/layout container.
- Widget CRUD reuses `DataQueryExportModal`-style modal patterns for "save as widget."

This phase is the largest scope item and should be sized/estimated separately once Phase 1
validates the data shape.

### Phase 3 — Confidence-interval / error-bar rendering

**Goal:** display CI/SE alongside point estimates, since that's Arenalytics' core value
proposition for design-based estimates.

**Recharts already supports this natively** (`recharts@3.7.0`, confirmed present in
`node_modules/recharts/{es6,lib}/cartesian/ErrorBar.js` and
`context/ErrorBarContext.js`) via an `<ErrorBar dataKey="..." />` child element inside
`<Bar>`, `<Line>`, or `<Scatter>`. **It is currently unused anywhere in `webapp/`** — this
is additive UI work, not a library capability gap, which significantly reduces this
phase's effort versus the original assumption.

Server: ensure the Phase 1 chain-stats table/API expose `ci_low`/`ci_upp` (or `se`) columns
per row (see §4) so the front end doesn't need to compute them.

Web app:
- Extend `webapp/charts/BarChart/BarChart.js` (and similarly `LineChart.js`,
  `ScatterChart.js`) to optionally render `<ErrorBar dataKey={errorDataKey} />` per series,
  gated by a new optional prop (e.g. `errorDataKeys`), following the existing
  `dataKeys`/`dataColors` array-parallel prop convention already used there.
  Compute the error value as `[value - ci_low, ci_upp - value]` (Recharts `ErrorBar`
  expects either a symmetric single value or an asymmetric `[lower, upper]` pair depending
  on version — verify against the installed `ErrorBar.d.ts` during implementation).
- Extend `useChainStatsChartData.js` (Phase 1) to compute/pass through the error-bar data
  key alongside the existing value data key, mirroring how `dataKeysByMeasureNodeDefUuid`
  is built in `useDataQueryChartData.js`.
- `webapp/components/DataQuery/Visualizer/DataQueryTable` (or its chain-stats analogue)
  should also render CI columns in table mode, not just chart mode.

### Phase 4 — Report export (optional / lower priority)

**Goal:** analogous to Arenalytics' Quarto Word/HTML export.

- Reuse `webapp/utils/chartExportUtils.js` (`downloadMultipleSvgsToPng`) as the basis for
  a "export dashboard/chart as image" action, already SVG/canvas-based and framework
  agnostic.
- For structured document export (Word/HTML, not just images), evaluate whether the
  existing `DataQueryExportModal` (`webapp/components/DataQuery/DataQueryExportModal/`)
  CSV/XLSX pattern can be extended, or whether a new server-side job (pattern:
  `server/modules/surveyRdb/service/SurveysRdbRefreshJob.js`-style `Job` subclass) is
  needed to assemble a multi-chart report server-side. This needs a design spike before
  committing to an approach — do not scope work here until Phases 1–3 land and it's clear
  whether users actually need Word/HTML output versus PNG/CSV.

## 4. Data model changes

New tables (survey RDB schema, i.e. `Schemata.getSchemaSurveyRdb(surveyId)`, same schema
`olap_data_*` already lives in):

- `chain_stats_cycle_<cycle>_<entity>` (name TBD, prefix must be added to
  `schemaRdbRepository.js`'s prefix lists so drop/recreate lifecycle works like
  `olap_data_*`): one row per (chain, dimension combination, measure), columns roughly:
  `id`, `chain_uuid`, dimension columns (mirroring `attributeDefsForColumns` pattern from
  `TableOlapData`), `measure_node_def_uuid`, `estimate_type` (mean/total/count/ratio),
  `value`, `se`, `ci_low`, `ci_upp`, `n` (sample size), `deff` (design effect, optional).
  Model this class the same way `TableOlapData` (`common/model/db/tables/olapData/table.js`)
  is modeled — a small class encapsulating table-name generation and column definitions —
  so `createOlapDataTable`/`insertOlapData`/`clearOlapData`
  (`server/modules/surveyRdb/repository/olapDataTable/`) can be near-directly mirrored.
- Dashboard/widget tables for Phase 2 (see above), likely in the main survey schema
  (`Schemata.getSchemaSurvey`) rather than the RDB schema, since they're user-authored
  config, not derived/rebuildable data — unlike `olap_data_*` and `chain_stats_*`, which
  are dropped/recreated by `surveyRdbCreationJob`.

No changes needed to `olap_data_*` table shape itself — it already carries `exp_factor_`
and dimension/key columns, which is exactly what R needs as input to compute the new
`chain_stats_*` output.

## 5. Risks / open questions (need a decision before implementation starts)

1. **Where should weighted aggregation actually run?** This plan assumes R
   (`survey`/`srvyr`, already wired into the chain) computes final statistics and Postgres
   only stores/serves the result. An alternative is to implement weighted SQL aggregates
   (`SUM(value * exp_factor_) / SUM(exp_factor_)`) directly against `olap_data_*` and skip
   the new `chain_stats_*` table. This is cheaper to build but re-implements (and risks
   getting wrong) stratification/lonely-PSU/design-effect logic that `survey`/`srvyr`
   already handle. Recommend: keep R as the sole place statistics are computed; treat any
   SQL-side weighted aggregation as out of scope unless a concrete need (e.g. ad-hoc
   drill-down beyond what was pre-computed) justifies the risk.
2. **When does `chain_stats_*` get (re)computed?** Chain re-run today is triggered
   interactively via RStudio (`rStudio/index.js`) or the chain run pipeline
   (`rChain.js`). Need to decide whether populating `chain_stats_*` is automatic on every
   successful chain run/publish, or a separate explicit "compute statistics" action.
3. **Should `chain_stats_*` results be tied to the chain's specific sampling design
   config at the time of computation**, so old dashboard widgets don't silently
   mis-render after someone changes `stratumNodeDefUuid`/`samplingStrategy`
   (`ChainSamplingDesign`)? Likely yes — store a snapshot or version marker.
4. **Access control**: `surveyRdbApi.js` guards entity queries with
   `requireRecordListViewPermission`. Chain-stats endpoints need their own permission
   check — probably reuse whatever gates `rChainApi.js` today, but confirm chain results
   shouldn't be visible to users who can't see the underlying raw records.
5. **Dashboard persistence scope (Phase 2)**: is a dashboard survey-global, per-user, or
   per-cycle? This determines whether `dashboard`/`dashboard_widget` tables need a
   `user_uuid` column and how sharing/permissions work.
6. **Chart types beyond bar/line/scatter**: Arenalytics uses `d3scatter` for
   interactive scatter and DT for tables; confirm `webapp/charts/ScatterChart` covers the
   needed interaction (zoom/brush) or whether that's a gap to size separately.

## 6. Sequencing

1. Phase 1 is the prerequisite for everything else — it establishes the `chain_stats_*`
   table shape and the R-side computation step. Nail down the open questions in §5.1–5.3
   before writing the table schema, since they affect its columns (versioning,
   permission scoping).
2. Phase 3 (error bars) only requires Phase 1's table to expose `ci_low`/`ci_upp`; it can
   be implemented in parallel with Phase 2 once Phase 1's API/data shape is stable, since
   it only touches `webapp/charts/*` and the Phase-1 hook, not the dashboard layer.
3. Phase 2 (dashboard) depends on Phase 1 (needs something worth putting in a widget) but
   not on Phase 3 — CI display can be retrofitted into dashboard widgets after the fact.
4. Phase 4 (report export) should start only after real usage of Phases 1–3 clarifies
   whether Word/HTML export is actually needed versus PNG/CSV already provided by
   `chartExportUtils.js` / `DataQueryExportModal`.
