import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { surveyStatus } from '../../../../common/survey/survey'

import DataFetchComponent from '../dataFetchComponent'
import { appState } from '../../../app/app'
import { modules, statePaths } from '../../surveyDashboard'

class DataAnalysisComponent extends React.Component {

  render () {
    const {dataAnalysis, surveyStatusApp} = this.props

    return (
      <DataFetchComponent module={modules.dataExplorer}>
        <div className="survey-module">

          <div className="flex-center title-of">
            <span className="icon icon-calculator icon-24px icon-left"/>
            <h5>Data Analysis</h5>
          </div>
          {
            // surveyStatus.isNew(surveyStatusApp)
            //   ? (
                <div style={{opacity: .2}}>
                  <span className="icon icon-32px icon-sigma"></span>
                  <span className="icon icon-32px icon-subscript2"></span>
                  <span className="icon icon-32px icon-subscript"></span>
                  <span className="icon icon-32px icon-superscript"></span>
                  <span className="icon icon-32px icon-superscript2"></span>
                  <span className="icon icon-32px icon-omega"></span>
                </div>
              // )
              // : (
              //   null
              // )
          }
        </div>
      </DataFetchComponent>
    )
  }

}

DataAnalysisComponent.defaultProps = {
  dataAnalysis: {
    samplingDesign: null,
    entities: {count: 0},
    // attributes: {count: 0},
    outputAttributes: {count: 0}
  }
}

const mapStateToProps = state => ({
  surveyId: appState.surveyId(state),
  surveyStatusApp: appState.surveyStatus(state),
  dataAnalysis: R.path(statePaths.dataAnalysis)(state),
})

export default connect(mapStateToProps)(DataAnalysisComponent)