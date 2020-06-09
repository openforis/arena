import * as R from 'ramda'

export const stateKey = 'login'

const keys = {
  email: 'email',
  error: 'error',
}

const getStateProp = (key, defaultValue = null) => R.pathOr(defaultValue, [stateKey, key])

export const getError = getStateProp(keys.error)
export const assocError = R.assoc(keys.error)

export const getEmail = getStateProp(keys.email, '')
export const assocEmail = (email) => R.pipe(R.assoc(keys.email, email), assocError(null))
