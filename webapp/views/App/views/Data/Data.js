import React from 'react'
import { useDispatch } from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'

import { appModules, dataModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import Record from '@webapp/components/survey/Record'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'
import { resetDataVis } from '@webapp/views/App/views/Data/Explorer/actions'

import Charts from './Charts'
import DataExport from './DataExport'
import DataImport from './DataImport'
import Explorer from './Explorer'
import { MapView } from './MapView'
import Records from './Records'
import ValidationReport from './ValidationReport'

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
          // Chart
          ...(Authorizer.canUseCharts(user, surveyInfo)
            ? [
                {
                  component: Charts,
                  path: dataModules.charts.path,
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
