import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { appState } from '../../../app/app'
import { statePaths } from '../../surveyDashboard'
import { getSurvey } from './actions'

class SurveyComponent extends React.Component {

  componentDidMount () {
    const {getSurvey, surveyId = 1} = this.props
    getSurvey(surveyId)
  }

  render () {
    const {survey} = this.props

    return (
      <div className="survey-info">

        <input className="text-center"
               placeholder="Survey name"
               value={survey.name}/>

        <div className="survey-info__actions">
          <div className="survey-info__status text-center">
            <span className="icon icon-warning icon-24px"/>
          </div>
          <button className="btn btn-of-light">
            <span className="icon icon-download3 icon-24px"></span>
          </button>

          <button className="btn btn-of-light">
            <span className="icon icon-upload3 icon-24px"></span>
          </button>
        </div>
      </div>
    )
  }
}

SurveyComponent.defaultProps = {
  surveyId: 1,
  survey: {
    name: ''
  }
}

const mapStateToProps = state => ({
  surveyId: appState.surveyId(state),
  survey: R.path(statePaths.survey)(state)
})

export default connect(mapStateToProps, {getSurvey})(SurveyComponent)