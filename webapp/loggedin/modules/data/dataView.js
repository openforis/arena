import React from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../common/survey/survey'

import NavigationTabBar from '../components/moduleNavigationTabBar'
import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import RecordsView from './records/components/recordsView'
import RecordView from './records/components/recordView'
import DataVisView from './dataVis/dataVisView'

import { appModules, appModuleUri, dataModules } from '../../appModules'
import * as SurveyState from '../../../survey/surveyState'

const DataView = ({ surveyInfo }) => {

  return (
    <SurveyDefsLoader
      draft={!Survey.isPublished(surveyInfo)}
      validate={false}>

      <NavigationTabBar
        moduleRoot={appModules.data}
        moduleDefault={dataModules.records}
        modules={[
          // records list
          {
            component: RecordsView,
            path: appModuleUri(dataModules.records),
          },
          //edit record
          {
            component: RecordView,
            path: appModuleUri(dataModules.record) + ':recordUuid/',
          },
          // data visualization
          {
            component: DataVisView,
            path: appModuleUri(dataModules.dataVis),
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
