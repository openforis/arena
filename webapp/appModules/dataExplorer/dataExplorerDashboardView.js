import React from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'

import * as R from 'ramda'

import { surveyStatus } from '../../../common/survey/survey'

import DataFetchComponent from '../components/moduleDataFetchComponent'
import { appModuleUri } from '../../app/app'
import { appModules, getDashboardData } from '../appModules'
import { createRecord } from '../../record/actions'
import { getSurveyState, getRecord } from '../../survey/surveyState'

class DataExplorerDashboardView extends React.Component {

  componentDidUpdate (prevProps) {
    const {record: prevRecord} = prevProps
    const {record, history} = this.props

    if (record && (!prevRecord || record.id !== prevRecord.id)) {
      history.push(appModuleUri(appModules.record))
    }
  }

  createRecord() {
    const { createRecord } = this.props
    createRecord()
  }

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
                          <Link to={appModuleUri(appModules.dataExplorer)} className="btn btn-of">
                            <span className="icon icon-table2 icon-left"></span>
                            Explore
                          </Link>

                        </div>
                      )
                  }

                  {/*TODO: add check if published*/}
                  <div className="app-dashboard__module-item">
                    <button className="btn btn-of"
                            onClick={() => this.createRecord()}>
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
  surveyStatusApp: 'draft',
  dataExplorer: getDashboardData(appModules.dataExplorer)(state),
  record: getRecord(getSurveyState(state)),
})

export default withRouter(connect(
  mapStateToProps,
  {
    createRecord,
  }
  )(DataExplorerDashboardView))