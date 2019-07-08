const db = require('../../../db/db')

const selectFields = ['id', 'name', 'email', 'prefs']
const selectFieldsCommaSep = selectFields.join(',')

// in sql queries, user table must be surrounded by "" e.g. "user"

const findUserByCognitoUsername = async (cognitoUsername, client = db) =>
  await client.oneOrNone(`
    SELECT ${selectFieldsCommaSep}
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
    RETURNING ${selectFieldsCommaSep}
  `, [userPref, user.id])

  return userRes
}

// ==== DELETE
const deleteUserPref = async (user, name, client = db) => {
  const userRes = await client.one(`
    UPDATE "user" 
    SET prefs = prefs - $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep}
  `, [name, user.id])

  return userRes
}

module.exports = {
  // READ
  findUserByCognitoUsername,

  // UPDATE
  updateUserPref,

  // DELETE
  deleteUserPref,
}