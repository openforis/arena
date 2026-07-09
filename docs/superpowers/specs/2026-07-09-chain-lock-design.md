# Chain Lock Feature — Design

Date: 2026-07-09
Branch: `feat/chain-lock`

## Purpose

Add a lock/unlock toggle to the Chain editor (Analysis module), mirroring the
existing lock/unlock button in the record editor (`SurveyForm`). The goal is
to let a user protect themselves against accidental edits while viewing a
chain — **not** to implement cross-user concurrency control.

## Background: how the record lock actually works

`webapp/components/survey/SurveyForm/components/formEntryActions.js` renders
a lock/unlock icon button that dispatches `RecordActions.toggleEditLock`,
which flips a purely client-side, in-memory Redux boolean
(`recordEditLocked` in `webapp/store/ui/record/state.js`). It has no server
involvement and no cross-user awareness. It's consumed in
`webapp/components/survey/Record/store/useLocalState.js:53`:

```js
const editable = useAuthCanEditRecord(record) && editableProp && !recordEditLocked
```

Arena's actual multi-user concurrency handling for records (check-in/check-out
+ in-memory socket map + websocket broadcast, see
`server/modules/record/service/update/recordSocketsMap.js`) is a separate,
unrelated mechanism and is out of scope here.

The chain domain currently has no locking concept of any kind — this is a
new feature built from scratch, modeled on the record's personal read-only
toggle.

## Scope

The lock affects the entire chain editing surface:

- `ChainDetails` tabs: `ChainBasicProps`, `ChainSamplingDesignProps` (and its
  selector sub-components), `ChainRStudioFieldset`
- `AnalysisNodeDefs` tree: add-entity buttons in `AnalysisNodeDefsHeader`,
  and per-row drag handle / active toggle in `AnalysisNodeDef`
- `ButtonBar`'s Delete button
- The node-def formula editor (`NodeDefDetails`, reached by clicking "Edit"
  on an analysis node def row)

Left always-enabled (non-mutating/view actions):

- `ButtonBar`'s Download button
- The "show sampling attributes" checkbox in `AnalysisNodeDefsHeader` (local
  UI state, not chain data)
- Navigation itself (the per-row "Edit" link stays clickable; the formula
  editor it opens renders read-only instead of being unreachable)

## State: Redux (`webapp/store/ui/chain/`)

Follows the existing plain-object style of this slice (not the
`A.pipe`/`A.assoc` style used by `webapp/store/ui/record/state.js`).

- `state.js`: add `isChainEditLocked(state)` reading
  `getChainState(state).chainEditLocked`.
- `reducer.js`: add `chainEditLocked: false` to `initialState`; add a handler
  for a new `ChainActionTypes.chainEditLock` action:
  `(state, { locked }) => ({ ...state, chainEditLocked: locked })`.
  The existing `reset` handler (already wired to `chainReset`,
  `SYSTEM_RESET`, and survey create/update/delete) naturally resets
  `chainEditLocked` to `false` too — no extra wiring needed. `chainUpdate`
  does not touch `chainEditLocked`, so the lock persists across the
  debounced chain-edit saves that happen while unlocked.
- `actions/actionTypes.js`: add `chainEditLock: 'ui/chain/edit-lock'`.
- `actions/editLock.js` (new file): a thunk `toggleEditLock`, mirroring
  `webapp/store/ui/record/actions/editLock.js`:
  ```js
  export const toggleEditLock = (dispatch, getState) => {
    const state = getState()
    const lockedPrev = ChainState.isChainEditLocked(state)
    dispatch({ type: ChainActionTypes.chainEditLock, locked: !lockedPrev })
  }
  ```
- `actions/index.js`: export `toggleEditLock` as part of `ChainActions`.
- `hooks.js`: add `useChainEditLocked = () => useSelector((state) => ChainState.isChainEditLocked(state))`.
- `index.js`: export the new hook.

### Derived editable hook

Add `useChainEditable()` (in `webapp/store/ui/chain/hooks.js`, exported from
`index.js`):

```js
export const useChainEditable = () => useAuthCanUseAnalysis() && !useChainEditLocked()
```

(`useAuthCanUseAnalysis` already exists in `webapp/store/user/hooks.js:64`
and is the chain-editing permission check, analogous to
`useAuthCanEditRecord`.)

**Design choice:** rather than prop-drilling an `editable` flag top-down
through every wrapper component (the literal pattern `SurveyForm` uses),
each leaf form component calls `useChainEditable()` directly and disables
its own inputs. This matches how these components already source chain data
via their own `useChain()` calls rather than receiving it as props — prop
injection would fight the existing style of this part of the codebase. The
net effect for the user is identical: every input independently respects
the lock.

## UI

### Lock button

Add to `webapp/views/App/views/Analysis/Chain/ButtonBar/ButtonBar.js`, next
to the existing Delete/Download buttons:

```jsx
{useAuthCanUseAnalysis() && (
  <Button
    iconClassName={chainEditLocked ? 'icon-lock' : 'icon-unlocked'}
    label={`chainView.${chainEditLocked ? 'unlock' : 'lock'}`}
    onClick={() => dispatch(ChainActions.toggleEditLock)}
    variant="text"
  />
)}
```

### i18n

Add `chainView.lock: 'Lock'` and `chainView.unlock: 'Unlock'` to
`core/i18n/resources/en/common.js` (and the other locale files:
fr, es, pt, ru, mn), reusing the existing English wording from
`recordView.lock` / `recordView.unlock`.

### Disabling individual components

Every affected component described in Scope above adds
`disabled={!editable}` (or the equivalent prop for its input type —
`Checkbox`, `Input`, `Dropdown`, drag handle, `InputSwitch`, button) sourced
from `useChainEditable()`. Exact prop wiring per component is left to the
implementation plan.

### Node-def formula editor (`NodeDefDetails`)

`NodeDefDetails` (`webapp/components/survey/NodeDefDetails/`) is shared with
the Survey Designer and is left untouched internally — no readOnly concept
is added to it. Instead, the Analysis-module route that renders it
(`webapp/views/App/views/Analysis/Analysis.js`, the
`analysisModules.nodeDef.path` route) wraps its rendered output in a
disabling container when `useChainEditable()` is `false`: pointer events
blocked and visually dimmed, consistent with the rest of the locked chain
editor. This keeps the change scoped to the Analysis module and leaves
Designer usage of `NodeDefDetails` unaffected.

Because chain Redux state is not reset when navigating from `ChainDetails`
to the node-def editor (see `ChainDetails.js`'s unmount effect, which only
resets on paths other than the node-def route), `chainEditLocked` persists
correctly across that navigation — no extra state plumbing needed.

## Scope discovery: statistical analysis UI is dead code

`StatisticalAnalysis/ChainStatisticalAnalysisProps.js` (and its only
consumers, `StatisticalAnalysis/DimensionsSelector` and `PValueSelector`)
are not rendered anywhere in the current app — `ChainDetails.js`'s tab bar
only wires up `ChainBasicProps` and `ChainSamplingDesignProps` (see commit
"Chain details: hide statistical analysis tab"). These files are excluded
from this feature's scope; there is no reachable UI to make read-only.

## Non-goals

- No server-side changes.
- No websocket events or cross-user awareness.
- No persistence of lock state across page reloads or navigation to a
  different chain — same ephemeral behavior as the record lock.
