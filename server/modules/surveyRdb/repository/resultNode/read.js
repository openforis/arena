import * as pgPromise from 'pg-promise'
import * as camelize from 'camelize'

import * as Schemata from '../../../../../common/model/db/schemata'
import { TableResultNode } from '../../../../../common/model/db'

import * as Node from '../../../../../core/record/node'

import { db } from '../../../../db/db'

/**
 * Reads the rows of the result node table filtered by the specified parameters.
 *
 * @param {!object} params - Filter parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string} params.recordUuid - The record uuid.
 * @param {!string} params.parentUuid - The parent node uuid.
 * @param {!string} params.nodeDefUuid - The node definition uuid.
 * @param {!pgPromise.IDatabase} client - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchNodeResults = async ({ surveyId, recordUuid, parentUuid, nodeDefUuid }, client = db) => {
  const table = new TableResultNode(surveyId)

  return client.map(
    `SELECT *,
    CASE
        WHEN ${table.columnValue}->>'${Node.valuePropKeys.itemUuid}' IS NOT NULL
            THEN json_build_object(
                'category_item',
                json_build_object('id', c.id, 'uuid', c.uuid, 'level_uuid', c.level_uuid, 'parent_uuid', c.parent_uuid, 'props', c.props)
            )
            ELSE NULL
        END AS ref_data
    FROM
        ${table.nameAliased}
    LEFT OUTER JOIN
        ${Schemata.getSchemaSurvey(surveyId)}.category_item c
    ON
      (${table.columnValue}->>'${Node.valuePropKeys.itemUuid}')::uuid = c.uuid
    WHERE
        ${table.columnRecordUuid} = $1
    AND ${table.columnParentUuid} = $2
    AND ${table.columnNodeDefUuid} = $3`,
    [recordUuid, parentUuid, nodeDefUuid],
    camelize
  )
}
