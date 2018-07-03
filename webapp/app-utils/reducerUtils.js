export const applyReducerFunction = (actionHandlers, state, action) => {

  const actionHandler = actionHandlers[action.type]

  return actionHandler
    ? actionHandler(state, action)
    : state
}

export const exportReducer = actionHandlers =>
  (state = {}, action) => applyReducerFunction(actionHandlers, state, action)