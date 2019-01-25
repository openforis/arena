import './dataView.scss'

import React from 'react'
import { connect } from 'react-redux'

import TabBar from '../../commonComponents/tabBar'

import RecordsView from './records/components/recordsView'
import RecordView from './records/components/recordView'
import DataVisView from './dataVis/dataVisView'

import { appModules, appModuleUri } from '../appModules'
import { dataModules } from './dataModules'

import { initSurveyDefs } from '../../survey/actions'
import { Redirect } from 'react-router-dom'

class DataView extends React.Component {
  componentDidMount () {
    const { initSurveyDefs } = this.props
    initSurveyDefs()
  }

  render () {
    const { history, location } = this.props

    return location.pathname === appModuleUri(appModules.data)
      ? (
        <Redirect to={appModuleUri(dataModules.records)}/>
      )
      : (
        <React.Fragment>
          <TabBar
            className="data"
            location={location}
            history={history}
            tabs={[

              // records list
              {
                label: 'Records',
                component: RecordsView,
                path: appModuleUri(dataModules.records),
              },

              //edit record
              {
                label: 'Record',
                component: RecordView,
                path: appModuleUri(dataModules.record) + ':recordUuid/',
                showTab: false,
              },

              // data visualization
              {
                label: 'Data vis',
                component: DataVisView,
                path: appModuleUri(dataModules.dataVis),
              },

            ]}
          />

        </React.Fragment>
      )
  }

}

export default connect(null, { initSurveyDefs })(DataView)
