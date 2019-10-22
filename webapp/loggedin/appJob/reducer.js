import { exportReducer } from '../../utils/reduxUtils'

import {
  appJobActiveUpdate,
  appJobStart,
} from './actions'


import * as AppState from '../../app/appState'

const actionHandlers = {
  [appJobStart]: (state, { job, onComplete, autoHide }) => AppState.startJob(job, onComplete, autoHide)(state),

  [appJobActiveUpdate]: (state, { job }) => AppState.updateActiveJob(job)(state),
}

export default exportReducer(actionHandlers)
