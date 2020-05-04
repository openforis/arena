import * as pgPromise from 'pg-promise'
import camelize from 'camelize'
import * as R from 'ramda'

import { TableNode } from '../../../../../common/model/db'
import * as Node from '../../../../../core/record/node'

import { db } from '../../../../db/db'

export const dbTransformCallback = (node) =>
  node ? R.pipe(R.dissoc(Node.keys.meta), camelize, R.assoc(Node.keys.meta, R.prop(Node.keys.meta, node)))(node) : null

/**
 * Fetches nodes by the given survey id and the optional parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
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
  const { surveyId, uuid, recordUuid, parentUuid, nodeDefUuid, draft } = params
  const table = new TableNode(surveyId)
  return client.map(table.getSelect({ uuid, recordUuid, parentUuid, nodeDefUuid, draft }), [], dbTransformCallback)
}
