import * as R from 'ramda'
import camelize from 'camelize'

import { db } from '@server/db/db'
import * as DB from '@server/db'

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
      INSERT INTO survey (uuid, props, props_draft, owner_uuid, published, draft, template)
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

export const fetchUserSurveys = async (
  {
    user,
    draft = false,
    template = false,
    offset = 0,
    limit = null,
    sortBy = Survey.sortableKeys.dateModified,
    sortOrder = 'DESC',
  },
  client = db
) => {
  const checkAccess = !User.isSystemAdmin(user)
  const propsCol = draft ? '(s.props || s.props_draft)' : 's.props'

  const sortFieldBySortBy = {
    [Survey.sortableKeys.dateCreated]: 's.date_created',
    [Survey.sortableKeys.dateModified]: 's.date_modified',
    [Survey.sortableKeys.name]: `${propsCol} -> '${Survey.infoKeys.name}'`,
    [Survey.sortableKeys.ownerName]: 'owner_name',
    [Survey.sortableKeys.label]: `${propsCol} #>> '{${Survey.infoKeys.labels},lang_default}'`,
    [Survey.sortableKeys.status]: 'status',
  }
  const sortByField = sortFieldBySortBy[sortBy] || Survey.sortableKeys.dateModified

  return client.map(
    `
    SELECT ${surveySelectFields('s')},
      -- STATUS
      CASE
        WHEN s.published AND s.draft 
          THEN 'PUBLISHED-DRAFT'
        WHEN s.published 
          THEN 'PUBLISHED'
        WHEN s.draft 
          THEN 'DRAFT'
        ELSE 
          NULL
      END AS status,
      -- DEFAULT LANGUAGE
      ${propsCol} #>> '{${Survey.infoKeys.languages},0}' as lang_default,
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
    WHERE 
      -- if draft is false, fetch only published surveys
      ${draft ? '' : `s.props <> '{}'::jsonb AND `}
      (s.props || s.props_draft) ->> 'temporary' IS NULL 
      AND s.template = $2
    ORDER BY ${sortByField} ${sortOrder}
    LIMIT ${limit === null ? 'ALL' : limit}
    OFFSET ${offset}
  `,
    [User.getUuid(user), template],
    (def) => DB.transformCallback(def, true)
  )
}

export const countUserSurveys = async ({ user, template = false }, client = db) => {
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
    WHERE 
    (s.props || s.props_draft) ->> 'temporary' IS NULL 
    AND s.template = $2
    `,
    [User.getUuid(user), template]
  )
}

export const countOwnedSurveys = async ({ user }, client = db) =>
  client.one(
    `
    SELECT COUNT(*)
    FROM survey s
    WHERE s.owner_uuid = $1
    `,
    [User.getUuid(user)],
    (row) => Number(row.count)
  )

export const fetchSurveysByName = async (surveyName, client = db) =>
  client.map(
    `SELECT ${surveySelectFields()} FROM survey WHERE props->>'name' = $1 OR props_draft->>'name' = $1`,
    [surveyName],
    (def) => DB.transformCallback(def)
  )

export const fetchSurveyIdsAndNames = async (client = db) =>
  client.map(
    `SELECT 
      id, 
      published,
      props->>'${Survey.infoKeys.name}' AS name, 
      props->>'${Survey.infoKeys.collectUri}' AS collect_uri
    FROM survey 
    WHERE 
      props->>'${Survey.infoKeys.name}' IS NOT NULL
    UNION
    SELECT 
      id, 
      published,
      props_draft->>'${Survey.infoKeys.name}' AS name, 
      props_draft->>'${Survey.infoKeys.collectUri}' AS collect_uri
    FROM survey 
    WHERE 
      props_draft->>'${Survey.infoKeys.name}' IS NOT NULL`,
    [],
    camelize
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

export const fetchTemporarySurveyIds = async ({ olderThan24Hours = false } = {}, client = db) =>
  client.map(
    `SELECT id 
     FROM survey 
     WHERE (props || props_draft) ->> 'temporary' = 'true'
     ${olderThan24Hours ? "AND date_created <= NOW() - INTERVAL '24 HOURS'" : ''}
    `,
    [],
    R.prop('id')
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

export const removeSurveyTemporaryFlag = async ({ surveyId }, client = db) =>
  client.none(
    `
    UPDATE survey 
    SET 
       props = props - 'temporary',
       props_draft = props_draft - 'temporary'
    WHERE id = $1
    `,
    [surveyId]
  )

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
