import * as R from 'ramda'

import * as AppState from '../../app/appState'

export const stateKey = 'sideBar'

export const keys = {
    sideBarOpened: 'sideBarOpened',
}

export const isSideBarOpened = R.pipe(AppState.getState, R.propEq(keys.sideBarOpened, true))

export const assocSideBarOpened = sideBarOpened => R.assoc(keys.sideBarOpened, sideBarOpened)
