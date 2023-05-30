import * as pgPromise from 'pg-promise'
import { TableNode } from '../../../../../common/model/db'

import { db } from '../../../../db/db'

/**
 * Fetches nodes by the given survey id and the optional parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {!object} params.survey - The survey object.
 * @param {string} [params.uuid=null] - The node uuid to filter by.
 * @param {string} [params.recordUuid=null] - The record uuid to filter by.
 * @param {string} [params.parentUuid=null] - The parent node uuid to filter by.
 * @param {string} [params.nodeDefUuid=null] - The node definition uuid to filter by.
 * @param {boolean} [params.draft=false] - Whether to fetch draft props or only published ones.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Node[]>} - The result promise.
 */
export const fetchNodes = async (params, client = db) => {
  const { survey, uuid, recordUuid, parentUuid, nodeDefUuid, draft } = params
  const table = new TableNode(survey)
  return client.map(
    table.getSelect({ uuid, recordUuid, parentUuid, nodeDefUuid, draft }),
    [],
    TableNode.dbTransformCallback
  )
}
