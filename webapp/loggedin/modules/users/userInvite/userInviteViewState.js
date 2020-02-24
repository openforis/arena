import * as R from 'ramda'

export const stateKey = 'userInviteView'

export const keys = {
  userInvite: 'userInvite',
}

export const getState = R.propOr({}, stateKey)

// ===== READ
const _getStateProp = prop => R.pipe(getState, R.propOr({}, prop))
export const getUserInvite = _getStateProp(keys.userInvite)

// ===== UPDATE
export const assocUserInvite = userInvite => state => R.assoc(keys.userInvite, userInvite)(state)
