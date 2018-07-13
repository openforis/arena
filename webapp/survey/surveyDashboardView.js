import './style.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import DataFetchComponent from '../appModules/dataFetchComponent'

import { appState } from '../app/app'
import { appModules, getDashboardData } from '../appModules/appModules'

import Dropdown from '../commonComponents/dropdown'

class SurveyDashboardView extends React.Component {

  render () {
    const {survey} = this.props

    return (
      <DataFetchComponent module={appModules.survey} dashboard={true}>
        <div className="survey-info">

          <Dropdown className="dropdown-of"
                    placeholder="Survey name"
                    value={survey.name}
                    selection={['survey 1', 'survey 2', 'survey 3', 'survey 4']}
          />

          <div className="survey-info__actions">

            <button className="btn btn-of-light">
              <span className="icon icon-warning icon-20px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-download3 icon-20px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-upload3 icon-20px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-bin icon-20px"/>
            </button>

            <button className="btn btn-of-light">
              <span className="icon icon-plus icon-20px"/>
            </button>

          </div>
        </div>
      </DataFetchComponent>
    )
  }
}

SurveyDashboardView.defaultProps = {
  survey: {
    name: ''
  }
}

const mapStateToProps = state => ({
  surveyId: appState.surveyId(state),
  survey: getDashboardData(appModules.survey)(state)
})

export default connect(mapStateToProps)(SurveyDashboardView)