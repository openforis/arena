import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { surveyStatus } from '../../../common/survey/survey'

import DataFetchComponent from '../dataFetchComponent'
import { appState } from '../../app/app'
import { appModules, getDashboardData } from '../appModules'

class DataExplorerDashboardView extends React.Component {

  render () {
    const {dataExplorer, surveyStatusApp} = this.props
    const {entities} = dataExplorer

    const entityCount = entity => R.path([entity, 'count'])(entities)

    return (
      <DataFetchComponent module={appModules.dataExplorer} dashboard={true}>
        <div className="app-dashboard__module">

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
                        <div className="app-dashboard__module-item">
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
                  <div className="app-dashboard__module-item">
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

DataExplorerDashboardView.defaultProps = {
  dataExplorer: {
    surveyId: -1,
    entities: {},
  }
}

const mapStateToProps = state => ({
  surveyStatusApp: appState.surveyStatus(state),
  dataExplorer: getDashboardData(appModules.dataExplorer)(state),
})

export default connect(mapStateToProps)(DataExplorerDashboardView)