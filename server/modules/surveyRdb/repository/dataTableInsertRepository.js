import { insertAllQueryBatch } from '@server/db/dbUtils'

import { Schemata, TableDataNodeDef } from '@common/model/db'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeRefData from '@core/record/nodeRefData'
import * as Node from '@core/record/node'

import * as NodeRepository from '@server/modules/record/repository/nodeRepository'

const getSelectQuery = ({ surveyId, nodeDef, nodeDefContext, nodeDefAncestorMultipleEntity, nodeDefColumnsUuids }) => {
  const getNodeSelectQuery = (ancestorDef) =>
    NodeRepository.getNodeSelectQuery({ surveyId, includeRefData: true, includeRecordInfo: true, ancestorDef })

  const nodesSelect = `${getNodeSelectQuery(nodeDefAncestorMultipleEntity)}
    WHERE n.node_def_uuid = $1
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
            ${nodeDefColumnsUuids.length > 0 ? 'AND c.node_def_uuid IN ($2:csv)' : ''} 
          GROUP BY
            c.ancestor_uuid
        ) c
      ON
        c.ancestor_uuid = n.uuid`
}

export const populateTable = async ({ survey, nodeDef, stopIfFunction = null }, client) => {
  const surveyId = Survey.getId(survey)
  const surveySchema = Schemata.getSchemaSurveyRdb(surveyId)
  const includeAnalysis = true
  const tableDef = new TableDataNodeDef(survey, nodeDef)
  const nodeDefAncestorMultipleEntity = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
  const nodeDefContext = NodeDef.isEntity(nodeDef) ? nodeDef : nodeDefAncestorMultipleEntity
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefColumns = tableDef.getNodeDefsForColumns({ includeAnalysis })
  const nodeDefColumnsUuids = nodeDefColumns.map(NodeDef.getUuid)

  // 1. create materialized view
  const viewName = `${surveySchema}.m_view_data`
  const selectQuery = getSelectQuery({
    surveyId,
    nodeDef,
    nodeDefContext,
    nodeDefAncestorMultipleEntity,
    nodeDefColumnsUuids,
  })

  await client.none(`CREATE MATERIALIZED VIEW ${viewName} AS ${selectQuery}`, [nodeDefUuid, nodeDefColumnsUuids])

  const { count } = await client.one(`SELECT count(id) FROM ${viewName}`)

  const limit = 5000
  const noIter = Math.ceil(count / limit)
  for (let i = 0; i < noIter && !stopIfFunction?.(); i++) {
    const offset = i * limit

    // 2. fetch nodes
    const nodes = await client.any(
      `SELECT * FROM ${viewName} 
      ORDER BY id 
      OFFSET ${offset} 
      LIMIT ${limit}`
    )

    if (stopIfFunction?.()) {
      break
    }
    // 3. convert nodes into values
    const tableDef = new TableDataNodeDef(survey, nodeDef)

    const nodesRowValuesByColumnName = nodes.map((nodeRow) =>
      tableDef.getRowValuesByColumnName({ nodeRow, nodeDefColumns })
    )

    // 4. insert node values
    const schema = Schemata.getSchemaSurveyRdb(surveyId)
    const tableName = tableDef.name
    const columnNames = tableDef.getColumnNames({ includeAnalysis })
    await client.none(insertAllQueryBatch(schema, tableName, columnNames, nodesRowValuesByColumnName))
  }

  // 5. drop materialized view
  await client.none(`DROP MATERIALIZED VIEW ${viewName}`)
}
