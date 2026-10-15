/**
 * useReducer plus a getter of the latest state, which an async handler reads after an await: the state of its own
 * render is stale by then. The state behind the getter is updated at dispatch, not at render.
 */
import { useCallback, useReducer, useRef } from 'react'

/**
 * Returns the state, the dispatch and the ref to the latest state.
 * @param {Function} reducer - Pure reducer.
 * @param {Function} init - Returns the first state.
 * @returns {Array} [state, dispatch, getLatest]: `getLatest()` already returns the state after every dispatched action.
 */
export const useLatestReducer = <S, A>(
  reducer: (state: S, action: A) => S,
  init: () => S
): readonly [S, (action: A) => void, () => S] => {
  const [state, dispatchToReact] = useReducer(reducer, undefined, init)
  const latest = useRef(state)
  const dispatch = useCallback(
    (action: A) => {
      latest.current = reducer(latest.current, action)
      dispatchToReact(action)
    },
    [reducer]
  )
  const getLatest = useCallback(() => latest.current, [])
  return [state, dispatch, getLatest] as const
}
