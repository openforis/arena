import { useDispatch } from 'react-redux'
import { useLocation } from 'react-router'

import { Authorizer } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { appModules, appModuleUri, dataModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/ModuleSwitch'
import Record from '@webapp/components/survey/Record'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanPreviewDraftFormInDataEntry, useUser } from '@webapp/store/user'
import { resetDataVis } from '@webapp/views/Data/Explorer/actions'

import DataExport from './DataExport'
import DataImport from './DataImport'
import Explorer from './Explorer'
import { FormPreview } from './FormPreview'
import { MapView } from './MapView'
import Records from './Records'
import ValidationReport from './ValidationReport'

const Data = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const { pathname } = useLocation()
  const canPreviewDraftForm = useAuthCanPreviewDraftFormInDataEntry()
  // the form preview needs the draft survey definitions
  const formPreview = canPreviewDraftForm && pathname.startsWith(appModuleUri(dataModules.formPreview))
  const draftDefs =
    formPreview ||
    ((Survey.isFromCollect(surveyInfo) || Survey.isFromOdk(surveyInfo)) && !Survey.isPublished(surveyInfo))

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
          // Draft form preview
          ...(canPreviewDraftForm
            ? [
                {
                  component: FormPreview,
                  path: dataModules.formPreview.path,
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
