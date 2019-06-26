import './dataView.scss'

import React from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../commonComponents/useI18n'

import Survey from '../../../../common/survey/survey'

import NavigationTabBar from '../components/moduleNavigationTabBar'
import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import RecordsView from './records/components/recordsView'
import RecordView from './records/components/recordView'
import DataVisView from './dataVis/dataVisView'

import { appModules, appModuleUri, dataModules } from '../../appModules'
import * as SurveyState from '../../../survey/surveyState'

const DataView = ({ surveyInfo }) => {
  const i18n = useI18n()

  const showDataVis = Survey.isPublished(surveyInfo) || Survey.isFromCollect(surveyInfo)

  return (
    <SurveyDefsLoader
      draft={!Survey.isPublished(surveyInfo)}
      validate={false}>

      <NavigationTabBar
        className="data app-module__tab-navigation"
        moduleRoot={appModules.data}
        moduleDefault={dataModules.records}
        tabs={[

          // records list
          {
            label: i18n.t('appModules.records'),
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
            label: i18n.t('appModules.dataVis'),
            component: DataVisView,
            path: appModuleUri(dataModules.dataVis),
            showTab: showDataVis
          },

        ]}
      />
    </SurveyDefsLoader>
  )
}

const mapStateToProps = state => {
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    surveyInfo,
  }
}

export default connect(mapStateToProps)(DataView)
