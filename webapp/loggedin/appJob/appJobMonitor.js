import './appJobMonitor.scss'

import React from 'react'
import { connect } from 'react-redux'

import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../commonComponents/modal'
import ProgressBar from '../../commonComponents/progressBar'
import AppJobErrors from './appJobErrors'

import * as AppWebSocket from '../../app/appWebSocket'
import WebSocketEvents from '../../../common/webSocket/webSocketEvents'

import * as AppState from '../../app/appState'

import { activeJobUpdate, cancelActiveJob, hideAppJobMonitor } from './actions'

const JobProgress = ({ job }) =>
  <ProgressBar progress={job.progressPercent} className={job.status}/>

const InnerJobs = ({ innerJobs }) =>
  innerJobs.length > 0 &&
  <div className="app-job-monitor__inner-jobs">
    {
      innerJobs.map((innerJob, i) => (
        <React.Fragment key={i}>
          <div className="job">
            <div className="name">{i + 1}. {innerJob.type}</div>
            <JobProgress job={innerJob}/>
          </div>
          <AppJobErrors job={innerJob}/>
        </React.Fragment>
      ))
    }
  </div>

class AppJobMonitor extends React.Component {

  componentDidMount () {
    AppWebSocket.on(WebSocketEvents.jobUpdate, this.props.activeJobUpdate)
  }

  render () {
    const { job, cancelActiveJob, hideAppJobMonitor } = this.props
    const innerJobs = job ? job.innerJobs : null
    return job && !job.canceled
      ? (
        <Modal className="app-job-monitor" closeOnEsc={false}>

          <ModalHeader>{job.type}</ModalHeader>

          <ModalBody>
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
  job: AppState.getActiveJob(state),
})

export default connect(
  mapStateToProps,
  { activeJobUpdate, cancelActiveJob, hideAppJobMonitor }
)(AppJobMonitor)