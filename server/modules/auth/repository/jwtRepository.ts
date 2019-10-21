import db from '../../../db/db';

const blacklistToken = async (tokenJti, expiration, client: any = db) =>
  await client.query(`
    INSERT INTO jwt_token_blacklist (token_jti, expiration)
    VALUES ($1, $2)
  `, [tokenJti, expiration])

const findBlacklistedToken = async (tokenJti, client: any = db) =>
  await client.oneOrNone(`
    SELECT * FROM jwt_token_blacklist
    WHERE token_jti = $1
  `, [tokenJti])

const deleteExpiredJwtTokens = async (seconds, client: any = db) =>
  await client.any(`
    DELETE FROM jwt_token_blacklist
    WHERE expiration < $1
    RETURNING *
  `, [seconds])

export default {
  blacklistToken,
  findBlacklistedToken,
  deleteExpiredJwtTokens,
};
