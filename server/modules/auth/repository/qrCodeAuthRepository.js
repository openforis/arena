import { db } from '@server/db/db'
import { uuidv4 } from '@core/uuid'

const TABLE_NAME = 'user_qr_code_auth'
const TOKEN_EXPIRATION_MINUTES = 5

/**
 * Creates the QR code authentication table if it doesn't exist.
 *
 * @param {object} client - The database client.
 * @returns {Promise<void>} Resolves when the table is created.
 */
const createTableIfNotExists = async (client = db) => {
  await client.none(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      token UUID PRIMARY KEY,
      user_uuid UUID NOT NULL REFERENCES "user"(uuid) ON DELETE CASCADE,
      date_created TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_qr_code_auth_user_uuid ON ${TABLE_NAME}(user_uuid);
    CREATE INDEX IF NOT EXISTS idx_qr_code_auth_date_created ON ${TABLE_NAME}(date_created);
  `)
}

/**
 * Inserts a new QR code authentication token for a user.
 *
 * @param {object} params - The parameters.
 * @param {string} params.userUuid - The UUID of the user.
 * @param {object} [client=db] - The database client.
 * @returns {Promise<object>} The created token record with token and expiresAt.
 */
const insertToken = async ({ userUuid }, client = db) => {
  await createTableIfNotExists(client)

  const token = uuidv4()
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000)

  await client.none(
    `INSERT INTO ${TABLE_NAME} (token, user_uuid, date_created)
     VALUES ($1, $2, NOW())`,
    [token, userUuid]
  )

  return { token, expiresAt }
}

/**
 * Finds a user UUID by QR code token if it exists and is not expired.
 *
 * @param {object} params - The parameters.
 * @param {string} params.token - The QR code token.
 * @param {object} [client=db] - The database client.
 * @returns {Promise<string|null>} The user UUID if found and valid, null otherwise.
 */
const findUserUuidByToken = async ({ token }, client = db) => {
  const result = await client.oneOrNone(
    `SELECT user_uuid, date_created
     FROM ${TABLE_NAME}
     WHERE token = $1
       AND date_created > NOW() - INTERVAL '${TOKEN_EXPIRATION_MINUTES} minutes'`,
    [token]
  )

  return result ? result.user_uuid : null
}

/**
 * Deletes a QR code token after use (one-time use).
 *
 * @param {object} params - The parameters.
 * @param {string} params.token - The QR code token.
 * @param {object} [client=db] - The database client.
 * @returns {Promise<void>} Resolves when the token is deleted.
 */
const deleteToken = async ({ token }, client = db) => {
  await client.none(`DELETE FROM ${TABLE_NAME} WHERE token = $1`, [token])
}

/**
 * Deletes all expired QR code tokens.
 *
 * @param {object} [client=db] - The database client.
 * @returns {Promise<void>} Resolves when expired tokens are deleted.
 */
const deleteExpiredTokens = async (client = db) => {
  await client.none(
    `DELETE FROM ${TABLE_NAME}
     WHERE date_created <= NOW() - INTERVAL '${TOKEN_EXPIRATION_MINUTES} minutes'`
  )
}

/**
 * Deletes all QR code tokens for a specific user.
 *
 * @param {object} params - The parameters.
 * @param {string} params.userUuid - The UUID of the user.
 * @param {object} [client=db] - The database client.
 * @returns {Promise<void>} Resolves when tokens are deleted.
 */
const deleteTokensByUserUuid = async ({ userUuid }, client = db) => {
  await client.none(`DELETE FROM ${TABLE_NAME} WHERE user_uuid = $1`, [userUuid])
}

export const QRCodeAuthRepository = {
  createTableIfNotExists,
  insertToken,
  findUserUuidByToken,
  deleteToken,
  deleteExpiredTokens,
  deleteTokensByUserUuid,
}
