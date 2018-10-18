import './appJobMonitor.scss'

import React from 'react'
import { connect } from 'react-redux'

import {
  getJobName,
  getJobStatus,
  getJobProgressPercent,
  isJobRunning,
  isJobEnded,
} from '../../../../common/job/job'

import { cancelActiveJob, hideAppJobMonitor } from '../job/actions'
import { getActiveJob } from './appJobState'

const ProgressBar = ({progress}) => (
  <div className="progress-bar">
    <div className="filler" style={{width: `${progress}%`}}/>
  </div>
)

class AppJobMonitor extends React.Component {

  render () {
    const {activeJob, cancelActiveJob, hideAppJobMonitor} = this.props

    return activeJob
      ? (
        <div className="app-job-monitor">
          <h2>Running job: {getJobName(activeJob)}</h2>
          <h3>Status: {getJobStatus(activeJob)}</h3>
          <ProgressBar progress={getJobProgressPercent(activeJob)}/>


          <button className="btn btn-of"
                  onClick={() => cancelActiveJob()}
                  aria-disabled={!isJobRunning(activeJob)}>
            Cancel
          </button>

          <button className="btn btn-of"
                  onClick={() => hideAppJobMonitor()}
                  aria-disabled={!isJobEnded(activeJob)}>
            Close
          </button>
        </div>
      )
      : null
  }
}

const mapStateToProps = state => ({
  activeJob: getActiveJob(state),
})

export default connect(
  mapStateToProps,
  {cancelActiveJob, hideAppJobMonitor,}
)(AppJobMonitor)