import React from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import { appModules, appModuleUri, dataModules } from '@webapp/app/appModules'

import { useSurveyInfo } from '@webapp/store/survey'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'
import RecordView from '@webapp/loggedin/surveyViews/record/recordView'
import DataVisView from '@webapp/loggedin/modules/data/dataVis/dataVisView'

import { resetDataVis } from '@webapp/loggedin/modules/data/dataVis/actions'

import ValidationReport from './ValidationReport'
import Records from './Records'

const Data = () => {
  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()
  const draftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  return (
    <SurveyDefsLoader
      draft={draftDefs}
      validate={draftDefs}
      requirePublish
      onSurveyCycleUpdate={() => dispatch(resetDataVis())}
    >
      <ModuleSwitch
        moduleRoot={appModules.data}
        moduleDefault={dataModules.records}
        modules={[
          // Records list
          {
            component: Records,
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
            component: ValidationReport,
            path: appModuleUri(dataModules.validationReport),
          },
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Data
