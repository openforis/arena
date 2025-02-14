import './JobMonitor.scss'

import React from 'react'
import { useDispatch } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as JobSerialized from '@common/job/jobSerialized'

import { useJob, JobActions } from '@webapp/store/app'

import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import InnerJobs from './InnerJobs'
import JobErrors from './JobErrors'
import JobProgress from './JobProgress'
import { useJobsQueue } from '@webapp/store/app/jobsQueue/hooks'

import { JobQueue } from './JobQueue/JobQueue'

const getCustomCloseButtonComponent = ({ closeButton, job }) => {
  if (!closeButton || !JobSerialized.isSucceeded(job)) return null
  if (closeButton instanceof Function) return React.createElement(closeButton, { job })
  if (closeButton instanceof Object) return closeButton
  return null
}

const JobMonitor = () => {
  const dispatch = useDispatch()
  const { job, closeButton, errorKeyHeaderName, errorsExportFileName } = useJob()

  const jobsQueue = useJobsQueue()

  if ((!job || JobSerialized.isCanceled(job)) && Objects.isEmpty(jobsQueue)) return null

  const jobsInQueueToShow = jobsQueue?.filter?.((jobQueue) => jobQueue.uuid !== JobSerialized.getUuid(job)) ?? []

  const innerJobs = JobSerialized.getInnerJobs(job)
  const hasInnerJobs = innerJobs.length > 0
  const jobEnded = JobSerialized.isEnded(job)

  return (
    <Modal className="app-job-monitor" closeOnEsc={false} title={`jobs:${JobSerialized.getType(job)}`}>
      <ModalBody>
        <JobProgress progressPercent={JobSerialized.getProgressPercent(job)} status={JobSerialized.getStatus(job)} />
        <JobErrors
          errorKeyHeaderName={errorKeyHeaderName}
          exportFileName={errorsExportFileName}
          job={job}
          openPanel={jobEnded && !hasInnerJobs}
        />

        {hasInnerJobs && (
          <InnerJobs
            currentJobIndex={JobSerialized.getCurrentInnerJobIndex(job)}
            innerJobs={innerJobs}
            panelStartClosed={!jobEnded}
            openPanel={JobSerialized.isFailed(job)}
          />
        )}

        {Objects.isNotEmpty(jobsInQueueToShow) && <JobQueue jobs={jobsInQueueToShow} />}
      </ModalBody>

      <ModalFooter>
        {JobSerialized.isRunning(job) && (
          <Button
            className="modal-footer__item"
            onClick={() => dispatch(JobActions.cancelJob())}
            label="common.cancel"
          />
        )}
        {JobSerialized.isEnded(job) &&
          (getCustomCloseButtonComponent({ closeButton, job }) ?? (
            <Button
              className="modal-footer__item"
              onClick={() => dispatch(JobActions.hideJobMonitor())}
              disabled={!JobSerialized.isEnded(job)}
              label="common.close"
              primary
            />
          ))}
      </ModalFooter>
    </Modal>
  )
}

export default JobMonitor
