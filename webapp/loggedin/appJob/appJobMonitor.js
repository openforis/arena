import './appJobMonitor.scss'

import React from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'
import { useJob, JobActions } from '@webapp/store/app'

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@webapp/components/modal'
import ProgressBar from '@webapp/components/progressBar'
import AppJobErrors from './appJobErrors'

const JobProgress = ({ job }) => (
  <ProgressBar progress={JobSerialized.getProgressPercent(job)} className={JobSerialized.getStatus(job)} />
)

const InnerJobs = ({ innerJobs }) => {
  const i18n = useI18n()

  return (
    innerJobs.length > 0 && (
      <div className="app-job-monitor__inner-jobs">
        {innerJobs.map((innerJob, i) => (
          <React.Fragment key={i}>
            <div className="job">
              <div className="name">
                {i + 1}. {i18n.t(`jobs.${JobSerialized.getType(innerJob)}`)}
              </div>
              <JobProgress job={innerJob} />
            </div>
            <AppJobErrors job={innerJob} />
          </React.Fragment>
        ))}
      </div>
    )
  )
}

const AppJobMonitor = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const job = useJob()

  return (
    job &&
    !JobSerialized.isCanceled(job) && (
      <Modal className="app-job-monitor" closeOnEsc={false}>
        <ModalHeader>{i18n.t(`jobs.${JobSerialized.getType(job)}`)}</ModalHeader>

        <ModalBody>
          <JobProgress job={job} />
          <AppJobErrors job={job} />

          <InnerJobs innerJobs={JobSerialized.getInnerJobs(job)} />
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            className="btn modal-footer__item"
            onClick={() => dispatch(JobActions.cancelJob())}
            aria-disabled={!JobSerialized.isRunning(job)}
          >
            {i18n.t('common.cancel')}
          </button>

          <button
            type="button"
            className="btn modal-footer__item"
            onClick={() => dispatch(JobActions.hideJobMonitor())}
            aria-disabled={!JobSerialized.isEnded(job)}
          >
            {i18n.t('common.close')}
          </button>
        </ModalFooter>
      </Modal>
    )
  )
}

export default AppJobMonitor
