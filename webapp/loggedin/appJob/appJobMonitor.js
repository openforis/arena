import './appJobMonitor.scss'

import React from 'react'
import {connect} from 'react-redux'

import {useI18n} from '@webapp/commonComponents/hooks'
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@webapp/commonComponents/modal'
import ProgressBar from '@webapp/commonComponents/progressBar'
import AppJobErrors from './appJobErrors'

import * as JobState from './appJobState'

import {cancelActiveJob, hideAppJobMonitor} from './actions'

const JobProgress = ({job}) => (
  <ProgressBar progress={job.progressPercent} className={job.status} />
)

const InnerJobs = ({innerJobs}) => {
  const i18n = useI18n()

  return (
    innerJobs.length > 0 && (
      <div className="app-job-monitor__inner-jobs">
        {innerJobs.map((innerJob, i) => (
          <React.Fragment key={i}>
            <div className="job">
              <div className="name">
                {i + 1}. {i18n.t(`jobs.${innerJob.type}`)}
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

const AppJobMonitor = props => {
  const {job, cancelActiveJob, hideAppJobMonitor} = props
  const innerJobs = job ? job.innerJobs : null

  const i18n = useI18n()

  return (
    job &&
    !job.canceled && (
      <Modal className="app-job-monitor" closeOnEsc={false}>
        <ModalHeader>{i18n.t(`jobs.${job.type}`)}</ModalHeader>

        <ModalBody>
          <JobProgress job={job} />
          <AppJobErrors job={job} />

          <InnerJobs innerJobs={innerJobs} />
        </ModalBody>

        <ModalFooter>
          <button
            className="btn modal-footer__item"
            onClick={() => cancelActiveJob()}
            aria-disabled={!job.running}
          >
            {i18n.t('common.cancel')}
          </button>

          <button
            className="btn modal-footer__item"
            onClick={() => hideAppJobMonitor()}
            aria-disabled={!job.ended}
          >
            {i18n.t('common.close')}
          </button>
        </ModalFooter>
      </Modal>
    )
  )
}

const mapStateToProps = state => ({
  job: JobState.getActiveJob(state),
})

export default connect(mapStateToProps, {cancelActiveJob, hideAppJobMonitor})(
  AppJobMonitor,
)
