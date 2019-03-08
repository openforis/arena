const db = require('../../../db/db')

const {getSurveyDBSchema} = require('../../../survey/surveySchemaRepositoryUtils')

// ============== CREATE

const insertFile = async (surveyId, file, client = db) => {
  const {uuid, props, content} = file

  return await client.one(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.file (uuid, props, content)
    VALUES ($1, $2, $3)
    RETURNING id, uuid, props`,
    [uuid, props, content],
  )
}

// ============== READ

const fetchFileByUuid = async (surveyId, uuid, client = db) =>
  await client.one(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

// ============== DELETE
const deleteFileByUuid = async (surveyId, uuid, client = db) =>
  await client.query(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )


module.exports = {
  //CREATE
  insertFile,

  //READ
  fetchFileByUuid,

  //DELETE
  deleteFileByUuid
}