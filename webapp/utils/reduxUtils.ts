import { cancelDebounce, debounce } from '@core/functionsDefer'

type ActionHandler = (state: any, action: any) => any

const applyReducerFunction = (actionHandlers: Record<string, ActionHandler>, action, state = {}) => {
  const actionHandler = actionHandlers[action.type]

  return actionHandler ? actionHandler(state, action) : state
}

export const exportReducer =
  (actionHandlers: Record<string, ActionHandler>, intialState?: unknown) =>
  (state = intialState, action) =>
    applyReducerFunction(actionHandlers, action, state)

export const assocActionProps = (state, { type: _type, ...props }) => ({
  ...state,
  ...props,
})

export const debounceAction = (action, key, time = 500) =>
  debounce((dispatch: (action: unknown) => unknown) => dispatch(action), key, time)

export const cancelDebouncedAction = (key) => cancelDebounce(key)
