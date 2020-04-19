import * as pgPromise from 'pg-promise'

import { getSchemaSurvey, TableResultNode, TableChain, TableStep } from '../../../../../common/model/db'

/**
 * Creates a results_node table for the specified survey.
 *
 * @param {object} params - The query parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!pgPromise.IDatabase} client - The database client.
 */
export const createResultNodeTable = async ({ surveyId }, client) => {
  const schemaSurvey = getSchemaSurvey(surveyId)
  const tableResultNode = new TableResultNode(surveyId)
  const tableChain = new TableChain(surveyId)
  const tableStep = new TableStep(surveyId)
  const { columnSet } = TableResultNode

  return client.query(`
    CREATE TABLE
      ${tableResultNode.schema}.${tableResultNode.name}
    (
      ${columnSet.uuid}           uuid      NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${columnSet.chainUuid}      uuid      NOT NULL REFERENCES ${tableChain.schema}.${tableChain.name} ("${TableChain.columnSet.uuid}") ON DELETE CASCADE,
      ${columnSet.stepUuid}       uuid      NOT NULL REFERENCES ${tableStep.schema}.${tableStep.name} ("${TableStep.columnSet.uuid}") ON DELETE CASCADE,
      ${columnSet.recordUuid}     uuid      NOT NULL REFERENCES ${schemaSurvey}.record ("uuid") ON DELETE CASCADE,
      ${columnSet.parentUuid}     uuid          NULL REFERENCES ${schemaSurvey}.node ("uuid") ON DELETE CASCADE,
      ${columnSet.nodeDefUuid}    uuid      NOT NULL REFERENCES ${schemaSurvey}.node_def ("uuid") ON DELETE CASCADE,
      ${columnSet.value}          jsonb         NULL
    )
  `)
}
