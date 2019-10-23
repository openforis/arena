import * as R from 'ramda'

export const stateKey = 'appSideBar'

const getState = R.propOr({}, stateKey)

export const keys = {
  opened: 'opened',
}

export const isOpened = R.pipe(getState, R.propEq(keys.opened, true))

export const assocOpened = R.assoc(keys.opened)
