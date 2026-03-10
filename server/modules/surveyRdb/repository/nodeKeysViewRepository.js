import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { ViewDataNodeDef } from '@common/model/db'

import * as RDBDataView from '../schemaRdb/dataView'
import * as NodeKeysView from '../schemaRdb/nodeKeysView'

// ====== CREATE

export const createNodeKeysView = async (survey, client = db) => {
  const surveyId = Survey.getId(survey)

  const selectViews = []

  const { root } = Survey.getHierarchy(NodeDef.isMultipleEntity)(survey)

  Survey.traverseHierarchyItemSync(root, (nodeDef) => {
    const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)
    selectViews.push(`
        SELECT 
            ${viewDataNodeDef.columnIdName} AS ${NodeKeysView.columns.nodeId},
            ${ViewDataNodeDef.columnSet.recordUuid} AS ${NodeKeysView.columns.recordUuid},
            ${viewDataNodeDef.columnNodeDefIIdName} AS ${NodeKeysView.columns.nodeIId},
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
