import { exportReducer } from '../../utils/reduxUtils'

import {
  appSideBarOpenedUpdate,
} from './actions'

import * as SideBarState from './appSidebarState'

const actionHandlers = {
  [appSideBarOpenedUpdate]: (state, { sideBarOpened }) => SideBarState.assocSideBarOpened(sideBarOpened)(state),
}

export default exportReducer(actionHandlers)
