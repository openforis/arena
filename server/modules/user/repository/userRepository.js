import { db } from '@server/db/db'

import * as camelize from 'camelize'

import * as User from '@core/user/user'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Survey from '@core/survey/survey'
import * as AuthGroup from '@core/auth/authGroup'

import * as DbUtils from '@server/db/dbUtils'

const selectFields = ['uuid', 'name', 'email', 'prefs', 'props', 'status']
const columnsCommaSeparated = selectFields.map((f) => `u.${f}`).join(',')

const userSortBy = {
  email: 'email',
  name: 'name',
  lastLoginTime: 'last_login_time',
  status: 'status',
}

const orderByFieldBySortBy = {
  [userSortBy.email]: 'email',
  [userSortBy.name]: 'name',
  [userSortBy.lastLoginTime]: 'status, last_login_time', // 'status' is used to group users that have accepted invitation, otherwise they have never logged in
  [userSortBy.status]: 'status',
}
// In sql queries, user table must be surrounded by "" e.g. "user"

// CREATE

export const importNewUser = async (
  { surveyId, surveyCycleKey, name, uuid, email, password, status, title, profilePicture },
  client = db
) =>
  client.one(
    `
    INSERT INTO "user" AS u (uuid, email, name, password, status, prefs, props, profile_picture)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
    RETURNING ${columnsCommaSeparated}`,
    [
      uuid,
      email,
      name,
      password,
      status,
      User.newPrefs({ surveyId, surveyCycleKey }),
      User.newProps({ title }),
      profilePicture,
    ],
    camelize
  )

export const insertUser = async (
  { email, password, status, surveyId = null, surveyCycleKey = null, title = null },
  client = db
) =>
  client.one(
    `
    INSERT INTO "user" AS u (email, password, status, prefs, props)
    VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
    RETURNING ${columnsCommaSeparated}`,
    [email, password, status, User.newPrefs({ surveyId, surveyCycleKey }), User.newProps({ title })],
    camelize
  )

// READ

export const countUsers = async (client = db) =>
  client.one(
    `
    SELECT count(*)
    FROM "user" u
    `,
    [],
    (row) => Number(row.count)
  )

export const countUsersBySurveyId = async (surveyId, countSystemAdmins = false, client = db) =>
  client.one(
    `
    SELECT count(*)
    FROM "user" u
    JOIN survey s
    ON s.id = $1
    JOIN auth_group_user gu
    ON gu.user_uuid = u.uuid
    JOIN auth_group g
    ON g.uuid = gu.group_uuid
    AND (g.survey_uuid = s.uuid OR ($2 AND g.name = '${AuthGroup.groupNames.systemAdmin}'))`,
    [surveyId, countSystemAdmins],
    (row) => Number(row.count)
  )

const _userSurveysSelect = `SELECT 
  gu.user_uuid AS user_uuid,
  STRING_AGG(
      (s.props || s.props_draft) ->> 'name' || ' (' || g.name || ')', 
      ', '
      ORDER BY s.props ->> 'name'
  ) AS surveys,
  MIN (ui.invited_date) AS invited_date
FROM survey s
  JOIN auth_group g ON g.survey_uuid = s.uuid
  JOIN auth_group_user gu ON g.uuid = gu.group_uuid
  LEFT JOIN user_invitation ui ON ui.survey_uuid = s.uuid AND ui.user_uuid = gu.user_uuid
GROUP BY gu.user_uuid`

const getUsersSelectQueryPrefix = ({ includeSurveys = false }) => `
  WITH us AS (
    SELECT DISTINCT ON (us.sess #>> '{passport,user}')
      (us.sess #>> '{passport,user}')::uuid AS user_uuid,
      (us.expire - interval '30 days') AS last_login_time
    FROM user_sessions us
    WHERE us.sess #>> '{passport,user}' IS NOT NULL
    ORDER BY us.sess #>> '{passport,user}', expire DESC
  )
  ${includeSurveys ? `, user_surveys AS (${_userSurveysSelect})` : ''}
  `

const _usersSelectQuery = ({
  selectFields,
  sortBy = userSortBy.email,
  sortOrder = 'ASC',
  includeSurveys = false,
  whereConditions = [],
}) => {
  // check sort by parameters
  const orderBy = orderByFieldBySortBy[sortBy] || 'email'
  const orderByDirection = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

  const whereClause = whereConditions?.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  return `${getUsersSelectQueryPrefix({ includeSurveys })}
    SELECT ${selectFields.join(', ')}, ${
      includeSurveys
        ? `user_surveys.surveys AS surveys, ${DbUtils.selectDate('user_surveys.invited_date', 'invited_date')}, `
        : ''
    }
      ${DbUtils.selectDate('us.last_login_time', 'last_login_time')},
      EXISTS (
        SELECT * 
          FROM auth_group_user 
          JOIN auth_group ON auth_group.uuid = auth_group_user.group_uuid 
        WHERE auth_group.name = '${AuthGroup.groupNames.systemAdmin}' 
          AND auth_group_user.user_uuid = u.uuid) 
      AS system_administrator,
      (
        SELECT uar.props ->> '${UserAccessRequest.keysProps.country}'
        FROM user_access_request uar
        WHERE uar.email = u.email
      ) AS country
    FROM "user" u
    ${includeSurveys ? `LEFT JOIN user_surveys ON user_surveys.user_uuid = u.uuid` : ''}
    LEFT OUTER JOIN us
      ON us.user_uuid = u.uuid
    ${whereClause}
    ORDER BY ${orderBy} ${orderByDirection}`
}

export const fetchUsers = async ({ offset = 0, limit = null, sortBy = 'email', sortOrder = 'ASC' }, client = db) =>
  client.map(
    `${_usersSelectQuery({ selectFields, sortBy, sortOrder })}
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}`,
    [],
    camelize
  )

export const fetchUsersIntoStream = async ({ transformer }, client = db) => {
  const select = _usersSelectQuery({
    selectFields: ['u.email', 'u.name', `u.props ->> '${User.keysProps.title}' AS title`, 'u.status'],
    includeSurveys: true,
  })
  const stream = new DbUtils.QueryStream(DbUtils.formatQuery(select, []))
  await client.stream(stream, (dbStream) => dbStream.pipe(transformer))
}

export const fetchUsersBySurveyId = async (surveyId, offset = 0, limit = null, isSystemAdmin = false, client = db) =>
  client.map(
    `${getUsersSelectQueryPrefix({ includeSurveys: false })}
    SELECT 
        ${columnsCommaSeparated},
        (SELECT iby.name FROM "user" iby WHERE ui.invited_by = iby.uuid) as invited_by,
        ui.invited_date,
        ${DbUtils.selectDate('us.last_login_time', 'last_login_time')}
    FROM "user" u
    JOIN survey s ON s.id = $1
    JOIN auth_group_user gu ON gu.user_uuid = u.uuid
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
      AND (g.survey_uuid = s.uuid OR ($2 AND g.name = '${AuthGroup.groupNames.systemAdmin}'))
    LEFT OUTER JOIN user_invitation ui
      ON u.uuid = ui.user_uuid
      AND s.uuid = ui.survey_uuid
      AND ui.removed_date is null
    LEFT OUTER JOIN us
      ON us.user_uuid = u.uuid
    GROUP BY u.uuid, g.name, ui.invited_by, ui.invited_date, us.last_login_time
    ORDER BY u.name
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}`,
    [surveyId, isSystemAdmin],
    camelize
  )

export const fetchActiveUserUuidsWithPreferredSurveyId = async ({ surveyId }, client = db) => {
  const surveyCurrentJsonbPath = `'{${User.keysPrefs.surveys},${User.keysPrefs.current}}'`

  return client.map(
    `SELECT uuid 
    FROM "user" u 
      JOIN user_sessions us
      ON (us.sess #>> '{passport,user}')::uuid = u.uuid
    WHERE prefs #>> ${surveyCurrentJsonbPath} = $1 
      -- fetch users with active sessions (interactions in the last hour)
      AND (us.expire - INTERVAL '30 days - 1 hour') > NOW() at time zone 'utc'
    GROUP BY uuid`,
    [surveyId],
    (row) => row.uuid
  )
}

export const fetchUserByUuidWithPassword = async (uuid, client = db) =>
  client.one(
    `
    SELECT ${columnsCommaSeparated}, u.profile_picture IS NOT NULL as has_profile_picture, u.password
    FROM "user" u
    WHERE u.uuid = $1`,
    [uuid],
    camelize
  )

export const fetchUserByUuid = async (uuid, client = db) =>
  client.oneOrNone(
    `
    SELECT ${columnsCommaSeparated}, u.profile_picture IS NOT NULL as has_profile_picture
    FROM "user" u
    WHERE u.uuid = $1`,
    [uuid],
    camelize
  )

export const fetchUserByEmail = async (email, client = db) =>
  client.oneOrNone(
    `
    SELECT ${columnsCommaSeparated}
    FROM "user" u
    WHERE u.email = $1`,
    [email],
    camelize
  )

export const fetchUserAndPasswordByEmail = async (email, client = db) =>
  client.oneOrNone(
    `
    SELECT ${columnsCommaSeparated}, password
    FROM "user" u
    WHERE u.email = $1`,
    [email],
    camelize
  )

export const fetchUserProfilePicture = async (uuid, client = db) =>
  client.one(
    `
    SELECT profile_picture
    FROM "user"
    WHERE uuid = $1`,
    [uuid],
    (row) => row.profile_picture
  )

export const fetchSystemAdministratorsEmail = async (client = db) =>
  client.map(
    `
    SELECT u.email 
    FROM "user" u 
    JOIN auth_group_user gu ON gu.user_uuid = u.uuid
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
    WHERE g.name = $1
  `,
    [AuthGroup.groupNames.systemAdmin],
    (row) => row.email
  )

export const countSystemAdministrators = async (client = db) =>
  client.one(
    `
    SELECT COUNT (*)
    FROM "user" u 
    JOIN auth_group_user gu ON gu.user_uuid = u.uuid
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
    WHERE g.name = $1
  `,
    [AuthGroup.groupNames.systemAdmin],
    (row) => Number(row.count)
  )

const _getActiveUsersSelectQuery = () =>
  _usersSelectQuery({
    selectFields,
    sortBy: userSortBy.lastLoginTime,
    sortOrder: 'DESC',
    whereConditions: [`last_login_time > NOW() - INTERVAL '1 hour'`],
  })

export const countActiveUsers = async (client = db) =>
  client.one(`SELECT COUNT(u.*) FROM (${_getActiveUsersSelectQuery()}) AS u`, [], (row) => Number(row.count))

export const fetchActiveUsers = async ({ limit = 100 } = {}, client = db) =>
  client.map(
    `${_getActiveUsersSelectQuery()}
    LIMIT $/limit/`,
    { limit },
    camelize
  )

// ==== UPDATE

export const updateUser = async ({ userUuid, name, email, profilePicture, props = {} }, client = db) =>
  client.one(
    `
    UPDATE "user" u
    SET
    name = $1,
    email = $2,
    profile_picture = COALESCE($3, profile_picture),
    props = $5::jsonb
    WHERE u.uuid = $4
    RETURNING ${columnsCommaSeparated}`,
    [name, email, profilePicture, userUuid, User.newProps({ ...props })],
    camelize
  )

export const updateNamePasswordAndStatus = async ({ userUuid, name, password, status, title }, client = db) =>
  client.one(
    `
    UPDATE "user" u
    SET name = $1, password = $2, status = $3, props = $5::jsonb
    WHERE u.uuid = $4
    RETURNING ${columnsCommaSeparated}`,
    [name, password, status, userUuid, User.newProps({ title })],
    camelize
  )

export const updatePassword = async ({ userUuid, password }, client = db) =>
  client.one(
    `
    UPDATE "user" u
    SET password = $2
    WHERE u.uuid = $1
    RETURNING ${columnsCommaSeparated}`,
    [userUuid, password],
    camelize
  )

// ==== PREFS

export const updateUserPrefs = async (user, client = db) =>
  client.one(
    `
    UPDATE "user" u
    SET prefs = prefs || $1::jsonb
    WHERE u.uuid = $2
    RETURNING ${columnsCommaSeparated}`,
    [User.getPrefs(user), User.getUuid(user)],
    camelize
  )

export const deleteUsersPrefsSurvey = async (surveyId, client = db) => {
  const surveyCurrentJsonbPath = `'{${User.keysPrefs.surveys},${User.keysPrefs.current}}'`
  // Remove from surveys current pref
  await client.query(
    `
    UPDATE "user"
    SET prefs = jsonb_set(prefs, ${surveyCurrentJsonbPath}, 'null')
    WHERE prefs #>> ${surveyCurrentJsonbPath} = $1
  `,
    [surveyId]
  )
  // Remove from surveys pref
  await client.query(`
    UPDATE "user"
    SET prefs = prefs #- '{${User.keysPrefs.surveys},${surveyId}}'
`)
}

/**.
 * Sets survey cycle user pref to Survey.cycleOneKey if the preferred cycle is among the specified (deleted) ones
 *
 * @param surveyId
 * @param cycleKeysDeleted
 * @param client
 */
export const resetUsersPrefsSurveyCycle = async (surveyId, cycleKeysDeleted, client = db) => {
  const surveyCyclePath = `'{${User.keysPrefs.surveys},${surveyId},${User.keysSurveyPrefs.cycle}}'`
  await client.query(
    `
      UPDATE "user" u
      SET prefs = jsonb_set(prefs, ${surveyCyclePath}, '"${Survey.cycleOneKey}"')
      WHERE prefs #>>  ${surveyCyclePath} IN ($1:csv)
    `,
    [cycleKeysDeleted]
  )
}
