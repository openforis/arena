import './appJobMonitor.scss'

import React from 'react'
import { connect } from 'react-redux'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../commonComponents/modal'

import {
  getJobName,
  getJobStatus,
  getJobProgressPercent,
  isJobRunning,
  isJobEnded,
  isJobFailed
} from '../../../../common/job/job'

import { cancelActiveJob, hideAppJobMonitor } from '../job/actions'
import { getActiveJob } from './appJobState'

const ProgressBar = ({progress, className}) => (
  <div className={`progress-bar ${className ? className : ''}`}>
    <div className="filler" style={{width: `${progress}%`}}/>
  </div>
)

class AppJobMonitor extends React.Component {

  render () {
    const {job, cancelActiveJob, hideAppJobMonitor} = this.props

    const jobProgressPercent = job ? getJobProgressPercent(job) : 0

    return job
      ? (
        <Modal isOpen="true">

          <ModalHeader>
            <div className="app-job-monitor__header">Job: {getJobName(job)}</div>
          </ModalHeader>

          <ModalBody>
            <div className="app-job-monitor">
              <h4 className="app-job-monitor__status">{getJobStatus(job)}
                {
                  isJobRunning(job) && jobProgressPercent < 100 &&
                  <span> ({jobProgressPercent}%)</span>
                }
              </h4>
              <ProgressBar progress={jobProgressPercent} className={isJobFailed(job) ? 'error' : ''}/>
            </div>
          </ModalBody>

          <ModalFooter>
            <button className="btn btn-of modal-footer__item"
                    onClick={() => cancelActiveJob()}
                    aria-disabled={!isJobRunning(job)}>
              Cancel
            </button>

            <button className="btn btn-of modal-footer__item"
                    onClick={() => hideAppJobMonitor()}
                    aria-disabled={!isJobEnded(job)}>
              Close
            </button>
          </ModalFooter>
        </Modal>
      )
      : null
  }
}

const mapStateToProps = state => ({
  job: getActiveJob(state),
})

export default connect(
  mapStateToProps,
  {cancelActiveJob, hideAppJobMonitor,}
)(AppJobMonitor)