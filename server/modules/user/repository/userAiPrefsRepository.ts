/**
 * The only writer of `user.prefs.ai` (AI settings with the account providers and their encrypted keys). It touches
 * that key alone (`jsonb_set`), so it never overwrites the other prefs, `prefs.aiUsage` included, and the generic
 * prefs update never overwrites it. Several requests of one user can change the AI prefs at the same time (a slow
 * provider test, a language change): a change is always made on the latest stored value, inside a transaction that
 * holds the user row.
 */
import { db } from '@server/db/db'

export type StoredAiPrefs = Record<string, any>

// the database or a transaction
type Queryable = Pick<typeof db, 'oneOrNone' | 'none'>

export type AiPrefsUpdate = (current: StoredAiPrefs | null) => StoredAiPrefs | Promise<StoredAiPrefs>

/**
 * Reads the stored AI prefs of a user.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - User uuid.
 * @param {boolean} [params.forUpdate] - Lock the user row until the end of the transaction (`FOR UPDATE`).
 * @param {object} [client] - Database client (a transaction when `forUpdate` is true).
 * @returns {Promise<object|null>} The AI prefs, or null when the user has none.
 */
export const readAiPrefs = async (
  { userUuid, forUpdate = false }: { userUuid: string; forUpdate?: boolean },
  client: Queryable = db
): Promise<StoredAiPrefs | null> =>
  client.oneOrNone(
    `SELECT prefs -> 'ai' AS ai FROM "user" WHERE uuid = $1 ${forUpdate ? 'FOR UPDATE' : ''}`,
    [userUuid],
    (row: { ai: StoredAiPrefs | null } | null) => row?.ai ?? null
  )

/**
 * Replaces the stored AI prefs of a user, atomically: no other pref is read or written.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - User uuid.
 * @param {object} params.aiPrefs - AI prefs to store.
 * @param {object} [client] - Database client.
 * @returns {Promise<void>} Resolves when stored.
 */
export const writeAiPrefs = async (
  { userUuid, aiPrefs }: { userUuid: string; aiPrefs: StoredAiPrefs },
  client: Queryable = db
): Promise<void> => {
  await client.none(
    `UPDATE "user"
     SET prefs = jsonb_set(COALESCE(prefs, '{}'::jsonb), '{ai}', $2::jsonb, true)
     WHERE uuid = $1`,
    [userUuid, JSON.stringify(aiPrefs)]
  )
}

/**
 * Changes the AI prefs of a user from their latest stored value: reads them with the row locked, applies the change
 * and stores the result in one transaction. The change must not wait for the network: the row stays locked meanwhile.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - User uuid.
 * @param {Function} params.update - Receives the stored AI prefs (null when none) and returns the ones to store.
 * @param {object} [client] - Database client.
 * @returns {Promise<object>} The stored AI prefs.
 */
export const updateAiPrefs = async (
  { userUuid, update }: { userUuid: string; update: AiPrefsUpdate },
  client: Pick<typeof db, 'tx'> = db
): Promise<StoredAiPrefs> =>
  client.tx(async (tx) => {
    const current = await readAiPrefs({ userUuid, forUpdate: true }, tx)
    const aiPrefs = await update(current)
    await writeAiPrefs({ userUuid, aiPrefs }, tx)
    return aiPrefs
  })
