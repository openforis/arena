const { insertAllQuery } = require('../../../db/dbUtils')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')
const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')

const SurveySchemaRepository = require('../../survey/repository/surveySchemaRepositoryUtils')

const DataTable = require('../schemaRdb/dataTable')

const getNodesRowValues = (survey, nodeDefRow, nodeRows) => {
  const nodeDefColumns = DataTable.getNodeDefColumns(survey, nodeDefRow)

  return nodeRows.map(
    nodeRow => DataTable.getRowValues(survey, nodeDefRow, nodeRow, nodeDefColumns)
  )
}

const run = async (survey, nodeDef, client) => {

  const surveyId = Survey.getId(survey)
  const surveySchema = SurveySchemaRepository.getSurveyDBSchema(surveyId)

  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const { count } = await client.one(
    `SELECT count(*) FROM ${surveySchema}.node WHERE node_def_uuid = $1`,
    [nodeDefUuid]
  )

  const limit = 5000
  const noIter = Math.ceil(count / limit)
  for (let i = 0; i < noIter; i++) {
    const offset = i * limit

    const selectNodeRows = `
      SELECT
        n.uuid, n.node_def_uuid, n.record_uuid, n.parent_uuid, n.value
      FROM
        ${surveySchema}.node n
        WHERE n.node_def_uuid = $1
        ORDER BY n.id
        OFFSET ${offset} LIMIT ${limit}
    `
    const selectQuery = NodeDef.isEntity(nodeDef)
      ? `
        WITH
          n AS
          (${selectNodeRows})
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

    const nodes = await client.any(selectQuery, [nodeDefUuid])

    const nodesRowValues = getNodesRowValues(survey, nodeDef, nodes)

    await client.none(insertAllQuery(
      SchemaRdb.getName(surveyId),
      NodeDefTable.getTableName(nodeDef, nodeDefParent),
      DataTable.getColumnNames(survey, nodeDef),
      nodesRowValues
    ))

  }

}

module.exports = {
  run
}