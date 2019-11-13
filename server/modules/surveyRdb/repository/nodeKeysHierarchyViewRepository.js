import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'

import * as NodeKeysView from '../schemaRdb/nodeKeysView'
import * as NodeHierarchyDisaggregatedView from '../schemaRdb/nodeHierarchyDisaggregatedView'
import * as NodeKeysHierarchyView from '../schemaRdb/nodeKeysHierarchyView'

//====== CREATE

export const createNodeKeysHierarchyView = async (survey, client = db) => {

  const surveyId = Survey.getId(survey)

  await client.query(`
    CREATE VIEW ${NodeKeysHierarchyView.getNameWithSchema(surveyId)} AS (
      SELECT
        h.${NodeHierarchyDisaggregatedView.columns.nodeUuid} AS ${NodeKeysHierarchyView.columns.nodeUuid},
        jsonb_agg(
          jsonb_build_object( 'nodeUuid', h.${NodeHierarchyDisaggregatedView.columns.nodeAncestorUuid}, 'keys', k_h.${NodeKeysView.columns.keys} ) 
          ORDER BY h.${NodeHierarchyDisaggregatedView.columns.nodeAncestorId} 
        ) AS ${NodeKeysHierarchyView.columns.keysHierarchy},
        k_s.${NodeKeysView.columns.keys} AS ${NodeKeysHierarchyView.columns.keysSelf}
      FROM
        ${NodeHierarchyDisaggregatedView.getNameWithSchema(surveyId)} h
        -- Join to get keys for every ancestor
      LEFT OUTER JOIN
        ${NodeKeysView.getNameWithSchema(surveyId)} k_h
      ON
        k_h.${NodeKeysView.columns.nodeUuid} = h.${NodeHierarchyDisaggregatedView.columns.nodeAncestorUuid}
        -- Join to get keys for itself if it's an entity
      LEFT OUTER JOIN
        ${NodeKeysView.getNameWithSchema(surveyId)} k_s
      ON
        k_s.${NodeKeysView.columns.nodeUuid} = h.${NodeHierarchyDisaggregatedView.columns.nodeUuid}
      GROUP BY
        h.${NodeHierarchyDisaggregatedView.columns.nodeUuid},
        k_s.${NodeKeysView.columns.keys}
    )
  `)
}