import './dataView.scss'

import React from 'react'
import { connect } from 'react-redux'

import NavigationTabBar from '../components/moduleNavigationTabBar'
import RecordsView from './records/components/recordsView'
import RecordView from './records/components/recordView'
import DataVisView from './dataVis/dataVisView'

import { appModules, appModuleUri } from '../appModules'
import { dataModules } from './dataModules'

import { initSurveyDefs } from '../../survey/actions'

class DataView extends React.Component {

  componentDidMount () {
    const { initSurveyDefs } = this.props
    initSurveyDefs()
  }

  render () {

    return (
      <NavigationTabBar
        className="data app-module__tab-navigation"
        moduleRoot={appModules.data}
        moduleDefault={dataModules.records}
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
    )
  }

}

export default connect(null, { initSurveyDefs })(DataView)
