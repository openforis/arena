import {exportReducer} from '../../utils/reduxUtils'

import {appSideBarOpenedUpdate} from './actions'

import * as SideBarState from './appSidebarState'

const actionHandlers = {
  [appSideBarOpenedUpdate]: (state, {opened}) =>
    SideBarState.assocOpened(opened)(state),
}

export default exportReducer(actionHandlers)
