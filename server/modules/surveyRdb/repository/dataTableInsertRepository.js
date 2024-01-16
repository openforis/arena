import { insertAllQuery } from '@server/db/dbUtils'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as SurveySchemaRepository from '../../survey/repository/surveySchemaRepositoryUtils'
import * as NodeRepository from '@server/modules/record/repository/nodeRepository'

import * as DataTable from '../schemaRdb/dataTable'

const getSelectQuery = ({ surveyId, nodeDef, nodeDefContext, nodeDefAncestorMultipleEntity, nodeDefColumnsUuids }) => {
  const nodesSelect = `${NodeRepository.getNodeSelectQuery({
    surveyId,
    includeRefData: true,
    excludeRecordUuid: false,
    ancestorDef: nodeDefAncestorMultipleEntity,
  })}
    WHERE n.node_def_uuid = $1
    ORDER BY n.id`

  if (NodeDef.isAttribute(nodeDef)) {
    return nodesSelect
  }

  const childrenNodesSelect = NodeRepository.getNodeSelectQuery({
    surveyId,
    includeRefData: true,
    excludeRecordUuid: false,
    ancestorDef: nodeDefContext,
  })
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
                'uuid', c.uuid, 
                'nodeDefUuid', c.node_def_uuid, 
                'value', c.value,
                'refData', c.ref_data
            )) AS children
          FROM c
          WHERE
            c.ancestor_uuid IN (SELECT uuid FROM n)
            ${nodeDefColumnsUuids.length > 0 ? 'AND c.node_def_uuid IN ($2:csv)' : ''}
            AND c.value IS NOT NULL
          GROUP BY
            c.ancestor_uuid
        ) c
      ON
        c.ancestor_uuid = n.uuid`
}

const selectQueryCallback = (row) => ({
  // camelize everything but "children" because it is an object indexed by uuid and the uuid itself would be camelized
  ...A.camelizePartial({ skip: ['children'] })(row),
  children: Object.entries(row.children ?? {}).reduce((acc, [childDefUuid, childNode]) => {
    acc[childDefUuid] = A.camelize(childNode)
    return acc
  }, {}),
})

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
    const nodes = await client.map(
      `SELECT * FROM ${viewName} 
      ORDER BY id 
      OFFSET ${offset} 
      LIMIT ${limit}`,
      [],
      selectQueryCallback
    )

    if (stopIfFunction?.()) {
      break
    }
    // 3. convert nodes into values
    const nodesRowValues = nodes.map((nodeRow) => DataTable.getRowValues({ survey, nodeDef, nodeRow, nodeDefColumns }))

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
