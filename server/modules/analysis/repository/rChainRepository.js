import * as R from 'ramda'

import { db } from '@server/db/db'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

export const fetchStepData = async (survey, cycle, step, client = db) => {
  const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
  const entityDefParent = Survey.getNodeDefParent(entityDef)(survey)
  const viewName = NodeDefTable.getViewName(entityDef, entityDefParent)
  const calculationAttrDefs = R.pipe(
    ProcessingStep.getCalculations,
    R.map(
      R.pipe(ProcessingStepCalculation.getNodeDefUuid, nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey)),
    ),
  )(step)

  const fields = ['*']
  for (const nodeDef of calculationAttrDefs) {
    const nodeDefName = NodeDef.getName(nodeDef)
    // Add nodeDefName_uuid field
    fields.push(`uuid_generate_v4() as ${nodeDefName}_uuid`)
  }

  return await client.any(`
        SELECT ${fields.join(', ')} 
        FROM ${SchemaRdb.getName(Survey.getId(survey))}.${viewName}
        WHERE ${DataTable.colNameRecordCycle} = '${cycle}' 
      `)
}
