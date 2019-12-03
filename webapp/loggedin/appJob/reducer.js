import { exportReducer } from '../../utils/reduxUtils'

import { appJobActiveUpdate, appJobStart } from './actions'

import * as JobState from './appJobState'

const actionHandlers = {
  [appJobStart]: (state, { job, onComplete, autoHide }) =>
    JobState.startJob(job, onComplete, autoHide)(state),

  [appJobActiveUpdate]: (state, { job }) =>
    JobState.updateActiveJob(job)(state),
}

export default exportReducer(actionHandlers)
