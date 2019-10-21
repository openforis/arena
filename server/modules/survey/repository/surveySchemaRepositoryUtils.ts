import * as R from 'ramda';
import camelize from 'camelize';
import db from '../../../db/db';
import { now } from '../../../db/dbUtils';
import {SurveyId} from '../../../../core/survey/_survey/surveyInfo'

const mergeProps = (def, draft) => {
  const { props, propsDraft } = def

  const propsMerged = draft
    ? R.mergeRight(props, propsDraft)
    : props

  return R.pipe(
    R.assoc('props', propsMerged),
    R.dissoc('propsDraft'),
  )(def)
}

export const dbTransformCallback = (def, draft = false, assocPublishedDraft = false) => R.pipe(
  // assoc published and draft properties based on props
  def => assocPublishedDraft ? R.pipe(
    R.assoc('published', !R.isEmpty(def.props)),
    R.assoc('draft', !R.isEmpty(def.props_draft)),
    )(def)
    : def,
  camelize,
  // apply db conversion
  def => mergeProps(def, draft)
)(def)

export const getSurveyDBSchema = (surveyId: SurveyId) => `survey_${surveyId}`

// ====== UPDATE

export const markSurveyDraft = async (surveyId, client: any = db) =>
  await client.query(`
    UPDATE survey
    SET draft         = true,
        date_modified = ${now}
    WHERE id = $1
  `, [surveyId])

export const publishSurveySchemaTableProps = async (surveyId, tableName, client: any = db) =>
  await client.query(`
    UPDATE
      ${getSurveyDBSchema(surveyId)}.${tableName}
    SET
      props = props || props_draft,
      props_draft = '{}'::jsonb
  `)

export const updateSurveySchemaTableProp = async (surveyId, tableName, recordUuid, key, value, client: any = db) =>
  await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.${tableName}
     SET props_draft = props_draft || $1
     WHERE uuid = $2
     RETURNING *`
    , [JSON.stringify({ [key]: value }), recordUuid]
    , def => dbTransformCallback(def, true)
  )

export const deleteSurveySchemaTableRecord = async (surveyId, tableName, recordUuid, client: any = db) =>
  await client.one(`
    DELETE
    FROM ${getSurveyDBSchema(surveyId)}.${tableName}
    WHERE uuid = $1 RETURNING *`
    , [recordUuid]
    , def => dbTransformCallback(def, true)
  )

export const deleteSurveySchemaTableProp = async (surveyId, tableName, deletePath, client: any = db) =>
  await client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.${tableName} SET props = props #- '{${deletePath.join(',')}}'`)

export const disableSurveySchemaTableTriggers = async (surveyId, tableName, client: any = db) =>
  await client.none(`ALTER TABLE ${getSurveyDBSchema(surveyId)}.${tableName} DISABLE TRIGGER ALL`)

export const enableSurveySchemaTableTriggers = async (surveyId, tableName, client: any = db) =>
  await client.none(`ALTER TABLE ${getSurveyDBSchema(surveyId)}.${tableName} ENABLE TRIGGER ALL`)

export default {
  dbTransformCallback,

  getSurveyDBSchema,

  markSurveyDraft,
  publishSurveySchemaTableProps,

  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  deleteSurveySchemaTableProp,

  disableSurveySchemaTableTriggers,
  enableSurveySchemaTableTriggers
};
