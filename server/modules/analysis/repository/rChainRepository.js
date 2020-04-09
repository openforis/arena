import { db } from '@server/db/db'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'
import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ==== READ - Step
export const fetchStepData = async (surveyId, cycle, entityDef, entityDefParent, nodeDefCalculations, client = db) => {
  const viewName = NodeDefTable.getViewName(entityDef, entityDefParent)

  return client.any(
    `SELECT * 
    FROM ${SchemaRdb.getName(surveyId)}.${viewName}
    WHERE ${DataTable.colNameRecordCycle} = '${cycle}'`
  )
}

// ==== DELETE - Chain
export const deleteNodeResults = async (surveyId, cycle, chainUuid, client = db) =>
  client.query(
    `DELETE
    FROM
        ${SchemaRdb.getName(surveyId)}.${ResultNodeTable.tableName}
    WHERE
        ${ResultNodeTable.colNames.processingChainUuid} = $1
    AND ${ResultNodeTable.colNames.recordUuid} IN
    (
        SELECT r.uuid
        FROM ${getSurveyDBSchema(surveyId)}.record r
        WHERE r.cycle = $2
    )`,
    [chainUuid, cycle]
  )
