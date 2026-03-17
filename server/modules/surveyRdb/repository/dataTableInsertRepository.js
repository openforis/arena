import { insertAllQueryBatch } from '@server/db/dbUtils'

import { Schemata, TableDataNodeDef } from '@common/model/db'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeRefData from '@core/record/nodeRefData'
import * as Node from '@core/record/node'

import * as NodeRepository from '@server/modules/record/repository/nodeRepository'

const getSelectQuery = ({ surveyId, nodeDef, nodeDefContext, nodeDefAncestorMultipleEntity, nodeDefColumnsUuids }) => {
  const getNodeSelectQuery = (ancestorDef) =>
    NodeRepository.getNodeSelectQuery({
      surveyId,
      ancestorDef,
      includeRefData: true,
      includeRecordInfo: true,
      includeSurveyUuid: false,
    })

  const nodesSelect = `${getNodeSelectQuery(nodeDefAncestorMultipleEntity)}
    WHERE n.node_def_uuid = $/nodeDefUuid/
    ORDER BY n.id`

  if (NodeDef.isAttribute(nodeDef)) {
    return nodesSelect
  }

  const childrenNodesSelect = getNodeSelectQuery(nodeDefContext)

  // join node table with node table itself to get children attribute values

  return `WITH n AS (${nodesSelect}), 
        c AS (${childrenNodesSelect})

      SELECT
        n.*,
        c.children
      FROM
        n
      LEFT OUTER JOIN
        (
          SELECT
            c.ancestor_uuid,
            json_object_agg(c.node_def_uuid::text, json_build_object(
                '${Node.keys.uuid}', c.uuid,
                '${Node.keys.nodeDefUuid}', c.node_def_uuid,
                '${Node.keys.value}', c.value,
                '${NodeRefData.keys.refData}', c.ref_data
            )) AS children
          FROM c
          WHERE
            c.value IS NOT NULL
            ${nodeDefColumnsUuids.length > 0 ? 'AND c.node_def_uuid IN ($/nodeDefColumnsUuids:csv/)' : ''} 
          GROUP BY
            c.ancestor_uuid
        ) c
      ON
        c.ancestor_uuid = n.uuid`
}

export const populateTable = async ({ survey, nodeDef, stopIfFunction = null, onProgress = null }, client) => {
  const surveyId = Survey.getId(survey)
  const schema = Schemata.getSchemaSurveyRdb(surveyId)
  const includeAnalysis = true
  const tableDef = new TableDataNodeDef(survey, nodeDef)
  const nodeDefAncestorMultipleEntity = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
  const nodeDefContext = NodeDef.isEntity(nodeDef) ? nodeDef : nodeDefAncestorMultipleEntity
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefColumns = tableDef.getNodeDefsForColumns({ includeAnalysis })
  const nodeDefColumnsUuids = nodeDefColumns.map(NodeDef.getUuid)

  // 1. create materialized view
  const materializedViewName = `m_view_data`
  const materializedViewFullName = `${schema}.${materializedViewName}`

  try {
    const selectQuery = getSelectQuery({
      surveyId,
      nodeDef,
      nodeDefContext,
      nodeDefAncestorMultipleEntity,
      nodeDefColumnsUuids,
    })
    await client.none(`CREATE MATERIALIZED VIEW ${materializedViewFullName} AS ${selectQuery}`, {
      surveyId,
      nodeDefUuid,
      nodeDefColumnsUuids,
    })

    await client.none(`CREATE INDEX ${materializedViewName}_id_idx ON ${materializedViewFullName} (id)`)

    let total
    if (onProgress) {
      const { count } = await client.one(`SELECT count(id) FROM ${materializedViewFullName}`)
      total = count
    }

    let processed = 0
    const limit = 2000
    const tableName = tableDef.name
    const columnNames = tableDef.getColumnNames({ includeAnalysis })
    const nodeRowToColumnValues = (nodeRow) => tableDef.getRowValuesByColumnName({ nodeRow, nodeDefColumns })

    let lastId = 0
    while (!stopIfFunction?.()) {
      // 2. fetch nodes using keyset pagination on id
      const nodeRows = await client.any(
        `SELECT * FROM ${materializedViewFullName} 
        WHERE id > $/lastId/
        ORDER BY id 
        LIMIT $/limit/`,
        { lastId, limit }
      )

      const processingCount = nodeRows.length
      if (processingCount === 0 || stopIfFunction?.()) {
        break
      }
      lastId = nodeRows[nodeRows.length - 1].id

      // 3. convert nodes into values
      const nodesRowValuesByColumnName = nodeRows.map(nodeRowToColumnValues)

      // 4. insert node values
      await client.none(insertAllQueryBatch(schema, tableName, columnNames, nodesRowValuesByColumnName))

      if (onProgress) {
        processed += processingCount
        await onProgress({ total, processed })
      }
    }
  } finally {
    // 5. drop materialized view
    await client.none(`DROP MATERIALIZED VIEW IF EXISTS ${materializedViewFullName}`)
  }
}
