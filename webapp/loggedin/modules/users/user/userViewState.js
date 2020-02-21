import * as R from 'ramda'

import * as User from '@core/user/user'

export const stateKey = 'userView'

export const keys = {
  user: 'user',
  profilePicture: 'profilePicture',
}

export const getState = R.propOr({}, stateKey)

// ===== READ
const _getStateProp = prop => R.pipe(getState, R.propOr({}, prop))
export const getUser = _getStateProp(keys.user)
export const getProfilePicture = _getStateProp(keys.profilePicture)

// ===== UPDATE
export const assocUser = user => state => R.assoc(keys.user, user)(state)
export const assocProfilePicture = file => state => R.assoc(keys.profilePicture, file)(state)
