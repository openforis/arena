const db = require('../../../db/db')

const RecordFile = require('../../../../core/record/recordFile')

const { getSurveyDBSchema } = require('../../survey/repository/surveySchemaRepositoryUtils')

// ============== CREATE

const insertFile = async (surveyId, file, client = db) => {
  const { uuid, props, content } = file

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

const fetchFileByNodeUuid = async (surveyId, nodeUuid, client = db) =>
  await client.one(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE props ->> '${RecordFile.propKeys.nodeUuid}' = $1`,
    [nodeUuid]
  )

// ============== DELETE
const deleteFileByUuid = async (surveyId, uuid, client = db) =>
  await client.query(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

const deleteFilesByRecordUuids = async (surveyId, uuids, client = db) =>
  await client.query(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE props ->> '${RecordFile.propKeys.recordUuid}' IN ($1:csv)`,
    [uuids]
  )

module.exports = {
  //CREATE
  insertFile,

  //READ
  fetchFileByUuid,
  fetchFileByNodeUuid,

  //DELETE
  deleteFileByUuid,
  deleteFilesByRecordUuids
}