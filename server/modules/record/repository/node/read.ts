import type { ArenaSurvey } from '@openforis/arena-core'

import type { GetSelectParams } from '@common/model/db/tables/node/select'
import type { DbClient } from '@server/db/db'
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
 * @param {DbClient} [client=db] - The database client.
 *
 * @returns {Promise<Node[]>} - The result promise.
 */
export const fetchNodes = (params: GetSelectParams & { survey: ArenaSurvey }, client: DbClient = db) => {
  const { survey, uuid, recordUuid, parentUuid, nodeDefUuid, draft } = params
  const table = new TableNode(survey)
  return client.map(
    table.getSelect({ uuid, recordUuid, parentUuid, nodeDefUuid, draft }),
    [],
    TableNode.dbTransformCallback
  )
}
