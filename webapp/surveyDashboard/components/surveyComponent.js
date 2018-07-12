import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import DataFetchComponent from './dataFetchComponent'

import { appState } from '../../app/app'
import { modules, statePaths } from '../surveyDashboard'

import Dropdown from '../../commonComponents/dropdown'

class SurveyComponent extends React.Component {

  render () {
    const {survey} = this.props

    return (
      <DataFetchComponent module={modules.survey}>
        <div className="survey-info">

          <Dropdown className="dropdown-of"
                    placeholder="Survey name"
                    value={survey.name}
                    selection={['survey 1', 'survey 2', 'survey 3', 'survey 4']}
          />

          <div className="survey-info__actions">

            <button className="btn btn-of-light">
              <span className="icon icon-warning icon-24px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-download3 icon-24px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-upload3 icon-24px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-plus icon-20px icon-left"/>
              Survey
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