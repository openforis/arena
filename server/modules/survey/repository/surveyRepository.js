import * as R from 'ramda'
import camelize from 'camelize'

import { db } from '@server/db/db'
import * as DB from '@server/db'

import { selectDate } from '@server/db/dbUtils'

import * as StringUtils from '@core/stringUtils'
import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { getSurveyDBSchema } from './surveySchemaRepositoryUtils'

const _getLabelColumn = (tableAlias) => {
  const prefix = tableAlias ? `${tableAlias}.` : ''
  return `COALESCE(${prefix}preferred_label, ${prefix}default_label)`
}

const _getSurveySelectFields = (alias = '') => {
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
      RETURNING ${_getSurveySelectFields()}
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

const _getSelectWhereCondition = ({ draft, search }) => {
  const propsCol = draft ? '(s.props || s.props_draft)' : 's.props'
  const labelCol = _getLabelColumn('s')

  return `${propsCol} ->> 'temporary' IS NULL 
      AND s.template = $/template/
      ${
        StringUtils.isNotBlank(search)
          ? `
          AND (
          s.name LIKE $/search/
          OR lower(${labelCol}) LIKE $/search/
          OR lower(s.owner_name) LIKE $/search/
      )`
          : ''
      }`
}

const _getSurveysSelectQuery = ({
  user,
  lang,
  draft = false,
  template = false,
  search = null,
  offset = 0,
  limit = null,
  sortBy = Survey.sortableKeys.dateModified,
  sortOrder = 'DESC',
}) => {
  const checkAccess = (!template || draft) && !User.isSystemAdmin(user)
  const propsCol = draft ? '(s.props || s.props_draft)' : 's.props'
  const labelCol = _getLabelColumn('s')

  const sortFieldBySortBy = {
    [Survey.sortableKeys.dateCreated]: 's.date_created',
    [Survey.sortableKeys.dateModified]: 's.date_modified',
    [Survey.sortableKeys.name]: 's.name',
    [Survey.sortableKeys.ownerName]: 's.owner_name',
    [Survey.sortableKeys.label]: labelCol,
    [Survey.sortableKeys.status]: 's.status',
  }
  const sortByField = sortFieldBySortBy[sortBy] || Survey.sortableKeys.dateModified

  return `
    WITH default_lang as (
      SELECT s.id, jsonb_array_elements(${propsCol} -> '${Survey.infoKeys.languages}') ->> 0 as lang 
      FROM survey s
    ),
    survey_view AS (
      SELECT s.*, 
        ${propsCol} ->> 'name' AS name, 
        ${propsCol} #>> '{${Survey.infoKeys.labels},${lang}}' AS preferred_label, 
        (${propsCol} -> '${Survey.infoKeys.labels}') ->> 
            (SELECT lang FROM default_lang WHERE default_lang.id = s.id LIMIT 1) as default_label,
        -- STATUS
        CASE
          WHEN s.published AND s.draft 
            THEN '${Survey.status.publishedDraft}'
          WHEN s.published 
            THEN '${Survey.status.published}'
          WHEN s.draft 
            THEN '${Survey.status.draft}'
          ELSE 
            NULL
        END AS status,
        u.name AS owner_name
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
          ON gu.group_uuid = g.uuid AND gu.user_uuid = $/userUuid/`
          : ''
      }
    )
    SELECT ${_getSurveySelectFields('s')}
      , s.name
      , s.default_label
      , s.preferred_label
      , ${labelCol} AS label
      , s.owner_name
      , s.status
      , ${labelCol} AS label
      , s.owner_name
      ${checkAccess ? ', s.auth_groups' : ''}
    FROM survey_view s
    WHERE 
      -- if draft is false, fetch only published surveys
      ${draft ? '' : `s.props <> '{}'::jsonb AND `}
      ${_getSelectWhereCondition({ draft, search })}
    ORDER BY ${sortByField} ${sortOrder}
    LIMIT ${limit === null ? 'ALL' : limit}
    OFFSET ${offset}
    `
}

export const fetchUserSurveys = async (
  {
    user,
    draft = false,
    template = false,
    offset = 0,
    limit = null,
    lang, // survey label preferred language
    search: searchParam = null,
    sortBy = Survey.sortableKeys.dateModified,
    sortOrder = 'DESC',
  },
  client = db
) => {
  const search = StringUtils.isNotBlank(searchParam) ? `%${searchParam.toLowerCase()}%` : null

  return client.map(
    _getSurveysSelectQuery({ user, draft, template, offset, limit, lang, search, sortBy, sortOrder }),
    { userUuid: User.getUuid(user), template, search },
    (def) => DB.transformCallback(def, true)
  )
}

export const countUserSurveys = async (
  { user, draft = false, template = false, search: searchParam = null, lang = null },
  client = db
) => {
  const search = StringUtils.isNotBlank(searchParam) ? `%${searchParam.toLowerCase()}%` : null

  return client.one(
    `
    SELECT COUNT(*)
    FROM (${_getSurveysSelectQuery({ user, draft, template, lang, search })}) AS s`,
    { search, template, userUuid: User.getUuid(user) },
    (row) => Number(row.count)
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
    `SELECT ${_getSurveySelectFields()} FROM survey WHERE props->>'name' = $1 OR props_draft->>'name' = $1`,
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
  client.one(`SELECT ${_getSurveySelectFields()} FROM survey WHERE id = $1`, [surveyId], (def) =>
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
    RETURNING ${_getSurveySelectFields()}
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

export const unpublishSurveyProps = async (surveyId, client = db) =>
  client.none(
    `
  UPDATE
      survey
  SET
      props_draft = props_draft || props,
      props = '{}'::jsonb,
      draft = true,
      published = false
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
    RETURNING ${_getSurveySelectFields()}
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
