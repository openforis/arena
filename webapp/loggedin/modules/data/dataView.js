import './dataView.scss'

import React, { useContext } from 'react'
import { connect } from 'react-redux'

import AppContext from '../../../app/appContext'

import Survey from '../../../../common/survey/survey'

import NavigationTabBar from '../components/moduleNavigationTabBar'
import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import RecordsView from './records/components/recordsView'
import RecordView from './records/components/recordView'
import DataVisView from './dataVis/dataVisView'

import { appModules, appModuleUri } from '../../appModules'
import { dataModules } from './dataModules'
import * as SurveyState from '../../../survey/surveyState'

const DataView = ({ surveyInfo }) => {
  const { i18n } = useContext(AppContext)

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
