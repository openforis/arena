const db = require('../../../db/db')

const camelize = require('camelize')

const User = require('../../../../common/user/user')
const AuthGroups = require('../../../../common/auth/authGroups')

// in sql queries, user table must be surrounded by "" e.g. "user"

// CREATE

const insertUser = async (surveyId, uuid, email, client = db) =>
  await client.one(`
    INSERT INTO "user" (uuid, email, prefs)
    VALUES ($1, $2, $3::jsonb)
    RETURNING *`,
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
    SELECT u.*
    FROM "user" u
    JOIN survey s
    ON s.id = $1
    JOIN auth_group_user gu
    ON gu.user_uuid = u.uuid
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
    SELECT *
    FROM "user"
    WHERE uuid = $1`,
    [uuid],
    camelize)

const fetchUserByEmail = async (email, client = db) =>
  await client.oneOrNone(`
    SELECT *
    FROM "user"
    WHERE email = $1`,
    [email],
    camelize)

// ==== UPDATE

const updateUser = async (uuid, name, client = db) =>
  await client.one(`
    UPDATE "user"
    SET
    name = $1
    WHERE uuid = $2
    RETURNING *`,
    [name, uuid],
    camelize)

const updateUsername = async (user, name, client = db) =>
  await client.one(`
    UPDATE "user" 
    SET name = $1
    WHERE uuid = $2
    RETURNING *`,
    [name, User.getUuid(user)],
    camelize)

const updateUserPref = async (user, name, value, client = db) => {
  const userPref = JSON.stringify(
    { [name]: value }
  )

  const userRes = await client.one(`
    UPDATE "user"
    SET prefs = prefs || $1
    WHERE uuid = $2
    RETURNING *`,
    [userPref, User.getUuid(user)],
    camelize)

  return userRes
}

// ==== DELETE

const deleteUserPref = async (user, name, client = db) => {
  const userRes = await client.one(`
    UPDATE "user"
    SET prefs = prefs - $1
    WHERE uuid = $2
    RETURNING *`,
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

  // UPDATE
  updateUser,
  updateUsername,
  updateUserPref,

  // DELETE
  deleteUserPref,
}