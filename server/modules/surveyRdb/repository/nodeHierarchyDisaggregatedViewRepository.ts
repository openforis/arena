import type { ArenaSurvey } from '@openforis/arena-core'
import { db, DbClient } from '@server/db/db'

import * as Survey from '@core/survey/survey'

import { Schemata } from '@common/model/db'
import * as NodeHierarchyDisaggregatedView from '../schemaRdb/nodeHierarchyDisaggregatedView'

const { columns } = NodeHierarchyDisaggregatedView

// ====== CREATE

// one row for each (node, ancestor) pair: the ancestors are found going up the parent uuids
// (in a lateral subquery, so filters on the node columns are applied before it)
const _getViewSelectQuery = (surveyId: number): string => {
  const surveySchema = Schemata.getSchemaSurvey(surveyId)
  return `
      (
        SELECT
          n.record_uuid   AS ${columns.recordUuid},
          n.id            AS ${columns.nodeId},
          n.uuid          AS ${columns.nodeUuid},
          n.node_def_uuid AS ${columns.nodeDefUuid},
          a.uuid          AS ${columns.nodeAncestorUuid},
          a.id            AS ${columns.nodeAncestorId},
          a.node_def_uuid AS ${columns.nodeDefAncestorUuid}
        FROM
          ${surveySchema}.node n
        CROSS JOIN LATERAL
          (
            WITH RECURSIVE ancestor AS (
              SELECT p.id, p.uuid, p.parent_uuid, p.node_def_uuid
              FROM ${surveySchema}.node p
              WHERE p.uuid = n.parent_uuid
              UNION ALL
              SELECT p.id, p.uuid, p.parent_uuid, p.node_def_uuid
              FROM ${surveySchema}.node p
              JOIN ancestor ON p.uuid = ancestor.parent_uuid
            )
            SELECT * FROM ancestor
          ) a
        -- Union with root nodes  
        UNION ALL
        SELECT
          n.record_uuid     AS ${columns.recordUuid},
          n.id              AS ${columns.nodeId},
          n.uuid            AS ${columns.nodeUuid},
          n.node_def_uuid   AS ${columns.nodeDefUuid},
          NULL              AS ${columns.nodeAncestorUuid},
          NULL              AS ${columns.nodeAncestorId},
          NULL              AS ${columns.nodeDefAncestorUuid}
        FROM
          ${surveySchema}.node n
        WHERE
          n.parent_uuid IS NULL
        ORDER BY
          ${columns.nodeAncestorId},
          ${columns.nodeId}
      )
  `
}

export const createNodeHierarchyDisaggregatedView = async (survey: ArenaSurvey, client: DbClient = db) => {
  const surveyId = Survey.getId(survey)
  await client.query(
    `CREATE VIEW ${NodeHierarchyDisaggregatedView.getNameWithSchema(surveyId)} AS ${_getViewSelectQuery(surveyId)}`
  )
}

// ====== UPDATE

/**
 * Replaces the definition of the view, if it exists (the columns don't change, so the dependent views stay valid).
 * @param {!object} params - The parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {DbClient} [client] - The database client.
 * @returns {Promise<void>} - The result promise.
 */
export const replaceNodeHierarchyDisaggregatedViewIfExists = async (
  { surveyId }: { surveyId: number },
  client: DbClient = db
): Promise<void> => {
  const viewName = NodeHierarchyDisaggregatedView.getNameWithSchema(surveyId)
  const exists = await client.one(`SELECT to_regclass($1) IS NOT NULL AS exists`, [viewName], (row) => row.exists)
  if (!exists) return
  await client.query(`CREATE OR REPLACE VIEW ${viewName} AS ${_getViewSelectQuery(surveyId)}`)
}
