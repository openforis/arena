import { exportReducer } from '@webapp/utils/reduxUtils'

import * as JobActions from './actions'

import * as JobState from './state'

const actionHandlers = {
  [JobActions.JOB_START]: (_state, { job, onComplete, autoHide, closeButton, errorKeyHeaderName }) =>
    JobState.startJob({ job, onComplete, autoHide, closeButton, errorKeyHeaderName }),

  [JobActions.JOB_UPDATE]: (state, { job }) => JobState.updateJob({ job })(state),
}

export default exportReducer(actionHandlers)
