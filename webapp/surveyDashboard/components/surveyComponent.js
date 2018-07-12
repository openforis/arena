import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import DataFetchComponent from './dataFetchComponent'

import { appState } from '../../app/app'
import { dataComponentType, statePaths } from '../surveyDashboard'

class SurveyComponent extends React.Component {

  render () {
    const {survey} = this.props

    return (
      <DataFetchComponent type={dataComponentType.survey}>
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
      </DataFetchComponent>
    )
  }
}

SurveyComponent.defaultProps = {
  survey: {
    name: ''
  }
}

const mapStateToProps = state => ({
  surveyId: appState.surveyId(state),
  survey: R.path(statePaths.survey)(state)
})

export default connect(mapStateToProps)(SurveyComponent)