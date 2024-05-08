import './JobMonitor.scss'

import React from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import { useJob, JobActions } from '@webapp/store/app'

import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import InnerJobs from './InnerJobs'
import JobErrors from './JobErrors'
import JobProgress from './JobProgress'

const getCustomCloseButtonComponent = ({ closeButton, job }) => {
  if (!closeButton || !JobSerialized.isSucceeded(job)) return null
  if (closeButton instanceof Function) return closeButton({ job })
  if (closeButton instanceof Object) return closeButton
  return null
}

const JobMonitor = () => {
  const dispatch = useDispatch()
  const { job, closeButton, errorKeyHeaderName, errorsExportFileName } = useJob()

  if (!job || JobSerialized.isCanceled(job)) return null

  const innerJobs = JobSerialized.getInnerJobs(job)
  const hasInnerJobs = innerJobs.length > 0
  const jobEnded = JobSerialized.isEnded(job)

  return (
    <Modal className="app-job-monitor" closeOnEsc={false} title={`jobs.${JobSerialized.getType(job)}`}>
      <ModalBody>
        <JobProgress job={job} />
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
          (getCustomCloseButtonComponent({ closeButton, job }) || (
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
