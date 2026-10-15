/**
 * SQL of the daily budget of the Arena default AI provider: the usage of a user is kept in `prefs.aiUsage` as
 * `{ day, calls, chars }` of one UTC day. The day is the one of the database clock, so every server replica agrees
 * on it whatever its own clock.
 */
import { db } from '@server/db/db'

export type AiUsage = { day: string; calls: number; chars: number }

export type ChargeAiUsageParams = {
  userUuid: string
  chars: number
  // 0 = unlimited
  callLimit: number
  charLimit: number
}

// today's UTC day, YYYY-MM-DD, by the database clock (now() is fixed for the whole statement)
const TODAY_SQL = `to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD')`

/**
 * Returns the SQL of a counter of today's usage (0 on another day, or when the stored value is not a number).
 * Only the own columns of the row are read, so a concurrent update is re-evaluated on the committed row.
 * @param {string} field - Counter name in `prefs.aiUsage`.
 * @returns {string} The SQL expression.
 */
const usedToday = (field: 'calls' | 'chars'): string =>
  `(CASE WHEN prefs #>> '{aiUsage,day}' = ${TODAY_SQL} AND jsonb_typeof(prefs #> '{aiUsage,${field}}') = 'number' ` +
  `THEN (prefs #>> '{aiUsage,${field}}')::numeric ELSE 0 END)`

/**
 * Adds one call to the usage of a user, unless it would go over a limit (one atomic statement, so concurrent calls
 * of any server replica cannot exceed the limits).
 * @param {ChargeAiUsageParams} params - Parameters.
 * @param {object} [client] - Database client.
 * @returns {Promise<AiUsage|null>} The usage after the call, or null when a limit would be exceeded.
 */
export const chargeAiUsage = async (
  { userUuid, chars, callLimit, charLimit }: ChargeAiUsageParams,
  client = db
): Promise<AiUsage | null> => {
  const row = await client.oneOrNone(
    `UPDATE "user"
     SET prefs = jsonb_set(
       prefs,
       '{aiUsage}',
       jsonb_build_object(
         'day', ${TODAY_SQL},
         'calls', ${usedToday('calls')} + 1,
         'chars', ${usedToday('chars')} + $/chars/
       ),
       true
     )
     WHERE uuid = $/userUuid/
       AND ($/callLimit/ <= 0 OR ${usedToday('calls')} + 1 <= $/callLimit/)
       AND ($/charLimit/ <= 0 OR ${usedToday('chars')} + $/chars/ <= $/charLimit/)
     RETURNING prefs #> '{aiUsage}' AS usage`,
    { userUuid, chars, callLimit, charLimit }
  )
  return row ? row.usage : null
}
