export const appStateKey = '_app'
export const stateKey = 'error'

export const getSystemError = (state) => (state && state[appStateKey] && state[appStateKey][stateKey]) || null
