import './dataView.scss'

import React from 'react'

import useI18n from '../../../commonComponents/useI18n'

import NavigationTabBar from '../components/moduleNavigationTabBar'
import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import RecordsView from './records/components/recordsView'
import RecordView from './records/components/recordView'
import DataVisView from './dataVis/dataVisView'

import { appModules, appModuleUri } from '../../appModules'
import { dataModules } from './dataModules'

const DataView = () => {
  const i18n = useI18n()

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
            label: i18n.t('data.records.records'),
            component: RecordsView,
            path: appModuleUri(dataModules.records),
          },

          //edit record
          {
            component: RecordView,
            path: appModuleUri(dataModules.record) + ':recordUuid/',
            showTab: false,
          },

          // data visualization
          {
            label: i18n.t('data.dataVis.dataVis'),
            component: DataVisView,
            path: appModuleUri(dataModules.dataVis),
          },

        ]}
      />
    </SurveyDefsLoader>
  )
}

export default DataView
