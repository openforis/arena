import './JobMonitor.scss'

import React from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import { useJob, JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'

import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import InnerJobs from './InnerJobs'
import JobErrors from './JobErrors'
import JobLongRunningMessage from './JobLongRunningMessage'
import JobProgress from './JobProgress'
import JobTiming from './JobTiming'

const getCustomCloseButtonComponent = ({ closeButton, closeButtonProps, job }) => {
  if (!closeButton || !JobSerialized.isSucceeded(job)) return null
  if (closeButton instanceof Function) return React.createElement(closeButton, { job, ...closeButtonProps })
  if (closeButton instanceof Object) return closeButton
  return null
}

const JobMonitor = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const { job, closeButton, closeButtonProps, errorKeyHeaderName, errorsExportFileName, longRunningMessageKey } =
    useJob()

  if (!job) return null
  if (JobSerialized.isCanceled(job) && !JobSerialized.isCanceledByAdmin(job)) return null

  const innerJobs = JobSerialized.getInnerJobs(job)
  const hasInnerJobs = innerJobs.length > 0
  const jobEnded = JobSerialized.isEnded(job)

  return (
    <Modal className="app-job-monitor" closeOnEsc={false} title={`jobs:${JobSerialized.getType(job)}`}>
      <ModalBody>
        {JobSerialized.isCanceledByAdmin(job) && (
          <div className="job-monitor__canceled-by-admin-message">{i18n.t('jobMonitorView:jobCanceledByAdmin')}</div>
        )}
        <JobProgress job={job} />
        <JobTiming job={job} />
        <JobLongRunningMessage job={job} messageKey={longRunningMessageKey} />
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
        {(JobSerialized.isPending(job) || JobSerialized.isRunning(job)) && (
          <Button
            className="modal-footer__item"
            onClick={() => dispatch(JobActions.cancelJob())}
            label="common.cancel"
          />
        )}
        {JobSerialized.isEnded(job) &&
          (getCustomCloseButtonComponent({ closeButton, closeButtonProps, job }) ?? (
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
