import { exportReducer } from '../../utils/reduxUtils'

import {
  appSideBarOpenedUpdate,
} from './actions'

import * as AppState from './appState'

const actionHandlers = {
  [appSideBarOpenedUpdate]: (state, { sideBarOpened }) => AppState.assocSideBarOpened(sideBarOpened)(state),
}

export default exportReducer(actionHandlers)
