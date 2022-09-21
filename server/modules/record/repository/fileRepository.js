import { db } from '@server/db/db'
import * as RecordFile from '@core/record/recordFile'

import { getSurveyDBSchema } from '../../survey/repository/surveySchemaRepositoryUtils'

const SUMMARY_FIELDS = ['id', 'uuid', 'props']
const SUMMARY_FIELDS_COMMA_SEPARATED = SUMMARY_FIELDS.join(', ')

const NOT_DELETED_CONDITION = `props ->> '${RecordFile.propKeys.deleted}' IS NULL OR props ->> '${RecordFile.propKeys.deleted}' <> 'true'`

// ============== CREATE

export const insertFile = async (surveyId, file, client = db) => {
  const { uuid, props, content } = file

  return client.one(
    `
    INSERT INTO ${getSurveyDBSchema(surveyId)}.file (uuid, props, content)
    VALUES ($1, $2, $3)
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
    [uuid, props, content]
  )
}

// ============== READ

export const fetchFileUuidsBySurveyId = async (surveyId, client = db) =>
  client.map(
    `
    SELECT uuid
    FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE ${NOT_DELETED_CONDITION}`,
    [],
    (row) => row.uuid
  )

export const fetchFileSummariesBySurveyId = async (surveyId, client) =>
  client.manyOrNone(
    `
    SELECT ${SUMMARY_FIELDS_COMMA_SEPARATED}
    FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE ${NOT_DELETED_CONDITION}`
  )

export const fetchFileByUuid = async (surveyId, uuid, client = db) =>
  client.one(
    `
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

export const fetchFileSummaryByUuid = async (surveyId, uuid, client = db) =>
  client.oneOrNone(
    `
    SELECT ${SUMMARY_FIELDS_COMMA_SEPARATED} 
    FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

export const fetchFileByNodeUuid = async (surveyId, nodeUuid, client = db) =>
  client.one(
    `
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE props ->> '${RecordFile.propKeys.nodeUuid}' = $1 
      AND ${NOT_DELETED_CONDITION}`,
    [nodeUuid]
  )

// ============== UPDATE
export const markFileAsDeleted = async (surveyId, uuid, client = db) =>
  client.one(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.file
    SET props = jsonb_set(props, '{${RecordFile.propKeys.deleted}}', 'true')
    WHERE uuid = $1
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
    [uuid]
  )

export const markRecordFilesAsDeleted = async (surveyId, recordUuid, client = db) =>
  client.manyOrNone(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.file
    SET props = jsonb_set(props, '{${RecordFile.propKeys.deleted}}', 'true')
    WHERE props ->> '${RecordFile.propKeys.recordUuid}' = $1 
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
    [recordUuid]
  )

export const updateFileProps = async (surveyId, fileUuid, props, client = db) =>
  client.one(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.file
    SET props = $2
    WHERE uuid = $1
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
    [fileUuid, props]
  )

// ============== DELETE
export const deleteFileByUuid = async (surveyId, uuid, client = db) =>
  client.query(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

export const deleteFilesByRecordUuids = async (surveyId, uuids, client = db) =>
  client.query(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE props ->> '${RecordFile.propKeys.recordUuid}' IN ($1:csv)`,
    [uuids]
  )
