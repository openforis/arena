import * as Survey from '@core/survey/survey'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as RDBDataView from '@server/modules/surveyRdb/schemaRdb/dataView'
import * as RDBDataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import * as DataViewReadRepository from '@server/modules/surveyRdb/repository/dataViewReadRepository'
import * as ProcessingStepRepository from '../repository/processingStepRepository'

// ==== READ
export const fetchStepData = async (survey, cycle, stepUuid) => {
  const surveyId = Survey.getId(survey)
  const step = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, stepUuid)
  const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
  const entityDefParent = Survey.getNodeDefParent(entityDef)(survey)
  const viewName = NodeDefTable.getViewName(entityDef, entityDefParent)
  const columns = [RDBDataTable.colNameRecordUuuid, ...RDBDataView.getNodeDefColumnNames(survey, entityDef)]
  return DataViewReadRepository.fetchAll({ surveyId, cycle, viewName, columns })
}

// ==== UPDATE
export { default as MassiveInsertNodeResults } from './massiveInsertNodeResults'
