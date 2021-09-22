import { insertAllQuery } from '@server/db/dbUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as SurveySchemaRepository from '../../survey/repository/surveySchemaRepositoryUtils'

import * as DataTable from '../schemaRdb/dataTable'

const getSelectQuery = (surveySchema, nodeDef) => {
  const selectNodeRows = `
    SELECT
      n.id, n.uuid, n.node_def_uuid, n.record_uuid, n.parent_uuid, n.value, r.cycle AS record_cycle
    FROM
      ${surveySchema}.node n
    JOIN
      ${surveySchema}.record r 
    ON 
      r.uuid = n.record_uuid
    WHERE 
      n.node_def_uuid = $1
    ORDER BY n.id`

  return NodeDef.isEntity(nodeDef)
    ? `
      WITH n AS (${selectNodeRows})
      SELECT
        n.* ,
        c.children
      FROM
        n
      LEFT OUTER JOIN
        (
          SELECT
            c.parent_uuid,
            json_object_agg(c.node_def_uuid::text, json_build_object('uuid',c.uuid, 'nodeDefUuid', c.node_def_uuid,'value',c.value)) children
          FROM
            ${surveySchema}.node c
          WHERE
            c.parent_uuid in (select uuid from n)
          AND c.value IS NOT NULL
          GROUP BY
            c.parent_uuid ) c
      ON
        n.uuid = c.parent_uuid
      `
    : selectNodeRows
}

export const populateTable = async (survey, nodeDef, client) => {
  const surveyId = Survey.getId(survey)
  const surveySchema = SurveySchemaRepository.getSurveyDBSchema(surveyId)

  const nodeDefAncestorMultipleEntity = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefColumns = DataTable.getNodeDefColumns(survey, nodeDef)

  // 1. create materialized view
  const viewName = `${surveySchema}.m_view_data`
  const selectQuery = getSelectQuery(surveySchema, nodeDef)

  await client.none(`CREATE MATERIALIZED VIEW ${viewName} AS ${selectQuery}`, [nodeDefUuid])

  const { count } = await client.one(`SELECT count(id) FROM ${viewName}`)

  const limit = 5000
  const noIter = Math.ceil(count / limit)
  for (let i = 0; i < noIter; i++) {
    const offset = i * limit

    // 2. fetch nodes
    const nodes = await client.any(`select * from ${viewName} ORDER BY id OFFSET ${offset} LIMIT ${limit}  `)

    // 3. convert nodes into values
    const nodesRowValues = nodes.map((nodeRow) => DataTable.getRowValues(survey, nodeDef, nodeRow, nodeDefColumns))

    // 4. insert node values
    await client.none(
      insertAllQuery(
        SchemaRdb.getName(surveyId),
        NodeDefTable.getTableName(nodeDef, nodeDefAncestorMultipleEntity),
        DataTable.getColumnNames(survey, nodeDef),
        nodesRowValues
      )
    )
  }

  // 5. drop materialized view
  await client.none(`DROP MATERIALIZED VIEW ${viewName}`)
}
