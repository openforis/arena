import db from '../../../db/db';
import * as R from 'ramda';
import { dbTransformCallback, getSurveyDBSchema } from './surveySchemaRepositoryUtils';
import { selectDate } from '../../../db/dbUtils';
import User from '../../../../core/user/user';
import Survey from '../../../../core/survey/survey';
import NodeDef from '../../../../core/survey/nodeDef';

const surveySelectFields = (alias = '') => {
  const prefix = alias ? alias + '.' : ''
  return `${prefix}id, ${prefix}uuid, ${prefix}published, ${prefix}draft, ${prefix}props, ${prefix}props_draft, ${prefix}owner_uuid,
  ${selectDate(`${prefix}date_created`, 'date_created')},
  ${selectDate(`${prefix}date_modified`, 'date_modified')}`
}

// ============== CREATE

export const insertSurvey = async (survey, client: any = db) =>
  await client.one(`
      INSERT INTO survey (uuid, props_draft, owner_uuid)
      VALUES ($1, $2, $3)
      RETURNING ${surveySelectFields()}
    `,
    [Survey.getUuid(survey), survey.props, survey.ownerUuid],
    def => dbTransformCallback(def, true)
  )

// ============== READ

export const fetchAllSurveyIds = async (client: any = db) =>
  await client.map(`SELECT id FROM survey`, [], R.prop('id')) as Promise<any[]>

export const fetchUserSurveys = async (user, offset = 0, limit = null, client: any = db) => {
  const checkAccess = !User.isSystemAdmin(user)

  return await client.map(`
    SELECT ${surveySelectFields('s')}
      ${checkAccess ? `, json_build_array(row_to_json(g.*)) AS auth_groups` : ''}
    FROM survey s
    ${checkAccess ? `
    JOIN auth_group g
      ON s.uuid = g.survey_uuid
    JOIN auth_group_user gu
      ON gu.group_uuid = g.uuid AND gu.user_uuid = $1`
    :
    ''}
    ORDER BY s.date_modified DESC
    LIMIT ${limit ? limit : 'ALL'}
    OFFSET ${offset}
  `,
    [User.getUuid(user)],
    def => dbTransformCallback(def, true)
  ) as Promise<any[]>
}

export const countUserSurveys = async (user, client: any = db) => {
  const checkAccess = !User.isSystemAdmin(user)

  return await client.one(`
    SELECT count(s.id)
    FROM survey s
    ${checkAccess ? `
    JOIN auth_group g
      ON s.uuid = g.survey_uuid
    JOIN auth_group_user gu
      ON gu.group_uuid = g.uuid AND gu.user_uuid = $1`
    :
    ''}
    `,
    [User.getUuid(user)]
  )
}

export const fetchSurveysByName = async (surveyName, client: any = db) =>
  await client.map(
    `SELECT ${surveySelectFields()} FROM survey WHERE props->>'name' = $1 OR props_draft->>'name' = $1`,
    [surveyName],
    def => dbTransformCallback(def)
  )

export const fetchSurveyById = async (surveyId, draft = false, client: any = db) =>
  await client.one(
    `SELECT ${surveySelectFields()} FROM survey WHERE id = $1`,
    [surveyId],
    def => dbTransformCallback(def, draft)
  )

export const fetchDependencies = async (surveyId, client: any = db) =>
  await client.oneOrNone(
      `SELECT meta#>'{dependencyGraphs}' as dependencies FROM survey WHERE id = $1`,
    [surveyId],
    R.prop('dependencies')
  )

// ============== UPDATE
export const updateSurveyProp = async (surveyId, key, value, client: any = db) => {
  const prop = { [key]: value }

  return await client.one(`
    UPDATE survey
    SET props_draft = props_draft || $1,
    draft = true
    WHERE id = $2
    RETURNING ${surveySelectFields()}
  `, [JSON.stringify(prop), surveyId],
    def => dbTransformCallback(def, true)
  )
}

export const publishSurveyProps = async (surveyId, client: any = db) =>
  await client.one(`
    UPDATE
        survey
    SET
        props = props || props_draft,
        props_draft = '{}'::jsonb,
        draft = false,
        published = true
    WHERE
        id = $1
    RETURNING ${surveySelectFields()}
    `, [surveyId]
  )

export const updateSurveyDependencyGraphs = async (surveyId, dependencyGraphs, client: any = db) => {
  const meta = {
    dependencyGraphs
  }
  return await client.one(`
    UPDATE survey
    SET meta = meta || $1::jsonb
    WHERE id = $2
    RETURNING ${surveySelectFields()}
    `, [meta, surveyId]
  )
}

// ============== DELETE
export const deleteSurvey = async (id, client: any = db) =>
  await client.one(`DELETE FROM survey WHERE id = $1 RETURNING id`, [id])

export const deleteSurveyLabelsAndDescriptions = async (id, langCodes, client: any = db) => {
  const propsUpdateCond = R.pipe(
    R.map(langCode => `#-'{${NodeDef.propKeys.labels},${langCode}}' #-'{${NodeDef.propKeys.descriptions},${langCode}}'` ),
    R.join(' ')
  )(langCodes)

  await client.none(`
    UPDATE survey
    SET props = props ${propsUpdateCond}
    WHERE id = $1
  `,
    [id]
  )
}

export const dropSurveySchema = async (id, client: any = db) =>
  await client.query(`DROP SCHEMA IF EXISTS ${getSurveyDBSchema(id)} CASCADE`)

export default {
  // CREATE
  insertSurvey,

  // READ
  fetchAllSurveyIds,
  fetchUserSurveys,
  countUserSurveys,
  fetchSurveysByName,
  fetchSurveyById,
  fetchDependencies,

  //UPDATE
  updateSurveyProp,
  publishSurveyProps,
  updateSurveyDependencyGraphs,

  //DELETE
  deleteSurvey,
  deleteSurveyLabelsAndDescriptions,
  dropSurveySchema,
};
