import { Schemata } from '../../../../common/model/db'

import * as DB from '../../../db'
import { db } from '../../../db/db'
import * as DbUtils from '../../../db/dbUtils'

/**
 * @deprecated - Use DB.transformCallback instead.
 */
export const dbTransformCallback = DB.transformCallback

/**
 * @deprecated - This might not be needed anymore.
 */
export const getSurveyDBSchema = Schemata.getSchemaSurvey

// ====== UPDATE

// eslint-disable-next-line
/**
 * @deprecated - Implement it in survey repository.
 */
export const markSurveyDraft = async (surveyId, client = db) =>
  client.query(
    `UPDATE survey
    SET draft         = true,
        date_modified = ${DbUtils.now}
    WHERE id = $1`,
    [surveyId]
  )

export const publishSurveySchemaTableProps = async (surveyId, tableName, client = db) =>
  client.query(`
    UPDATE
      ${getSurveyDBSchema(surveyId)}.${tableName}
    SET
      props = props || props_draft,
      props_draft = '{}'::jsonb
  `)

export const unpublishSurveySchemaTableProps = async (surveyId, tableName, client = db) =>
  client.query(`
    UPDATE
      ${getSurveyDBSchema(surveyId)}.${tableName}
    SET
      props_draft = props || props_draft,
      props = '{}'::jsonb
  `)

export const updateSurveySchemaTableProp = async (surveyId, tableName, recordUuid, key, value, client = db) =>
  client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.${tableName}
     SET props_draft = props_draft || $1
     WHERE uuid = $2
     RETURNING *`,
    [JSON.stringify({ [key]: value }), recordUuid],
    (def) => dbTransformCallback(def, true)
  )

export const deleteSurveySchemaTableRecords = async (surveyId, tableName, recordUuids, client = db) =>
  client.map(
    `
    DELETE 
    FROM ${getSurveyDBSchema(surveyId)}.${tableName} 
    WHERE uuid IN ($1:csv) RETURNING *`,
    [recordUuids],
    (def) => dbTransformCallback(def, true)
  )

export const deleteSurveySchemaTableRecord = async (surveyId, tableName, recordUuid, client = db) => {
  const recordsDeleted = await deleteSurveySchemaTableRecords(surveyId, tableName, [recordUuid], client)
  return recordsDeleted[0]
}

export const deleteSurveySchemaTableProp = async (surveyId, tableName, deletePath, client = db) =>
  client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.${tableName} SET props = props #- '{${deletePath.join(',')}}'`)
