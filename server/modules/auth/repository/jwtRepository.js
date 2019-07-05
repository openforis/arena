const db = require('../../../db/db')

const blacklistToken = async (token, expiration, client = db) => {
  client.none(`
    INSERT INTO jwt_token_blacklist (token, expiration)
    VALUES ($1, $2)
  `, [token, expiration])
}

const findBlacklistedToken = async (token, client = db) =>
  client.oneOrNone(`
    SELECT * FROM jwt_token_blacklist
    WHERE token = $1
  `, [token])

const deleteExpiredJwtTokens = async (seconds, client = db) => {
  client.query(`
    DELETE FROM jwt_token_blacklist
    WHERE expiration < $1
  `, [seconds]
  )
}

module.exports = {
  blacklistToken,
  findBlacklistedToken,
  deleteExpiredJwtTokens,
}