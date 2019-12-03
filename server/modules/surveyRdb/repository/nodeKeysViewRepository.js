import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as RDBDataView from '../schemaRdb/dataView'
import * as NodeKeysView from '../schemaRdb/nodeKeysView'

// ====== CREATE

export const createNodeKeysView = async (survey, client = db) => {
  const surveyId = Survey.getId(survey)

  const selectViews = []
  const { root } = Survey.getHierarchy()(survey)
  Survey.traverseHierarchyItemSync(root, nodeDef => {
    selectViews.push(`
        SELECT 
            ${RDBDataView.getColUuid(nodeDef)} AS ${
      NodeKeysView.columns.nodeUuid
    },
            '${NodeDef.getUuid(nodeDef)}' AS ${
      NodeKeysView.columns.nodeDefUuid
    },
            ${RDBDataView.columns.keys} AS ${NodeKeysView.columns.keys}
        FROM
            ${RDBDataView.getNameWithSchema(surveyId)(nodeDef)}  
      `)
  })

  await client.query(`
    CREATE VIEW ${NodeKeysView.getNameWithSchema(surveyId)} AS (
    ${selectViews.join(' UNION ALL ')}
    )
  `)
}
