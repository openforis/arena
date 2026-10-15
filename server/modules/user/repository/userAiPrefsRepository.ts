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
export type Queryable = Pick<typeof db, 'oneOrNone' | 'none' | 'manyOrNone'>

// returns the AI prefs to store, or null to leave the stored ones as they are; `client` is the transaction
export type AiPrefsUpdate = (
  current: StoredAiPrefs | null,
  client: Queryable
) => StoredAiPrefs | null | Promise<StoredAiPrefs | null>

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
 * Returns the envelopes that also appear in the AI prefs of another user. Envelopes have a random IV, so one that is
 * stored twice was copied from one record to the other.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - The user whose own records are left out.
 * @param {string[]} params.envelopes - Envelopes to look for.
 * @param {object} [client] - Database client.
 * @returns {Promise<string[]>} The envelopes found in the record of another user.
 */
export const findEnvelopesOfOtherUsers = async (
  { userUuid, envelopes }: { userUuid: string; envelopes: string[] },
  client: Queryable = db
): Promise<string[]> => {
  if (envelopes.length === 0) return []
  // strpos, not LIKE: an envelope is stored data and could hold wildcards
  const rows: { envelope: string }[] = await client.manyOrNone(
    `SELECT e.envelope
     FROM unnest($2::text[]) AS e(envelope)
     WHERE EXISTS (
       SELECT 1 FROM "user" u
       WHERE u.uuid <> $1 AND u.prefs -> 'ai' IS NOT NULL AND strpos((u.prefs -> 'ai')::text, e.envelope) > 0
     )`,
    [userUuid, envelopes]
  )
  return rows.map((row) => row.envelope)
}

/**
 * Changes the AI prefs of a user from their latest stored value: reads them with the row locked, applies the change
 * and stores the result in one transaction. The change must not wait for the network: the row stays locked meanwhile.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - User uuid.
 * @param {Function} params.update - Receives the stored AI prefs (null when none) and returns the ones to store, or
 *   null to keep the stored ones (nothing is written then).
 * @param {object} [client] - Database client.
 * @returns {Promise<object|null>} The AI prefs as stored after the update (null when the user has none).
 */
export const updateAiPrefs = async (
  { userUuid, update }: { userUuid: string; update: AiPrefsUpdate },
  client: Pick<typeof db, 'tx'> = db
): Promise<StoredAiPrefs | null> =>
  client.tx(async (tx) => {
    const current = await readAiPrefs({ userUuid, forUpdate: true }, tx)
    const aiPrefs = await update(current, tx)
    if (!aiPrefs) return current
    await writeAiPrefs({ userUuid, aiPrefs }, tx)
    return aiPrefs
  })
