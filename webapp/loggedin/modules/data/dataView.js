import React from 'react'

import * as Survey from '@core/survey/survey'

import { useSurveyInfo } from '@webapp/commonComponents/hooks'
import { appModules, appModuleUri, dataModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/commonComponents/moduleSwitch'
import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'
import RecordView from '@webapp/loggedin/surveyViews/record/recordView'
import DataVisView from './dataVis/dataVisView'
import ValidationReportView from './validationReport/validationReportView'
import RecordsView from './records/recordsView'

const DataView = () => {
  const surveyInfo = useSurveyInfo()
  const draftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  return (
    <SurveyDefsLoader draft={draftDefs} validate={draftDefs} requirePublish>
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
            path: `${appModuleUri(dataModules.record)}:recordUuid/`,
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

export default DataView
