import React from 'react'
import { connect } from 'react-redux'

import { getSurvey } from '../../survey/surveyState'

import {
  getSurveyName,
  getSurveyStatus,
  isSurveyDraft,
} from '../../../common/survey/survey'

class SurveyInfoView extends React.Component {

  render () {
    const {survey} = this.props

    return (
      <div className="app-dashboard__survey-info">

        <div className="survey-status">
          {
            isSurveyDraft(survey) &&
            <span className="icon icon-warning icon-12px icon-left"/>
          }

          {getSurveyStatus(survey)}
        </div>

        <h4 className="survey-name">

          {getSurveyName(survey)}
        </h4>

        <div className="button-bar">
          <button className="btn btn-of-light" aria-disabled={!isSurveyDraft(survey)}>
            <span className="icon icon-checkmark2 icon-16px icon-left"/> Publish
          </button>

          <button className="btn btn-of-light">
            <span className="icon icon-download3 icon-16px icon-left"/> Export
          </button>

          <button className="btn btn-of-light">
            <span className="icon icon-upload3 icon-16px icon-left"/> Import
          </button>

          <button className="btn btn-of-light">
            <span className="icon icon-bin icon-16px icon-left"/> Delete
          </button>
        </div>

      </div>
    )
  }
}

SurveyInfoView.defaultProps = {
  survey: {}
}

const mapStateToProps = state => ({
  survey: getSurvey(state)
})

export default connect(mapStateToProps)(SurveyInfoView)