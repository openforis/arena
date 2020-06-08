export const appStateKey = '_app'
export const stateKey = 'error'

const isEmpty = (val) => val === undefined || val == null || val.length <= 0 || Object.values(val).length <= 0

export const getSystemError = (state) =>
  state && state[appStateKey] && state[appStateKey][stateKey] && !isEmpty(state[appStateKey][stateKey])
    ? state[appStateKey][stateKey]
    : ''
