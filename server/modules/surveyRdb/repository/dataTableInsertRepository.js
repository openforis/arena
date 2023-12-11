import { insertAllQuery } from '@server/db/dbUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as SurveySchemaRepository from '../../survey/repository/surveySchemaRepositoryUtils'

import * as DataTable from '../schemaRdb/dataTable'

const getSelectQuery = ({
  surveySchema,
  nodeDef,
  nodeDefContext,
  nodeDefAncestorMultipleEntity,
  nodeDefColumnsUuids,
}) => {
  const nodeAncestorEntityHierarchyIndex = nodeDefAncestorMultipleEntity
    ? NodeDef.getMetaHierarchy(nodeDefAncestorMultipleEntity).length
    : null
  const nodeAncestorUuidColumn =
    nodeAncestorEntityHierarchyIndex === null
      ? 'null'
      : `(n.meta -> '${Node.metaKeys.hierarchy}' ->> ${nodeAncestorEntityHierarchyIndex})::uuid`

  const selectNodeRows = `
    SELECT
      n.id, n.uuid, n.node_def_uuid, n.parent_uuid, n.value, 
      ${nodeAncestorUuidColumn} AS ancestor_uuid
      ${
        NodeDef.isRoot(nodeDef)
          ? `, n.record_uuid, 
      r.cycle AS record_cycle,
      r.step AS record_step,
      r.owner_uuid AS record_owner_uuid`
          : ''
      }
    FROM
      ${surveySchema}.node n
    JOIN
      ${surveySchema}.record r 
    ON 
      r.uuid = n.record_uuid
    WHERE 
      n.node_def_uuid = $1
    ORDER BY n.id`

  if (NodeDef.isAttribute(nodeDef)) {
    return selectNodeRows
  }

  // join node table with node table itself to get children attribute values

  const childrenAncestorEntityHierarchyIndex = NodeDef.getMetaHierarchy(nodeDefContext).length
  const childrenAncestorUuidColumn = `(c.meta -> '${Node.metaKeys.hierarchy}' ->> ${childrenAncestorEntityHierarchyIndex})::uuid`

  return `
      WITH n AS (${selectNodeRows})
      SELECT
        n.*,
        c.children
      FROM
        n
      LEFT OUTER JOIN
        (
          SELECT
            ${childrenAncestorUuidColumn} AS ancestor_uuid,
            json_object_agg(c.node_def_uuid::text, json_build_object(
                'uuid', c.uuid, 
                'nodeDefUuid', c.node_def_uuid, 
                'value', c.value
            )) AS children
          FROM
            ${surveySchema}.node c
          WHERE
            ${childrenAncestorUuidColumn} IN (SELECT uuid FROM n)
            ${nodeDefColumnsUuids.length > 0 ? 'AND c.node_def_uuid IN ($2:csv)' : ''}
            AND c.value IS NOT NULL
          GROUP BY
            ancestor_uuid
        ) c
      ON
        c.ancestor_uuid = n.uuid`
}

export const populateTable = async ({ survey, nodeDef, stopIfFunction = null }, client) => {
  const surveyId = Survey.getId(survey)
  const surveySchema = SurveySchemaRepository.getSurveyDBSchema(surveyId)
  const includeAnalysis = true

  const nodeDefAncestorMultipleEntity = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
  const nodeDefContext = NodeDef.isEntity(nodeDef) ? nodeDef : nodeDefAncestorMultipleEntity
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefColumns = DataTable.getNodeDefColumns({ survey, nodeDef, includeAnalysis })
  const nodeDefColumnsUuids = nodeDefColumns.map(NodeDef.getUuid)

  // 1. create materialized view
  const viewName = `${surveySchema}.m_view_data`
  const selectQuery = getSelectQuery({
    surveySchema,
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
    const nodesRowValues = nodes.map((nodeRow) => DataTable.getRowValues(survey, nodeDef, nodeRow, nodeDefColumns))

    // 4. insert node values
    await client.none(
      insertAllQuery(
        SchemaRdb.getName(surveyId),
        NodeDefTable.getTableName(nodeDef, nodeDefAncestorMultipleEntity),
        DataTable.getColumnNames({ survey, nodeDef, includeAnalysis }),
        nodesRowValues
      )
    )
  }

  // 5. drop materialized view
  await client.none(`DROP MATERIALIZED VIEW ${viewName}`)
}
