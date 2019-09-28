const db = require('../../../db/db')

const camelize = require('camelize')

const User = require('../../../../common/user/user')
const AuthGroups = require('../../../../common/auth/authGroups')

const selectFields = ['uuid', 'name', 'email', 'prefs']
const selectFieldsCommaSep = selectFields.map(f => `u.${f}`).join(',')

// in sql queries, user table must be surrounded by "" e.g. "user"

// CREATE

const insertUser = async (surveyId, uuid, email, client = db) =>
  await client.one(`
    INSERT INTO "user" AS u (uuid, email, prefs)
    VALUES ($1, $2, $3::jsonb)
    RETURNING ${selectFieldsCommaSep}`,
    [uuid, email, { survey: surveyId }],
    camelize)

// READ

const countUsersBySurveyId = async (surveyId, countSystemAdmins = false, client = db) =>
  await client.one(`
    SELECT count(*)
    FROM "user" u
    JOIN survey s
    ON s.id = $1
    JOIN auth_group_user gu
    ON gu.user_uuid = u.uuid
    JOIN auth_group g
    ON g.uuid = gu.group_uuid
    AND (g.survey_uuid = s.uuid OR ($2 AND g.name = '${AuthGroups.groupNames.systemAdmin}'))`,
    [surveyId, countSystemAdmins])

const fetchUsersBySurveyId = async (surveyId, offset = 0, limit = null, fetchSystemAdmins = false, client = db) =>
  await client.map(`
    SELECT ${selectFieldsCommaSep}
    FROM "user" u
    JOIN survey s ON s.id = $1
    JOIN auth_group_user gu ON gu.user_uuid = u.uuid
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
      AND (g.survey_uuid = s.uuid OR ($2 AND g.name = '${AuthGroups.groupNames.systemAdmin}'))
    GROUP BY u.uuid, g.name
    ORDER BY u.name
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}`,
    [surveyId, fetchSystemAdmins],
    camelize)

const fetchUserByUuid = async (uuid, client = db) =>
  await client.one(`
    SELECT ${selectFieldsCommaSep}, u.profile_picture IS NOT NULL as has_profile_picture
    FROM "user" u
    WHERE u.uuid = $1`,
    [uuid],
    camelize)

const fetchUserByEmail = async (email, client = db) =>
  await client.oneOrNone(`
    SELECT ${selectFieldsCommaSep}
    FROM "user" u
    WHERE u.email = $1`,
    [email],
    camelize)

const fetchUserProfilePicture = async (uuid, client = db) =>
  await client.one(`
    SELECT profile_picture
    FROM "user"
    WHERE uuid = $1`,
    [uuid],
    row => row.profile_picture)

// ==== UPDATE

const updateUser = async (uuid, name, email, profilePicture, client = db) =>
  await client.one(`
    UPDATE "user" u
    SET
    name = $1,
    email = $2,
    profile_picture = COALESCE($3, profile_picture)
    WHERE u.uuid = $4
    RETURNING ${selectFieldsCommaSep}`,
    [name, email, profilePicture, uuid],
    camelize)

const updateUsername = async (user, name, client = db) =>
  await client.one(`
    UPDATE "user"  u
    SET name = $1
    WHERE u.uuid = $2
    RETURNING ${selectFieldsCommaSep}`,
    [name, User.getUuid(user)],
    camelize)

const updateUserPrefs = async (user, client = db) => await client.one(`
    UPDATE "user" u
    SET prefs = prefs || $1::jsonb
    WHERE u.uuid = $2
    RETURNING ${selectFieldsCommaSep}`,
  [User.getPrefs(user), User.getUuid(user)],
  camelize
)

//TODO - remove it
const updateUserPref = async (user, name, value, client = db) => {
  const userPref = JSON.stringify(
    { [name]: value }
  )

  const userRes = await client.one(`
    UPDATE "user" u
    SET prefs = prefs || $1
    WHERE u.uuid = $2
    RETURNING ${selectFieldsCommaSep}`,
    [userPref, User.getUuid(user)],
    camelize)

  return userRes
}

// ==== DELETE

const deleteUserPref = async (user, name, client = db) => {
  const userRes = await client.one(`
    UPDATE "user" u
    SET prefs = prefs - $1
    WHERE u.uuid = $2
    RETURNING ${selectFieldsCommaSep}`,
    [name, User.getUuid(user)],
    camelize)

  return userRes
}

module.exports = {
  // CREATE
  insertUser,

  // READ
  countUsersBySurveyId,
  fetchUsersBySurveyId,
  fetchUserByUuid,
  fetchUserByEmail,
  fetchUserProfilePicture,

  // UPDATE
  updateUser,
  updateUsername,
  updateUserPrefs,
  updateUserPref,

  // DELETE
  deleteUserPref,
}