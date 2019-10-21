import db from '../../../db/db';
import RecordFile from '../../../../core/record/recordFile';
import { getSurveyDBSchema } from '../../survey/repository/surveySchemaRepositoryUtils';

// ============== CREATE

const insertFile = async (surveyId, file, client: any = db) => {
  const { uuid, props, content } = file

  return await client.one(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.file (uuid, props, content)
    VALUES ($1, $2, $3)
    RETURNING id, uuid, props`,
    [uuid, props, content],
  )
}

// ============== READ

const fetchFileByUuid = async (surveyId, uuid, client: any = db) =>
  await client.one(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

const fetchFileByNodeUuid = async (surveyId, nodeUuid, client: any = db) =>
  await client.one(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE props ->> '${RecordFile.propKeys.nodeUuid}' = $1`,
    [nodeUuid]
  )

// ============== DELETE
const deleteFileByUuid = async (surveyId, uuid, client: any = db) =>
  await client.query(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

const deleteFilesByRecordUuids = async (surveyId, uuids, client: any = db) =>
  await client.query(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE props ->> '${RecordFile.propKeys.recordUuid}' IN ($1:csv)`,
    [uuids]
  )

export default {
  //CREATE
  insertFile,

  //READ
  fetchFileByUuid,
  fetchFileByNodeUuid,

  //DELETE
  deleteFileByUuid,
  deleteFilesByRecordUuids
};
