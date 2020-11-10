import { db } from '@server/db/db'

import * as camelize from 'camelize'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as AuthGroup from '@core/auth/authGroup'

const selectFields = ['uuid', 'name', 'email', 'prefs', 'props', 'status']
const selectFieldsCommaSep = selectFields.map(f => `u.${f}`).join(',')

// In sql queries, user table must be surrounded by "" e.g. "user"

// CREATE

export const insertUser = async (surveyId, surveyCycleKey, email, password, status, client = db) =>
  await client.one(
    `
    INSERT INTO "user" AS u (email, password, status, prefs)
    VALUES ($1, $2, $3, $4::jsonb)
    RETURNING ${selectFieldsCommaSep}`,
    [email, password, status, User.newPrefs(surveyId, surveyCycleKey)],
    camelize,
  )

// READ

export const countUsersBySurveyId = async (surveyId, countSystemAdmins = false, client = db) =>
  await client.one(
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
  )

export const fetchUsersBySurveyId = async (
  surveyId,
  offset = 0,
  limit = null,
  fetchSystemAdmins = false,
  client = db,
) =>
  await client.map(
    `
    SELECT ${selectFieldsCommaSep}
    FROM "user" u
    JOIN survey s ON s.id = $1
    JOIN auth_group_user gu ON gu.user_uuid = u.uuid
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
      AND (g.survey_uuid = s.uuid OR ($2 AND g.name = '${AuthGroup.groupNames.systemAdmin}'))
    GROUP BY u.uuid, g.name
    ORDER BY u.name
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}`,
    [surveyId, fetchSystemAdmins],
    camelize,
  )

export const fetchUserByUuid = async (uuid, client = db) =>
  await client.one(
    `
    SELECT ${selectFieldsCommaSep}, u.profile_picture IS NOT NULL as has_profile_picture
    FROM "user" u
    WHERE u.uuid = $1`,
    [uuid],
    camelize,
  )

export const fetchUserByEmail = async (email, client = db) =>
  await client.oneOrNone(
    `
    SELECT ${selectFieldsCommaSep}
    FROM "user" u
    WHERE u.email = $1`,
    [email],
    camelize,
  )

export const fetchUserAndPasswordByEmail = async (email, client = db) =>
  await client.oneOrNone(
    `
    SELECT ${selectFieldsCommaSep}, password
    FROM "user" u
    WHERE u.email = $1`,
    [email],
    camelize,
  )

export const fetchUserProfilePicture = async (uuid, client = db) =>
  await client.one(
    `
    SELECT profile_picture
    FROM "user"
    WHERE uuid = $1`,
    [uuid],
    row => row.profile_picture,
  )

// ==== UPDATE

export const updateUser = async (uuid, name, email, profilePicture, props, client = db) =>
  await client.one(
    `
    UPDATE "user" u
    SET
    name = $1,
    email = $2,
    profile_picture = COALESCE($3, profile_picture),
    props = props || $5::jsonb
    WHERE u.uuid = $4
    RETURNING ${selectFieldsCommaSep}`,
    [name, email, profilePicture, uuid, props],
    camelize,
  )

export const updateNamePasswordAndStatus = async (userUuid, name, password, status, client = db) =>
  await client.one(
    `
    UPDATE "user" u
    SET name = $1, password = $2, status = $3
    WHERE u.uuid = $4
    RETURNING ${selectFieldsCommaSep}`,
    [name, password, status, userUuid],
    camelize,
  )

// ==== PREFS

export const updateUserPrefs = async (user, client = db) =>
  await client.one(
    `
    UPDATE "user" u
    SET prefs = prefs || $1::jsonb
    WHERE u.uuid = $2
    RETURNING ${selectFieldsCommaSep}`,
    [User.getPrefs(user), User.getUuid(user)],
    camelize,
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
    [surveyId],
  )
  // Remove from surveys pref
  await client.query(`
    UPDATE "user"
    SET prefs = prefs #- '{${User.keysPrefs.surveys},${surveyId}}'
`)
}

/**
 * Sets survey cycle user pref to Survey.cycleOneKey if the preferred cycle is among the specified (deleted) ones
 */
export const resetUsersPrefsSurveyCycle = async (surveyId, cycleKeysDeleted, client = db) => {
  const surveyCyclePath = `'{${User.keysPrefs.surveys},${surveyId},${User.keysPrefs.cycle}}'`
  await client.query(
    `
      UPDATE "user" u
      SET prefs = jsonb_set(prefs, ${surveyCyclePath}, '"${Survey.cycleOneKey}"')
      WHERE prefs #>>  ${surveyCyclePath} IN ($1:csv)
    `,
    [cycleKeysDeleted],
  )
}
