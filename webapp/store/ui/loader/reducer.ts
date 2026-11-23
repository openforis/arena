import { exportReducer } from '@webapp/utils/reduxUtils'

import * as LoaderActions from './actions'
import * as LoaderState from './state'

const actionHandlers = {
  [LoaderActions.LOADER_SHOW]: LoaderState.assocShow,
  [LoaderActions.LOADER_HIDE]: LoaderState.assocHide,
}

export default exportReducer(actionHandlers)
