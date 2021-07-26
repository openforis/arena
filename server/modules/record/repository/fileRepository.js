import * as camelize from 'camelize'

import { db } from '@server/db/db'
import * as RecordFile from '@core/record/recordFile'

import { getSurveyDBSchema } from '../../survey/repository/surveySchemaRepositoryUtils'

// ============== CREATE

export const insertFile = async (surveyId, file, client = db) => {
  const { uuid, props, content } = file

  return client.one(
    `
    INSERT INTO ${getSurveyDBSchema(surveyId)}.file (uuid, props, content)
    VALUES ($1, $2, $3)
    RETURNING id, uuid, props`,
    [uuid, props, content]
  )
}

// ============== READ

export const fetchFileUuidsBySurveyId = async (surveyId, client = db) =>
  client.map(
    `
    SELECT uuid FROM ${getSurveyDBSchema(surveyId)}.file`,
    [],
    (row) => row.uuid
  )

export const fetchFileByUuid = async (surveyId, uuid, client = db) =>
  client.one(
    `
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

export const fetchFileByNodeUuid = async (surveyId, nodeUuid, client = db) =>
  client.one(
    `
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.file
    WHERE props ->> '${RecordFile.propKeys.nodeUuid}' = $1`,
    [nodeUuid]
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
