const db = require('../../../db/db')

const selectFields = ['id', 'name', 'email', 'prefs']
const selectFieldsCommaSep = selectFields.join(',')

// in sql queries, user table must be surrounded by "" e.g. "user"

// ==== READ
const findUserById = async (userId, client = db) =>
  await client.one(`
    SELECT ${selectFieldsCommaSep} FROM "user" WHERE id = $1
  `,
    [userId]
  )

const findUserByEmail = async (email, client = db) =>
  await client.oneOrNone(`
    SELECT ${selectFieldsCommaSep}, password
    FROM "user" 
    WHERE LOWER(email) = LOWER($1)`,
    [email]
  )

const findUserByUsername = async (username, client = db) =>
  await client.oneOrNone(`
    SELECT ${selectFieldsCommaSep}
    FROM "user" 
    WHERE name = $1`,
    [username]
  )

  // ==== UPDATE

const updateUserPref = async (user, name, value, client = db) => {
  const userPref = JSON.stringify(
    {[name]: value}
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

// JWT tokens

const blacklistTokenByJti = async (jti, expiration, client = db) => {
  client.none(`
    INSERT INTO jwt_token_blacklist (jti, expiration)
    VALUES ($1, $2)
  `, [jti, expiration])
}

const findBlacklistedTokenByJti = async (jti, client = db) =>
  client.oneOrNone(`
    SELECT * FROM jwt_token_blacklist
    WHERE jti = $1
  `, [jti])

const deleteExpiredJwtTokens = async (timeSeconds, client = db) => {
  client.query(`
    DELETE FROM jwt_token_blacklist
    WHERE expiration < $1
  `, [timeSeconds]
  )
}

module.exports = {
  // READ
  findUserById,
  findUserByEmail,
  findUserByUsername,

  // UPDATE
  updateUserPref,

  // DELETE
  deleteUserPref,

  // JWT TOKENS
  blacklistTokenByJti,
  findBlacklistedTokenByJti,
  deleteExpiredJwtTokens,
}