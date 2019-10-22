import * as R from 'ramda'

export const keys = {
    sideBarOpened: 'sideBarOpened',
}

export const isSideBarOpened = R.pipe(getState, R.propEq(keys.sideBarOpened, true))

export const assocSideBarOpened = sideBarOpened => R.assoc(keys.sideBarOpened, sideBarOpened)
