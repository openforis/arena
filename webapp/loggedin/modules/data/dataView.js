import './dataView.scss'

import React from 'react'

import NavigationTabBar from '../components/moduleNavigationTabBar'
import SurveyDefsLoader from '../components/surveyDefsLoader'
import RecordsView from './records/components/recordsView'
import RecordView from './records/components/recordView'
import DataVisView from './dataVis/dataVisView'

import { appModules, appModuleUri } from '../../appModules'
import { dataModules } from './dataModules'

class DataView extends React.Component {

  render () {

    return (
      <SurveyDefsLoader
        draft={false}
        validate={false}>

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
      </SurveyDefsLoader>
    )
  }

}

export default DataView
