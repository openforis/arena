/**
 * SQL of the daily budget of the Arena default AI provider: the usage of a user is kept in `prefs.aiUsage` as
 * `{ day, calls, chars }` of one UTC day.
 */
import { db } from '@server/db/db'

export type AiUsage = { day: string; calls: number; chars: number }

export type ChargeAiUsageParams = {
  userUuid: string
  // UTC day of the call, YYYY-MM-DD
  day: string
  chars: number
  // 0 = unlimited
  callLimit: number
  charLimit: number
}

/**
 * Returns the SQL of a counter of today's usage (0 on another day, or when the stored value is not a number).
 * Only the own columns of the row are read, so a concurrent update is re-evaluated on the committed row.
 * @param {string} field - Counter name in `prefs.aiUsage`.
 * @returns {string} The SQL expression.
 */
const usedToday = (field: 'calls' | 'chars'): string =>
  `(CASE WHEN prefs #>> '{aiUsage,day}' = $/day/ AND jsonb_typeof(prefs #> '{aiUsage,${field}}') = 'number' ` +
  `THEN (prefs #>> '{aiUsage,${field}}')::numeric ELSE 0 END)`

/**
 * Adds one call to the usage of a user, unless it would go over a limit (one atomic statement, so concurrent calls
 * of any server replica cannot exceed the limits).
 * @param {ChargeAiUsageParams} params - Parameters.
 * @param {object} [client] - Database client.
 * @returns {Promise<AiUsage|null>} The usage after the call, or null when a limit would be exceeded.
 */
export const chargeAiUsage = async (
  { userUuid, day, chars, callLimit, charLimit }: ChargeAiUsageParams,
  client = db
): Promise<AiUsage | null> => {
  const row = await client.oneOrNone(
    `UPDATE "user"
     SET prefs = jsonb_set(
       prefs,
       '{aiUsage}',
       jsonb_build_object(
         'day', $/day/::text,
         'calls', ${usedToday('calls')} + 1,
         'chars', ${usedToday('chars')} + $/chars/
       ),
       true
     )
     WHERE uuid = $/userUuid/
       AND ($/callLimit/ <= 0 OR ${usedToday('calls')} + 1 <= $/callLimit/)
       AND ($/charLimit/ <= 0 OR ${usedToday('chars')} + $/chars/ <= $/charLimit/)
     RETURNING prefs #> '{aiUsage}' AS usage`,
    { userUuid, day, chars, callLimit, charLimit }
  )
  return row ? row.usage : null
}
