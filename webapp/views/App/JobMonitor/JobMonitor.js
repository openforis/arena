import './JobMonitor.scss'

import React from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'
import { useJob, JobActions } from '@webapp/store/app'

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@webapp/components/modal'

import InnerJobs from './InnerJobs'
import JobErrors from './JobErrors'
import JobProgress from './JobProgress'

const JobMonitor = () => {
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
          <JobErrors job={job} />

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

export default JobMonitor
