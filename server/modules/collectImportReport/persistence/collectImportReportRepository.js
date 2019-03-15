const db = require('../../../db/db')
const DbUtils = require('../../../db/dbUtils')

const {
  getSurveyDBSchema,
  dbTransformCallback
} = require('../../survey/persistence/surveySchemaRepositoryUtils')

const fetchItems = async (surveyId, client = db) =>
  await client.map(`
      SELECT * 
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
      ORDER BY id
    `,
    [],
    dbTransformCallback
  )

const insertItem = async (surveyId, nodeDefUuid, props, client = db) =>
  await client.one(`
      INSERT INTO ${getSurveyDBSchema(surveyId)}.collect_import_report (node_def_uuid, props)
      VALUES ($1, $2)
      RETURNING *
    `,
    [nodeDefUuid, props],
    dbTransformCallback
  )

const updateItem = async (surveyId, itemId, props, resolved, client = db) =>
  await client.one(`
      UPDATE ${getSurveyDBSchema(surveyId)}.collect_import_report
      SET 
        props = props | $2
        resolved = $3,
        date_modified = ${DbUtils.now}
      WHERE id = $3
      RETURNING *
    `,
    [itemId, props, resolved],
    dbTransformCallback
  )

module.exports = {
  insertItem,

  fetchItems,

  updateItem
}