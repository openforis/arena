import './appJobMonitor.scss'

import React from 'react'
import { connect } from 'react-redux'

import {
  Modal,
  ModalBody,
  ModalFooter,
} from '../../../../commonComponents/modal'

import AppJobErrors from './appJobErrors'

import { cancelActiveJob, hideAppJobMonitor } from './actions'
import { getActiveJob } from './appJobState'

const ProgressBar = ({progress, className = ''}) => (
  <div className={`progress-bar ${className}`}>
    <div className="filler" style={{width: `${progress}%`}}/>
    <span className="progress">({progress}%)</span>
  </div>
)

const JobProgress = ({job}) =>
  <ProgressBar progress={job.progressPercent} className={job.status}/>

const InnerJobs = ({innerJobs}) =>
  innerJobs.length > 0 &&
  <div className="app-job-monitor__inner-jobs">
    {
      innerJobs.map((innerJob, i) => (
        <React.Fragment>
          <div key={i}
               className="job">
            <div className="name">{i + 1}. {innerJob.name}</div>
            <JobProgress job={innerJob}/>
          </div>
          <AppJobErrors job={innerJob}/>
        </React.Fragment>
      ))
    }
  </div>

class AppJobMonitor extends React.Component {

  render () {
    const {job, cancelActiveJob, hideAppJobMonitor} = this.props
    const innerJobs = job ? job.innerJobs : null
    return job && !job.canceled
      ? (
        <Modal className="app-job-monitor" closeOnEsc={false}>

          <ModalBody>
            <div className="app-job-monitor__header">Job: {job.name}</div>
            <JobProgress job={job}/>
            <AppJobErrors job={job}/>

            <InnerJobs innerJobs={innerJobs}/>
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