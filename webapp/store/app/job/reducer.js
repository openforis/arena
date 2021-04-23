import { exportReducer } from '@webapp/utils/reduxUtils'

import * as JobActions from './actions'

import * as JobState from './state'

const actionHandlers = {
  [JobActions.JOB_START]: (state, { job, onComplete, autoHide, closeButton }) =>
    JobState.startJob({ job, onComplete, autoHide, closeButton }),

  [JobActions.JOB_UPDATE]: (state, { job }) => JobState.updateJob({ job })(state),
}

export default exportReducer(actionHandlers)
