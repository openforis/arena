import React from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'

import { appModules, dataModules } from '@webapp/app/appModules'

import { useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import Record from '@webapp/components/survey/Record'

import { resetDataVis } from '@webapp/views/App/views/Data/Explorer/actions'

import ValidationReport from './ValidationReport'
import Records from './Records'
import Explorer from './Explorer'
import DataExport from './DataExport'
import DataImport from './DataImport'
import { MapView } from './MapView'

const Data = () => {
  const dispatch = useDispatch()
  const user = useUser()
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
            path: dataModules.records.path,
          },
          // Edit record
          {
            component: Record,
            path: `${dataModules.record.path}/:recordUuid/`,
            props: { draftDefs },
          },
          // Record validation report
          {
            component: ValidationReport,
            path: `${dataModules.recordValidationReport.path}/:recordUuid`,
          },
          // Data visualization
          {
            component: Explorer,
            path: dataModules.explorer.path,
          },
          // Map
          ...(Authorizer.canUseMap(user, surveyInfo)
            ? [
                {
                  component: MapView,
                  path: dataModules.map.path,
                },
              ]
            : []),
          // Data export
          ...(Authorizer.canExportRecords(user, surveyInfo)
            ? [
                {
                  component: DataExport,
                  path: dataModules.export.path,
                },
              ]
            : []),
          // Data import
          ...(Authorizer.canImportRecords(user, surveyInfo)
            ? [
                {
                  component: DataImport,
                  path: dataModules.import.path,
                },
              ]
            : []),
          // Validation report
          ...(Authorizer.canCleanseRecords(user, surveyInfo)
            ? [
                {
                  component: ValidationReport,
                  path: dataModules.validationReport.path,
                },
              ]
            : []),
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Data
