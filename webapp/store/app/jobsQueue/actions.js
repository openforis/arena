export const JOBS_QUEUE_UPDATE = 'app/jobsQueue/update'
export const JOB_UPDATE = 'app/jobsQueue/jobUpdate'

export const updateJobsQueue =
  ({ jobsQueue }) =>
  (dispatch) =>
    dispatch({ type: JOBS_QUEUE_UPDATE, jobsQueue })

export const updateJob =
  ({ jobInfo }) =>
  (dispatch) =>
    dispatch({ type: JOB_UPDATE, jobInfo })
