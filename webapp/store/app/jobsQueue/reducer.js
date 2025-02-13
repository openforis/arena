import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Actions from './actions'
import * as State from './state'

const actionHandlers = {
  [Actions.JOB_UPDATE]: (state, { jobInfo }) => State.updateJob({ jobInfo })(state),
  [Actions.JOBS_QUEUE_UPDATE]: (state, { jobsQueue }) => State.updateJobsQueue({ jobsQueue })(state),
}

export default exportReducer(actionHandlers)
