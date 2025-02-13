import * as R from 'ramda'

import * as AppState from '../state'

export const stateKey = 'jobsQueue'

const initialState = {}
const getState = R.pipe(AppState.getState, R.propOr(initialState, stateKey))

// ====== READ
export const getJobsQueue = getState

export const updateJobsQueue =
  ({ jobsQueue }) =>
  (state) =>
    jobsQueue ? { ...state, ...jobsQueue } : initialState

export const updateJob =
  ({ jobInfo }) =>
  (state) => {
    const prevJobsQueue = state.jobsQueue ?? []
    const nextJobsQueue = [...prevJobsQueue]
    const oldIndex = prevJobsQueue.findIndex((job) => job.uuid === jobInfo.uuid)
    if (oldIndex >= 0) {
      nextJobsQueue[oldIndex] = jobInfo
    } else {
      nextJobsQueue.unshift(jobInfo)
    }
    return nextJobsQueue
  }
