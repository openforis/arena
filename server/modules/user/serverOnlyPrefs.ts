/**
 * The keys of `user.prefs` that only the server reads and writes: the AI providers with their encrypted keys (`ai`)
 * and the AI usage counters (`aiUsage`). A user read never selects them, a response never carries them and the
 * generic prefs routes never write them, so one user cannot read or forge another one's.
 */

export const SERVER_ONLY_PREFS_KEYS = ['ai', 'aiUsage'] as const

export type ServerOnlyPrefsKey = (typeof SERVER_ONLY_PREFS_KEYS)[number]

const SERVER_ONLY_KEYS: readonly string[] = SERVER_ONLY_PREFS_KEYS

/**
 * Returns the prefs without the server-only keys (a new object; the input is not changed).
 * @param {unknown} prefs - User prefs.
 * @returns {unknown} The prefs without the server-only keys; a value that is not an object is returned as is.
 */
export const omitServerOnlyPrefs = <T>(prefs: T): T => {
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) return prefs
  return Object.fromEntries(Object.entries(prefs).filter(([key]) => !SERVER_ONLY_KEYS.includes(key))) as T
}

/**
 * Returns the user without the server-only prefs (a new object; the input is not changed).
 * @param {object} user - User, as loaded from the database or sent to a browser.
 * @returns {object} The user, with the prefs filtered; a value that is not a user with prefs is returned as is.
 */
export const omitServerOnlyPrefsFromUser = <T>(user: T): T => {
  if (!user || typeof user !== 'object' || !('prefs' in user)) return user
  return { ...user, prefs: omitServerOnlyPrefs((user as { prefs: unknown }).prefs) }
}

/**
 * Returns the SQL expression that selects a prefs column without the server-only keys.
 * @param {string} column - Prefs column, e.g. `u.prefs`.
 * @returns {string} The expression, e.g. `u.prefs - 'ai' - 'aiUsage'`.
 */
export const sqlPrefsWithoutServerOnlyKeys = (column: string): string =>
  [column, ...SERVER_ONLY_PREFS_KEYS.map((key) => `'${key}'`)].join(' - ')

/**
 * Returns the SQL expression that reads a prefs parameter as JSON (a missing one as an empty object).
 * @param {string} param - The parameter placeholder, e.g. `$1`.
 * @returns {string} The expression.
 */
const sqlPrefsParam = (param: string): string => `COALESCE(${param}::jsonb, '{}'::jsonb)`

/**
 * Returns the SQL expression that filters a prefs parameter (a JSON object sent by a browser) so that it cannot write
 * a server-only key. A missing object is an empty one, so it never turns the stored prefs into NULL.
 * @param {string} param - The parameter placeholder, e.g. `$1`.
 * @returns {string} The expression, e.g. `COALESCE($1::jsonb, '{}'::jsonb) - 'ai' - 'aiUsage'`.
 */
export const sqlPrefsParamWithoutServerOnlyKeys = (param: string): string =>
  sqlPrefsWithoutServerOnlyKeys(sqlPrefsParam(param))

/**
 * Returns the SQL expression that is true when a prefs parameter can be merged into the stored prefs: a JSON object (a
 * missing one counts as an empty object). Anything else (an array, a scalar) would turn the stored prefs into one.
 * @param {string} param - The parameter placeholder, e.g. `$1`.
 * @returns {string} The expression, e.g. `jsonb_typeof(COALESCE($1::jsonb, '{}'::jsonb)) = 'object'`.
 */
export const sqlPrefsParamIsObject = (param: string): string => `jsonb_typeof(${sqlPrefsParam(param)}) = 'object'`

/**
 * Returns true when the prefs of a user update can be written: absent (nothing to write) or a plain JSON object. An
 * array or a scalar would replace the stored object for good, and the server-only keys could no longer be stripped.
 * @param {unknown} prefs - The `prefs` of the user sent to an update.
 * @returns {boolean} True when they are absent or a plain object.
 */
export const isValidPrefsUpdate = (prefs: unknown): boolean =>
  prefs === undefined || prefs === null || (typeof prefs === 'object' && !Array.isArray(prefs))
