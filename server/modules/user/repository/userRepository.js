const db = require('../../../db/db')

const camelize = require('camelize')

const selectFields = ['id', 'name', 'email', 'prefs']
const selectFieldsCommaSep = (prefix = '') => selectFields.map(f => prefix + f).join(',')

// in sql queries, user table must be surrounded by "" e.g. "user"

// CREATE

const insertUser = async (surveyId, email, group, client = db) =>
  await client.one(`
    INSERT INTO "user" (name, email, prefs)
    VALUES ($1, $2, $3::jsonb)
    RETURNING ${selectFieldsCommaSep()}`,
    ['name!', email, { surveyId }])

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
    SELECT ${selectFieldsCommaSep('u.')}, u.cognito_username, g.name AS group_name
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

const findUserByCognitoUsername = async (cognitoUsername, client = db) =>
  await client.oneOrNone(`
    SELECT ${selectFieldsCommaSep()}
    FROM "user"
    WHERE cognito_username = $1`,
    [cognitoUsername]
  )

// ==== UPDATE

const updateUserPref = async (user, name, value, client = db) => {
  const userPref = JSON.stringify(
    { [name]: value }
  )

  const userRes = await client.one(`
    UPDATE "user"
    SET prefs = prefs || $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep()}
  `, [userPref, user.id])

  return userRes
}

// ==== DELETE
const deleteUserPref = async (user, name, client = db) => {
  const userRes = await client.one(`
    UPDATE "user"
    SET prefs = prefs - $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep()}
  `, [name, user.id])

  return userRes
}

module.exports = {
  // CREATE
  insertUser,

  // READ
  countUsersBySurveyId,
  fetchUsersBySurveyId,
  findUserByCognitoUsername,

  // UPDATE
  updateUserPref,

  // DELETE
  deleteUserPref,
}