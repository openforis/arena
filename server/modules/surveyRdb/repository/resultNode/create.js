import * as pgPromise from 'pg-promise'

import { Schemata, TableResultNode, TableChain, TableStep } from '../../../../../common/model/db'

/**
 * Creates a results_node table for the specified survey.
 *
 * @param {object} params - The query parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!pgPromise.IDatabase} client - The database client.
 */
export const createResultNodeTable = async ({ surveyId }, client) => {
  const schemaSurvey = Schemata.getSchemaSurvey(surveyId)
  const tableResultNode = new TableResultNode(surveyId)
  const tableChain = new TableChain(surveyId)
  const { columnSet } = TableResultNode

  return client.query(`
    CREATE TABLE
      ${tableResultNode.nameQualified}
    (
      ${columnSet.uuid}           uuid      NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${columnSet.chainUuid}      uuid      NOT NULL REFERENCES ${tableChain.nameQualified} ("${TableChain.columnSet.uuid}") ON DELETE CASCADE,
      ${columnSet.recordUuid}     uuid      NOT NULL REFERENCES ${schemaSurvey}.record ("uuid") ON DELETE CASCADE,
      ${columnSet.parentUuid}     uuid          NULL REFERENCES ${schemaSurvey}.node ("uuid") ON DELETE CASCADE,
      ${columnSet.nodeDefUuid}    uuid      NOT NULL REFERENCES ${schemaSurvey}.node_def ("uuid") ON DELETE CASCADE,
      ${columnSet.value}          jsonb         NULL
    )
  `)
}
