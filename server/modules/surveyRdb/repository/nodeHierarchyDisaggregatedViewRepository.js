import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as NodeHierarchyDisaggregatedView from '../schemaRdb/nodeHierarchyDisaggregatedView'

const { columns } = NodeHierarchyDisaggregatedView

// ====== CREATE

export const createNodeHierarchyDisaggregatedView = async (survey, client = db) => {
  const surveyId = Survey.getId(survey)

  await client.query(`
    CREATE VIEW ${NodeHierarchyDisaggregatedView.getNameWithSchema(surveyId)} AS
      (
        SELECT
          n.record_uuid   AS ${columns.recordUuid},
          h.*,
          n.id            AS ${columns.nodeAncestorId},
          n.node_def_uuid AS ${columns.nodeDefAncestorUuid}
        FROM
          ${getSurveyDBSchema(surveyId)}.node n
        JOIN
          (
            SELECT
              n.id                                         AS ${columns.nodeId},
              n.uuid                                       AS ${columns.nodeUuid},
              n.node_def_uuid                              AS ${columns.nodeDefUuid},
              jsonb_array_elements_text(n.meta->'h')::uuid AS ${columns.nodeAncestorUuid}
            FROM
              ${getSurveyDBSchema(surveyId)}.node n
           ) h
        ON
          n.uuid = h.${columns.nodeAncestorUuid}
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
          ${getSurveyDBSchema(surveyId)}.node n
        WHERE
          n.parent_uuid IS NULL
        ORDER BY
          ${columns.nodeAncestorId},
          ${columns.nodeId}
      )
  `)
}
