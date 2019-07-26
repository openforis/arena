const db = require('../../../db/db')

const camelize = require('camelize')

const selectFields = ['id', 'name', 'email', 'prefs']
const selectFieldsCommaSep = selectFields.map(f => `u.${f}`).join(',')

// in sql queries, user table must be surrounded by "" e.g. "user"

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

const findUserByCognitoUsername = async (cognitoUsername, client = db) =>
  await client.oneOrNone(`
    SELECT ${selectFieldsCommaSep}
    FROM "user" u
    WHERE u.cognito_username = $1`,
    [cognitoUsername]
  )

// ==== UPDATE

const updateUserPref = async (user, name, value, client = db) => {
  const userPref = JSON.stringify(
    { [name]: value }
  )

  const userRes = await client.one(`
    UPDATE "user" u
    SET prefs = prefs || $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep}
  `, [userPref, user.id])

  return userRes
}

// ==== DELETE
const deleteUserPref = async (user, name, client = db) => {
  const userRes = await client.one(`
    UPDATE "user" u
    SET prefs = prefs - $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep}
  `, [name, user.id])

  return userRes
}

module.exports = {
  // READ
  countUsersBySurveyId,
  fetchUsersBySurveyId,
  findUserByCognitoUsername,

  // UPDATE
  updateUserPref,

  // DELETE
  deleteUserPref,
}