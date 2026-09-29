import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as NodeHierarchyDisaggregatedView from '../schemaRdb/nodeHierarchyDisaggregatedView'

const { columns } = NodeHierarchyDisaggregatedView

// ====== CREATE

export const createNodeHierarchyDisaggregatedView = async (survey, client = db) => {
  const surveyId = Survey.getId(survey)
  const surveySchema = getSurveyDBSchema(surveyId)

  await client.query(`
    CREATE VIEW ${NodeHierarchyDisaggregatedView.getNameWithSchema(surveyId)} AS
      (
        SELECT
          n.record_uuid    AS ${columns.recordUuid},
          h.*,
          n.id             AS ${columns.nodeAncestorId},
          nd_a.uuid        AS ${columns.nodeDefAncestorUuid}
        FROM
          ${surveySchema}.node n
        JOIN ${surveySchema}.node_def nd_a ON nd_a.id = n.node_def_id
        JOIN
          (
            SELECT
              n.id                                             AS ${columns.nodeId},
              n.i_id                                            AS ${columns.nodeIId},
              nd.uuid                                           AS ${columns.nodeDefUuid},
              jsonb_array_elements_text(n.meta->'h')::integer  AS ${columns.nodeAncestorIId}
            FROM
              ${surveySchema}.node n
            JOIN ${surveySchema}.node_def nd ON nd.id = n.node_def_id
           ) h
        ON
          n.i_id = h.${columns.nodeAncestorIId}
        -- Union with root nodes
        UNION ALL
        SELECT
          n.record_uuid     AS ${columns.recordUuid},
          n.id              AS ${columns.nodeId},
          n.i_id            AS ${columns.nodeIId},
          nd.uuid           AS ${columns.nodeDefUuid},
          NULL              AS ${columns.nodeAncestorIId},
          NULL              AS ${columns.nodeAncestorId},
          NULL              AS ${columns.nodeDefAncestorUuid}
        FROM
          ${surveySchema}.node n
        JOIN ${surveySchema}.node_def nd ON nd.id = n.node_def_id
        WHERE
          n.p_i_id IS NULL
        ORDER BY
          ${columns.nodeAncestorId},
          ${columns.nodeId}
      )
  `)
}
