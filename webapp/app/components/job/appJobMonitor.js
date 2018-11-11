import './appJobMonitor.scss'

import React from 'react'
import { connect } from 'react-redux'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../commonComponents/modal'

import AppJobErrors from './appJobErrors'

import {
  getJobName,
  getJobStatus,
  getJobProgressPercent,
  getJobInnerJobs,
  isJobRunning,
  isJobEnded,
  isJobFailed,
  jobStatus,
} from '../../../../common/job/job'

import { cancelActiveJob, hideAppJobMonitor } from '../job/actions'
import { getActiveJob } from './appJobState'

const ProgressBar = ({progress, className}) => (
  <div className={`progress-bar ${className ? className : ''}`}>
    <div className="filler" style={{width: `${progress}%`}}/>
  </div>
)

const JobStatus = ({job}) => {
  const jobProgressPercent = job ? getJobProgressPercent(job) : 0
  return <div className="app-job-monitor">
    <h4 className="app-job-monitor__status">{getJobStatus(job)}
      {
        isJobRunning(job) && jobProgressPercent < 100 &&
        <span> ({jobProgressPercent}%)</span>
      }
    </h4>
    <ProgressBar progress={jobProgressPercent} className={isJobFailed(job) ? 'error' : ''}/>

    <AppJobErrors job={job}/>
  </div>
}

const InnerJobStatus = ({innerJob}) =>
  <div className={`inner-job${isJobFailed(innerJob) ? ' failed' : ''}`}>
    <div className="header">{getJobName(innerJob)}</div>
    <JobStatus job={innerJob}/>
  </div>

const InnerJobs = ({innerJobs}) =>
  <div className="app-job-monitor_inner-jobs">
    <div className="header">Inner Jobs</div>
    <div className="inner-jobs-wrapper">
      {
        innerJobs.map(innerJob => (
          <InnerJobStatus key={innerJob.uuid}
                          innerJob={innerJob}/>
        ))
      }
    </div>
  </div>

class AppJobMonitor extends React.Component {

  render () {
    const {job, cancelActiveJob, hideAppJobMonitor} = this.props
    const innerJobs = getJobInnerJobs(job)
    return job && job.status !== jobStatus.canceled
      ? (
        <Modal isOpen="true">

          <ModalHeader>
            <div className="app-job-monitor__header">Job: {getJobName(job)}</div>
          </ModalHeader>

          <ModalBody>
            <JobStatus job={job}/>
            {
              innerJobs.length > 0 &&
              <InnerJobs innerJobs={innerJobs}/>
            }

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