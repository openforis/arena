import * as R from 'ramda'

export const stateKey = 'userView'

export const keys = {
  user: 'user',
  profilePicture: 'profilePicture',
}

export const getState = R.propOr({}, stateKey)

// ===== READ
const _getStateProp = (prop, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, prop))
export const getUser = _getStateProp(keys.user, {})
export const getProfilePicture = _getStateProp(keys.profilePicture)
export const isProfilePictureUpdated = R.pipe(getProfilePicture, R.isNil, R.not)

// ===== UPDATE
export const assocUser = user => state => R.assoc(keys.user, user)(state)
export const assocProfilePicture = file => state => R.pipe(R.assoc(keys.profilePicture, file))(state)
