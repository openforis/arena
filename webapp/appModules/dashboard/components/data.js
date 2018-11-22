import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import * as R from 'ramda'

import { appModuleUri } from '../../appModules'
import { appModules } from '../../appModules'
import { getStateSurveyInfo } from '../../../survey/surveyState'

import Survey from '../../../../common/survey/survey'
import { dataModules } from '../../data/dataModules'

class Data extends React.Component {

  render () {
    const {surveyInfo, dataExplorer: {entities}} = this.props

    const entityCount = entity => R.path([entity, 'count'])(entities)

    return (
      <div className="app-dashboard__module">

        <div className="flex-center title-of">
          <span className="icon icon-table2 icon-24px icon-left"/>
          <h5>Data Explorer</h5>
        </div>

        <div style={{opacity: .2}}>
          <span className="icon icon-32px icon-stats-dots"></span>
          <span className="icon icon-32px icon-pie-chart"></span>
          <span className="icon icon-32px icon-stats-bars"></span>
          <span className="icon icon-32px icon-stats-bars2"></span>
          <span className="icon icon-32px icon-tree"></span>
          <span className="icon icon-32px icon-database"></span>
          <span className="icon icon-32px icon-table2"></span>
        </div>

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
                  <Link to={appModuleUri(appModules.data)} className="btn btn-of">
                    <span className="icon icon-table2 icon-left"></span>
                    Explore
                  </Link>

                </div>
              )
          }

          {
            Survey.isPublished(surveyInfo) ?
              <div className="app-dashboard__module-item">
                <Link className="btn btn-of"
                      to={appModuleUri(dataModules.record)}>
                  <span className="icon icon-plus icon-left"/>
                  Record
                </Link>
              </div>
              : null
          }

        </React.Fragment>


      </div>
    )
  }

}

Data.defaultProps = {
  survey: {},
  dataExplorer: {
    surveyId: -1,
    entities: {},
  }
}

const mapStateToProps = state => ({
  surveyInfo: getStateSurveyInfo(state),
})

export default connect(mapStateToProps)(Data)