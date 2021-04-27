import { db } from '@server/db/db'
import * as DB from '@server/db'
import * as R from 'ramda'

import { selectDate } from '@server/db/dbUtils'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { getSurveyDBSchema } from './surveySchemaRepositoryUtils'

const surveySelectFields = (alias = '') => {
  const prefix = alias ? `${alias}.` : ''
  const columns = ['id', 'uuid', 'published', 'draft', 'props', 'props_draft', 'owner_uuid', 'template']
  return [
    ...columns.map((c) => `${prefix}${c}`),
    selectDate(`${prefix}date_created`, 'date_created'),
    selectDate(`${prefix}date_modified`, 'date_modified'),
  ].join(', ')
}

// ============== CREATE

export const insertSurvey = async ({ survey, props = {}, propsDraft = {} }, client = db) =>
  client.one(
    `
      INSERT INTO survey (uuid, props, props_draft, owner_uuid, published, draft, template )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${surveySelectFields()}
    `,
    [
      Survey.getUuid(survey),
      props,
      propsDraft,
      survey.ownerUuid,
      Survey.isPublished(survey),
      Survey.isDraft(survey),
      Survey.isTemplate(survey),
    ],
    (def) => DB.transformCallback(def, true)
  )

// ============== READ

export const fetchAllSurveyIds = async (client = db) => client.map('SELECT id FROM survey', [], R.prop('id'))

export const fetchUserSurveys = async ({ user, offset = 0, limit = null, template = false }, client = db) => {
  const checkAccess = !User.isSystemAdmin(user)

  return client.map(
    `
    SELECT ${surveySelectFields('s')},
    u.name as owner_name
      ${checkAccess ? ', json_build_array(row_to_json(g.*)) AS auth_groups' : ''}
    FROM survey s
    JOIN "user" u 
    ON u.uuid = s.owner_uuid
    ${
      checkAccess
        ? `
    JOIN auth_group g
      ON s.uuid = g.survey_uuid
    JOIN auth_group_user gu
      ON gu.group_uuid = g.uuid AND gu.user_uuid = $1`
        : ''
    }
    WHERE s.template = $2
    ORDER BY s.date_modified DESC
    LIMIT ${limit === null ? 'ALL' : limit}
    OFFSET ${offset}
  `,
    [User.getUuid(user), template],
    (def) => DB.transformCallback(def, true)
  )
}

export const countUserSurveys = async (user, client = db) => {
  const checkAccess = !User.isSystemAdmin(user)

  return client.one(
    `
    SELECT count(s.id)
    FROM survey s
    ${
      checkAccess
        ? `
    JOIN auth_group g
      ON s.uuid = g.survey_uuid
    JOIN auth_group_user gu
      ON gu.group_uuid = g.uuid AND gu.user_uuid = $1`
        : ''
    }
    `,
    [User.getUuid(user)]
  )
}

export const fetchSurveysByName = async (surveyName, client = db) =>
  client.map(
    `SELECT ${surveySelectFields()} FROM survey WHERE props->>'name' = $1 OR props_draft->>'name' = $1`,
    [surveyName],
    (def) => DB.transformCallback(def)
  )

export const fetchSurveyById = async ({ surveyId, draft = false, backup = false }, client = db) =>
  client.one(`SELECT ${surveySelectFields()} FROM survey WHERE id = $1`, [surveyId], (def) =>
    DB.transformCallback(def, draft, false, backup)
  )

export const fetchDependencies = async (surveyId, client = db) =>
  client.oneOrNone(
    "SELECT meta#>'{dependencyGraphs}' as dependencies FROM survey WHERE id = $1",
    [surveyId],
    R.prop('dependencies')
  )

// ============== UPDATE
export const updateSurveyProp = async (surveyId, key, value, client = db) => {
  const prop = { [key]: value }

  return client.one(
    `
    UPDATE survey
    SET props_draft = props_draft || $1,
    draft = true
    WHERE id = $2
    RETURNING ${surveySelectFields()}
  `,
    [JSON.stringify(prop), surveyId],
    (def) => DB.transformCallback(def, true)
  )
}

export const publishSurveyProps = async (surveyId, client = db) =>
  client.none(
    `
    UPDATE
        survey
    SET
        props = props || props_draft,
        props_draft = '{}'::jsonb,
        draft = false,
        published = true
    WHERE
        id = $1
    `,
    [surveyId]
  )

export const updateSurveyDependencyGraphs = async (surveyId, dependencyGraphs, client = db) => {
  const meta = {
    dependencyGraphs,
  }
  return client.one(
    `
    UPDATE survey
    SET meta = meta || $1::jsonb
    WHERE id = $2
    RETURNING ${surveySelectFields()}
    `,
    [meta, surveyId]
  )
}

// ============== DELETE
export const deleteSurvey = async (id, client = db) => client.one('DELETE FROM survey WHERE id = $1 RETURNING id', [id])

export const deleteSurveyLabelsAndDescriptions = async (id, langCodes, client = db) => {
  const propsUpdateCond = R.pipe(
    R.map(
      (langCode) => `#-'{${NodeDef.propKeys.labels},${langCode}}' #-'{${NodeDef.propKeys.descriptions},${langCode}}'`
    ),
    R.join(' ')
  )(langCodes)

  await client.none(
    `
    UPDATE survey 
    SET props = props ${propsUpdateCond}
    WHERE id = $1
  `,
    [id]
  )
}

export const dropSurveySchema = async (id, client = db) =>
  client.query(`DROP SCHEMA IF EXISTS ${getSurveyDBSchema(id)} CASCADE`)
