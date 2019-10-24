const R = require('ramda')

const db = require('@server/db/db')
const DbUtils = require('@server/db/dbUtils')

const {
  getSurveyDBSchema,
  dbTransformCallback
} = require('../../survey/repository/surveySchemaRepositoryUtils')

const fetchItems = async (surveyId, client = db) =>
  await client.map(`
      SELECT * 
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
      ORDER BY id
    `,
    [],
    dbTransformCallback
  )

const countItems = async (surveyId, client = db) =>
  await client.one(`
      SELECT COUNT(*) as tot
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
    `,
    [],
    R.prop('tot')
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
        props = props || $2::jsonb,
        resolved = $3,
        date_modified = ${DbUtils.now}
      WHERE id = $1
      RETURNING *
    `,
    [itemId, props, resolved],
    dbTransformCallback
  )

module.exports = {
  // CREATE
  insertItem,

  // READ
  fetchItems,
  countItems,

  // UPDATE
  updateItem
}