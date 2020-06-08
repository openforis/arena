export const keys = {
  error: 'error',
}

export const stateKey = 'app'

export const getState = (state) => state[stateKey] || {}
