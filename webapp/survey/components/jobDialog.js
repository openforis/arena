import './jobDialog.scss'

import React from 'react'
import { connect } from 'react-redux'

import {
  getJobName,
  getJobStatus,
  getJobProgressPercent,
  isJobRunning,
  isJobEnded,
} from '../../../common/job/job'

import { cancelSurveyActiveJob, closeSurveyActiveJobDialog } from '../job/actions'
import { getSurvey } from '../surveyState'
import { getSurveyActiveJob } from '../job/surveyJobState'

const ProgressBar = ({progress}) => (
  <div className="progress-bar">
    <div className="filler" style={{width: `${progress}%`}}/>
  </div>
)

class JobDialog extends React.Component {

  render () {
    const {surveyActiveJob, cancelSurveyActiveJob, closeSurveyActiveJobDialog} = this.props

    return (
      <div className="job-dialog">
        <h2>Running job: {getJobName(surveyActiveJob)}</h2>
        <h3>Status: {getJobStatus(surveyActiveJob)}</h3>
        <ProgressBar progress={getJobProgressPercent(surveyActiveJob)}/>
        {isJobRunning(surveyActiveJob) &&
        <button className="btn btn-of"
                onClick={() => cancelSurveyActiveJob()}>
          Cancel
        </button>
        }
        {isJobEnded(surveyActiveJob) &&
        <button className="btn btn-of"
                onClick={() => closeSurveyActiveJobDialog()}>
          Close
        </button>
        }
      </div>
    )
  }
}

const mapStateToProps = state => {
  const survey = getSurvey(state)
  return {
    survey,
    surveyActiveJob: getSurveyActiveJob(survey),
  }
}

export default connect(mapStateToProps, {cancelSurveyActiveJob, closeSurveyActiveJobDialog})(JobDialog)