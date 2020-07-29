import React from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import { appModules, appModuleUri, dataModules } from '@webapp/app/appModules'

import { useSurveyInfo } from '@webapp/store/survey'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import RecordView from '@webapp/components/survey/Record'

import { resetDataVis } from '@webapp/views/App/views/Data/Explorer/actions'

import ValidationReport from './ValidationReport'
import Records from './Records'
import Explorer from './Explorer'

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
            component: Explorer,
            path: appModuleUri(dataModules.explorer),
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
