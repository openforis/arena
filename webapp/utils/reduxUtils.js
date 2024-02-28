import { cancelDebounce, debounce } from '@core/functionsDefer'

const applyReducerFunction = (actionHandlers, action, state = {}) => {
  const actionHandler = actionHandlers[action.type]

  return actionHandler ? actionHandler(state, action) : state
}

export const exportReducer =
  (actionHandlers, intialState) =>
  (state = intialState, action) =>
    applyReducerFunction(actionHandlers, action, state)

export const assocActionProps = (state, { type: _type, ...props }) => ({
  ...state,
  ...props,
})

export const debounceAction = (action, key, time = 500) => debounce((dispatch) => dispatch(action), key, time)

export const cancelDebouncedAction = (key) => cancelDebounce(key)
