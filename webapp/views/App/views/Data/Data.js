import React from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import { appModules, appModuleUri, dataModules } from '@webapp/app/appModules'

import { useSurveyInfo } from '@webapp/store/survey'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import Record from '@webapp/components/survey/Record'

import { resetDataVis } from '@webapp/views/App/views/Data/Explorer/actions'

import ValidationReport from './ValidationReport'
import Records from './Records'
import Explorer from './Explorer'
import ExportData from './ExportData'
import DataImport from './DataImport'
import { MapView } from './MapView'

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
            component: Record,
            path: `${appModuleUri(dataModules.record)}:recordUuid/`,
            props: { draftDefs },
          },
          // Record validation report
          {
            component: ValidationReport,
            path: `${appModuleUri(dataModules.recordValidationReport)}:recordUuid`,
          },
          // Data visualization
          {
            component: Explorer,
            path: appModuleUri(dataModules.explorer),
          },
          // Map
          {
            component: MapView,
            path: appModuleUri(dataModules.map),
          },
          // Data export
          {
            component: ExportData,
            path: appModuleUri(dataModules.export),
          },
          // Data import
          {
            component: DataImport,
            path: appModuleUri(dataModules.import),
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
