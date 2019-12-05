import { db } from '@server/db/db'

export const blacklistToken = async (tokenJti, expiration, client = db) =>
  await client.query(
    `
    INSERT INTO jwt_token_blacklist (token_jti, expiration)
    VALUES ($1, $2)
  `,
    [tokenJti, expiration],
  )

export const findBlacklistedToken = async (tokenJti, client = db) =>
  await client.oneOrNone(
    `
    SELECT * FROM jwt_token_blacklist
    WHERE token_jti = $1
  `,
    [tokenJti],
  )

export const deleteExpiredJwtTokens = async (seconds, client = db) =>
  await client.any(
    `
    DELETE FROM jwt_token_blacklist
    WHERE expiration < $1
    RETURNING *
  `,
    [seconds],
  )
