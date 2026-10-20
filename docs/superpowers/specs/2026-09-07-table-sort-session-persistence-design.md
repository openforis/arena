# Table sort: keep it in session

## Problem

The records list (and every other list built on the generic `Table` component) loses its
column sort whenever the table remounts from a fresh navigation instead of a browser
back/forward — e.g. opening a record and returning to the list via a link, or navigating
away to another module and back. Sort is currently stored only in the URL query string
(`sortBy` / `sortOrder`, see `getSort`/`updateQuery` in
[tableLink.js](../../../webapp/components/Table/tableLink.js)), which is wiped on any
fresh navigation to the list route without those params.

## Goal

Keep the chosen sort order for a table across navigation within the same browser tab
session (not required to survive a page reload or a new browser session).

## Approach

Reuse the existing per-module "table UI session state" mechanism in
`webapp/store/ui/tables/`, which already persists two other per-table settings the same
way sort should behave:

- `visibleColumnKeysByModule` (visible columns selection)
- `maxRowsByModule` (rows per page)

Add a third entry, `sortByModule`, storing `{ by, order }` per `module`. This is a
generic change to the `Table`/`useTable` engine, not a Records-specific one, so every
`module=`-based `Table` usage in the app (Records, Users, Surveys, Categories, Chains,
Entities, ValidationReport, MessageList, CollectImportReport, User2FADevice list) gets
sort-session-persistence for free — consistent with how visible columns and rows-per-page
already behave for those same tables.

### State (`webapp/store/ui/tables/state.js`)

Add a `sortByModule` key alongside the existing two, with `getSort(module)` /
`assocSort({ module, sort })` accessors mirroring `getMaxRows` / `assocMaxRows`.

### Actions (`webapp/store/ui/tables/actions.js`)

Add `tableSortUpdate` action type and `updateSort({ module, sort })` action creator,
mirroring `updateMaxRows`.

### Reducer (`webapp/store/ui/tables/reducer.js`)

Add a handler for `tableSortUpdate` calling `TablesState.assocSort`. No changes needed to
the reset handlers (`SYSTEM_RESET`, survey create/update/delete already reset the whole
`tables` slice, so `sortByModule` resets along with the other two automatically).

### Hooks (`webapp/store/ui/tables/hooks.js`)

Add `useTableSort(module)` mirroring `useTableMaxRows(module)`.

### `useTable.js`

- Read: `sortInState = useTableSort(module)`; combine with the existing URL-derived
  `sort` as `sortInState ?? sortInLink`, mirroring exactly how `limit` is already computed
  as `limitInState ?? limitInLink`. Redux state wins when present; the URL is the fallback
  for a fresh/shared link with no session state yet.
- Write: in `handleSortBy`, keep the existing `updateQuery(navigate)({ sort: ..., offset:
  null })` call (so the URL still reflects the current sort for copy/paste and browser
  back/forward), and additionally dispatch `TablesActions.updateSort({ module, sort:
  { by: orderByField, order } })`.

No changes to `Records.js`, `Table.js`, `Footer.js`, `SortToggle.js`, or any other
consumer — they all go through `useTable`.

## Data flow

1. User clicks a column header → `handleSortBy(field)` computes the next `{ by, order }`
   exactly as today (asc → desc → none cycle).
2. It updates the URL (unchanged behavior) and dispatches `TablesActions.updateSort`
   (new).
3. The reducer stores `sortByModule[module] = { by, order }`.
4. On any later mount of a `Table` with that `module` (e.g. navigating back to Records
   without the URL query params), `useTable` picks up `sortInState`, so the initial data
   fetch already uses the remembered `sortBy`/`sortOrder`. The address bar is not
   rewritten to reflect the restored sort until the user interacts again — this matches
   existing behavior for the already-persisted `limit`/rows-per-page setting, so it's not
   a new inconsistency.

## Edge cases

- **Explicit sort in a bookmarked/shared URL vs. session state**: session state wins if
  present, same as the existing `limit` precedence (`limitInState ?? limitInLink`). A
  previously-chosen sort for that module in this tab session will override a sort
  specified in a freshly opened link. This is an accepted, pre-existing pattern (same
  quirk already exists for rows-per-page) rather than a new regression.
- **Explicit "no sort" (third click clears sort)**: `handleSortBy` produces
  `{ by: orderByField, order: null }`. This object is still truthy, so it is stored and
  read back as "no active sort" correctly (distinguishing "never sorted this session" —
  `sortInState` is `undefined` — from "explicitly cleared" — `sortInState` is
  `{ by, order: null }`).
- **Session reset**: page reload, `SYSTEM_RESET`, or survey create/update/delete already
  clear the whole `tables` UI slice; `sortByModule` resets along with `visibleColumnKeysByModule`
  and `maxRowsByModule`, matching the agreed "session only" scope (not full persistence).

## Out of scope

- Persisting sort across page reloads or browser sessions (e.g. `localStorage` or a
  backend user preference). Explicitly deferred per user decision — session-only, matching
  how `visibleColumnKeysByModule`/`maxRowsByModule` already behave.
- Any change to which query params exist in the URL, or to `tableLink.js`.
