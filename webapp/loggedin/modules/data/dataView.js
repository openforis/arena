import React from 'react'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'

import * as SurveyState from '@webapp/survey/surveyState'
import InnerModuleSwitch from '../components/innerModuleSwitch'
import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import RecordView from '../../surveyViews/record/recordView'
import { appModules, appModuleUri, dataModules } from '../../appModules'
import RecordsView from './records/recordsView'
import DataVisView from './dataVis/dataVisView'

const DataView = ({ surveyInfo }) => {
  const draftDefs =
    Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  return (
    <SurveyDefsLoader
      draft={draftDefs}
      validate={draftDefs}
      requirePublish={true}
    >
      <InnerModuleSwitch
        moduleRoot={appModules.data}
        moduleDefault={dataModules.records}
        modules={[
          // Records list
          {
            component: RecordsView,
            path: appModuleUri(dataModules.records),
          },
          // Edit record
          {
            component: RecordView,
            path: appModuleUri(dataModules.record) + ':recordUuid/',
            props: { draftDefs },
          },
          // Data visualization
          {
            component: DataVisView,
            path: appModuleUri(dataModules.dataVis),
          },
        ]}
      />
    </SurveyDefsLoader>
  )
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps)(DataView)
