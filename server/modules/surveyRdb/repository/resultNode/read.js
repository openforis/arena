import * as pgPromise from 'pg-promise'
import * as camelize from 'camelize'

import { TableResultNode } from '../../../../../common/model/db'

import { db } from '../../../../db/db'

/**
 * Reads the rows of the result node table filtered by the specified parameters.
 *
 * @param {!object} params - Filter parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {string} params.uuid - The result node uuid.
 * @param {string} params.recordUuid - The record uuid.
 * @param {string} params.parentUuid - The parent node uuid.
 * @param {string} params.nodeDefUuid - The node definition uuid.
 * @param {!pgPromise.IDatabase} client - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchNodeResults = async (params, client = db) => {
  const { surveyId, uuid, recordUuid, parentUuid, nodeDefUuid } = params
  const table = new TableResultNode(surveyId)

  return client.map(table.getSelect({ surveyId, uuid, recordUuid, parentUuid, nodeDefUuid }), [], camelize.default)
}
