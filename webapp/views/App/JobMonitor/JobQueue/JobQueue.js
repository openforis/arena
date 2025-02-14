import './JobQueue.scss'

import React from 'react'

import { Objects } from '@openforis/arena-core'

import { ButtonCancel } from '@webapp/components'
import { useI18n } from '@webapp/store/system'
import { useDispatch } from 'react-redux'
import { JobActions } from '@webapp/store/app'

const JobQueued = ({ job }) => {
  const { queueStatus, type, user, uuid } = job

  const dispatch = useDispatch()
  const i18n = useI18n()

  return (
    <div className="job">
      <span>{i18n.t(`jobs:${type}`)}</span>
      <span>{user.email}</span>
      <span>{queueStatus}</span>
      <ButtonCancel onClick={() => dispatch(JobActions.cancelJob(uuid))} />
    </div>
  )
}

export const JobQueue = (props) => {
  const { jobs } = props

  if (Objects.isEmpty(jobs)) return null

  return (
    <div className="job-queue">
      {jobs.map((job) => (
        <JobQueued key={job.uuid} job={job} />
      ))}
    </div>
  )
}
