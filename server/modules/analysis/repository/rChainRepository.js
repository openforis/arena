import * as R from 'ramda'

import { db } from '@server/db/db'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'

import * as Survey from '@core/survey/survey'

import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import * as RDBDataView from '@server/modules/surveyRdb/schemaRdb/dataView'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ==== READ - Step
export const fetchStepData = async (survey, cycle, entityDef, entityDefParent, client = db) => {
  const surveyId = Survey.getId(survey)
  const viewName = NodeDefTable.getViewName(entityDef, entityDefParent)
  const fields = R.pipe(
    // Remove prefix and keep only alias
    R.map(R.pipe(R.split('.'), R.last, R.split(' as '), R.last)),
    R.prepend(DataTable.colNameRecordUuuid)
  )(RDBDataView.getSelectFieldsNodeDefs(survey, entityDef))

  return client.any(
    `SELECT ${fields.join(', ')} 
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
