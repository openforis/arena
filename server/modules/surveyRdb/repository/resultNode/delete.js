import * as pgPromise from 'pg-promise'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'

import { db } from '@server/db/db'
import * as SurveySchemaRepositoryUtils from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

/**
 * Deletes the nodes of the result node table for the specified processing chain.
 *
 * @param {!object} params - Filter parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string} params.cycle - The survey cycle.
 * @param {!string} params.chainUuid - The processing chain uuid.
 * @param {!pgPromise.IDatabase} client - The database client.
 */
export const deleteNodeResultsByChainUuid = async ({ surveyId, cycle, chainUuid }, client = db) =>
  client.query(
    `DELETE
    FROM
        ${SchemaRdb.getName(surveyId)}.${ResultNodeTable.tableName}
    WHERE
        ${ResultNodeTable.colNames.processingChainUuid} = $1
    AND ${ResultNodeTable.colNames.recordUuid} IN
    (
        SELECT r.uuid
        FROM ${SurveySchemaRepositoryUtils.getSurveyDBSchema(surveyId)}.record r
        WHERE r.cycle = $2
    )`,
    [chainUuid, cycle]
  )
