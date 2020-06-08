export const keys = {
  error: 'error',
}

export const stateKey = '_app'

export const getState = (state) => state[stateKey] || {}
