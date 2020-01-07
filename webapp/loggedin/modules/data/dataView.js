import React from 'react'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'

import ModuleSwitch from '@webapp/commonComponents/moduleSwitch'
import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import RecordView from '../../surveyViews/record/recordView'
import DataVisView from './dataVis/dataVisView'
import ValidationReportView from './validationReport/validationReportView'
import RecordsView from './records/recordsView'

import * as SurveyState from '@webapp/survey/surveyState'
import { appModules, appModuleUri, dataModules } from '@webapp/app/appModules'

const DataView = ({ surveyInfo }) => {
  const draftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  return (
    <SurveyDefsLoader draft={draftDefs} validate={draftDefs} requirePublish={true}>
      <ModuleSwitch
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
          // Validation report
          {
            component: ValidationReportView,
            path: appModuleUri(dataModules.validationReport),
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
