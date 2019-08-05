const db = require('../../../db/db')

const camelize = require('camelize')

const User = require('../../../../common/user/user')

const selectFields = ['id', 'name', 'email', 'prefs']
const selectFieldsCommaSep = selectFields.map(f => `u.${f}`).join(',')

// in sql queries, user table must be surrounded by "" e.g. "user"

// CREATE

const insertUser = async (surveyId, cognitoUsername, email, client = db) =>
  await client.one(`
    INSERT INTO "user" AS u (cognito_username, email, prefs)
    VALUES ($1, $2, $3::jsonb)
    RETURNING ${selectFieldsCommaSep}`,
    [cognitoUsername, email, { survey: surveyId }])

// READ

const countUsersBySurveyId = async (surveyId, client = db) =>
  await client.one(`
    SELECT count(*)
    FROM "user" u
    JOIN auth_group_user gu ON gu.user_id = u.id
    JOIN auth_group g on g.id = gu.group_id AND g.survey_id = $1`,
    [surveyId]
  )

const fetchUsersBySurveyId = async (surveyId, offset = 0, limit = null, client = db) =>
  await client.map(`
    SELECT ${selectFieldsCommaSep}, u.cognito_username, g.name AS group_name
    FROM "user" u
    JOIN auth_group_user gu ON gu.user_id = u.id
    JOIN auth_group g on g.id = gu.group_id AND g.survey_id = $1
    GROUP BY u.id, g.name
    ORDER BY u.id
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}`,
    [surveyId],
    camelize
  )

const fetchUserByCognitoUsername = async (cognitoUsername, client = db) =>
  await client.oneOrNone(`
    SELECT ${selectFieldsCommaSep}
    FROM "user" u
    WHERE u.cognito_username = $1`,
    [cognitoUsername]
  )

const fetchUserByEmail = async (email, client = db) =>
  await client.oneOrNone(`
    SELECT ${selectFieldsCommaSep}
    FROM "user" u
    WHERE u.email = $1`,
    [email])

// ==== UPDATE

const updateUsername = async (user, name, client = db) =>
  client.one(`
    UPDATE "user"  u
    SET name = $1
    WHERE u.id = $2
    RETURNING ${selectFieldsCommaSep}`,
    [name, User.getId(user)])

const updateUserPref = async (user, name, value, client = db) => {
  const userPref = JSON.stringify(
    { [name]: value }
  )

  const userRes = await client.one(`
    UPDATE "user" u
    SET prefs = prefs || $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep}
  `, [userPref, User.getId(user)])

  return userRes
}

// ==== DELETE

const deleteUserPref = async (user, name, client = db) => {
  const userRes = await client.one(`
    UPDATE "user" u
    SET prefs = prefs - $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep}
  `, [name, User.getId(user)])

  return userRes
}

module.exports = {
  // CREATE
  insertUser,

  // READ
  countUsersBySurveyId,
  fetchUsersBySurveyId,
  fetchUserByCognitoUsername,
  fetchUserByEmail,

  // UPDATE
  updateUsername,
  updateUserPref,

  // DELETE
  deleteUserPref,
}