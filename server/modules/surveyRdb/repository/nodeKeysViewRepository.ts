import type { Survey as ArenaSurvey } from '@openforis/arena-core'
import { db, type DbClient } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { ViewDataNodeDef } from '@common/model/db'

import * as NodeKeysView from '../schemaRdb/nodeKeysView'

// ====== CREATE

export const createNodeKeysView = async (survey: ArenaSurvey, client: DbClient = db) => {
  const surveyId = Survey.getId(survey)

  const selectViews = []

  const { root } = Survey.getHierarchy(NodeDef.isMultipleEntity)(survey)

  Survey.traverseHierarchyItemSync(root, (nodeDef) => {
    const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)
    selectViews.push(`
        SELECT 
            ${viewDataNodeDef.columnIdName} AS ${NodeKeysView.columns.nodeId},
            ${viewDataNodeDef.columnNodeDefUuid.name} AS ${NodeKeysView.columns.nodeUuid},
            '${NodeDef.getUuid(nodeDef)}' AS ${NodeKeysView.columns.nodeDefUuid},
            ${ViewDataNodeDef.columnSet.recordUuid} AS ${NodeKeysView.columns.recordUuid},
            ${ViewDataNodeDef.columnSet.keys} AS ${NodeKeysView.columns.keys}
        FROM
            ${viewDataNodeDef.nameQualified}  
      `)
  })

  await client.query(`
    CREATE VIEW ${NodeKeysView.getNameWithSchema(surveyId)} AS (
    ${selectViews.join(' UNION ALL ')}
    )
  `)
}
