import * as R from 'ramda'

export const applyReducerFunction = (actionHandlers, state, action) => {

  const actionHandler = actionHandlers[action.type]

  return actionHandler
    ? actionHandler(state, action)
    : state
}

export const exportReducer = actionHandlers =>
  (state = {}, action) => applyReducerFunction(actionHandlers, state, action)

export const assocActionParams = (state, {type, ...actionParams}) => ({...state, ...actionParams})

export const dissocStateParams = (state, props) => R.reduce(
  (s, prop) => R.dissoc(prop, s),
  state,
  R.insertAll(0, props, [])
)