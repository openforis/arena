const applyReducerFunction = (actionHandlers, nullableState, action) => {
  const actionHandler = actionHandlers[action.type]
  const state = nullableState || {}

  return actionHandler ? actionHandler(state, action) : state
}

export const exportReducer = actionHandlers => (state, action) =>
  applyReducerFunction(actionHandlers, state, action)

export const assocActionProps = (state, { type: _type, ...props }) => ({
  ...state,
  ...props,
})

export const debounceAction = (action, key, time = 500) => {
  action.meta = {
    debounce: {
      time,
      key,
    },
  }
  return action
}

export const cancelDebouncedAction = key => ({
  type: `${key}/cancel`,
  meta: {
    debounce: {
      cancel: true,
      key,
    },
  },
})
