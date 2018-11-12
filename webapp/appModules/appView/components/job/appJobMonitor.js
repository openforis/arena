import './appJobMonitor.scss'

import React from 'react'
import { connect } from 'react-redux'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../../commonComponents/modal'

import AppJobErrors from './appJobErrors'

import { cancelActiveJob, hideAppJobMonitor } from './actions'
import { getActiveJob } from './appJobState'

const ProgressBar = ({progress, className}) => (
  <div className={`progress-bar ${className ? className : ''}`}>
    <div className="filler" style={{width: `${progress}%`}}/>
  </div>
)

const JobStatus = ({job}) => {
  return <div className="app-job-monitor">
    <h4 className="app-job-monitor__status">{job.status}
      {
        job.running && job.jobProgressPercent < 100 &&
        <span> ({job.progressPercent}%)</span>
      }
    </h4>
    <ProgressBar progress={job.progressPercent} className={job.failed ? 'error' : ''}/>
    <AppJobErrors job={job}/>
  </div>
}

const InnerJobStatus = ({innerJob}) =>
  <div className={`inner-job${innerJob.failed ? ' failed' : ''}`}>
    <div className="header">{innerJob.props.name}</div>
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
    const innerJobs = job ? job.innerJobs : null
    return job && !job.canceled
      ? (
        <Modal isOpen="true">

          <ModalHeader>
            <div className="app-job-monitor__header">Job: {job.props.name}</div>
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
                    aria-disabled={!job.running}>
              Cancel
            </button>

            <button className="btn btn-of modal-footer__item"
                    onClick={() => hideAppJobMonitor()}
                    aria-disabled={!job.ended}>
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