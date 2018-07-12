import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { surveyStatus } from '../../../../common/survey/survey'

import DataFetchComponent from '../dataFetchComponent'
import { appState } from '../../../app/app'
import { modules, statePaths } from '../../surveyDashboard'

class DataExplorerComponent extends React.Component {

  render () {
    const {dataExplorer, surveyStatusApp} = this.props
    const {entities} = dataExplorer

    const entityCount = entity => R.path([entity, 'count'])(entities)

    return (
      <DataFetchComponent module={modules.dataExplorer}>
        <div className="survey-module">

          <div className="flex-center title-of">
            <span className="icon icon-table2 icon-24px icon-left"/>
            <h5>Data Explorer</h5>
          </div>

          {
            surveyStatus.isNew(surveyStatusApp)
              ? (
                <button className="btn btn-of-light width50">
                  Start designing your forms!
                </button>
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
                            Explore now!
                          </button>

                        </div>
                      )
                  }

                  <button className="btn btn-of">
                    <span className="icon icon-plus icon-left"/>
                    Add a record
                  </button>

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