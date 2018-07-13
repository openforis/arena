import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { surveyStatus } from '../../../../common/survey/survey'

import DataFetchComponent from '../dataFetchComponent'
import { appState, appModules } from '../../../app/app'
import { statePaths } from '../../surveyDashboard'

class DataExplorerComponent extends React.Component {

  render () {
    const {dataExplorer, surveyStatusApp} = this.props
    const {entities} = dataExplorer

    const entityCount = entity => R.path([entity, 'count'])(entities)

    return (
      <DataFetchComponent module={appModules.dataExplorer}>
        <div className="survey-module">

          <div className="flex-center title-of">
            <span className="icon icon-table2 icon-24px icon-left"/>
            <h5>Data Explorer</h5>
          </div>

          {
            surveyStatus.isNew(surveyStatusApp)
              ? (
                <div style={{opacity: .2}}>
                  <span className="icon icon-32px icon-stats-dots"></span>
                  <span className="icon icon-32px icon-pie-chart"></span>
                  <span className="icon icon-32px icon-stats-bars"></span>
                  <span className="icon icon-32px icon-stats-bars2"></span>
                  <span className="icon icon-32px icon-tree"></span>
                  <span className="icon icon-32px icon-database"></span>
                  <span className="icon icon-32px icon-table2"></span>
                </div>
              )
              : (
                <React.Fragment>
                  {
                    R.isEmpty(entities)
                      ? (
                        null
                      )
                      : (
                        <div className="survey-module-item">
                          {
                            R.reduce(
                              (array, entity) => {
                                array.push(
                                  <div key={entity}>{entityCount(entity)} {entity}</div>
                                )
                                return array
                              },
                              [],
                              R.keys(entities)
                            )
                          }
                          <button className="btn btn-of" key={'btn-explore'}>
                            <span className="icon icon-table2 icon-left"></span>
                            Explore
                          </button>

                        </div>
                      )
                  }

                  {/*TODO: add check if published*/}
                  <div className="survey-module-item">
                    <button className="btn btn-of">
                      <span className="icon icon-plus icon-left"/>
                      Record
                    </button>
                  </div>

                </React.Fragment>
              )
          }

        </div>
      </DataFetchComponent>
    )
  }

}

DataExplorerComponent.defaultProps = {
  dataExplorer: {
    surveyId: -1,
    entities: {},
  }
}

const mapStateToProps = state => ({
  surveyId: appState.surveyId(state),
  surveyStatusApp: appState.surveyStatus(state),
  dataExplorer: R.path(statePaths.dataExplorer)(state),
})

export default connect(mapStateToProps)(DataExplorerComponent)