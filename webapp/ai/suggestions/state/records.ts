/**
 * Immutable helpers for the records of the state (bucket → id → entry).
 */

/**
 * Returns true for a non-array object.
 * @param {unknown} value - Value.
 * @returns {boolean} True for a plain object.
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Returns the own value of a key (inherited keys such as "constructor" are not values).
 * @param {Record<string, T>} record - Record.
 * @param {string} key - Key.
 * @returns {T|undefined} The value.
 */
export const own = <T>(record: Record<string, T>, key: string): T | undefined =>
  Object.hasOwn(record, key) ? record[key] : undefined

/**
 * Returns a record with one entry set (moved last) or, with null, removed.
 * @param {Record<string, T>} record - Record.
 * @param {string} key - Key.
 * @param {T|null} value - Value, or null to remove.
 * @returns {Record<string, T>} The new record.
 */
export const setEntry = <T>(record: Record<string, T>, key: string, value: T | null): Record<string, T> => {
  const rest = Object.entries(record).filter(([entryKey]) => entryKey !== key)
  return Object.fromEntries(value === null ? rest : [...rest, [key, value]])
}

/**
 * Sets (or removes, with null) the entry of a suggestion id in a bucket; an emptied bucket is removed.
 * @param {Record<string, Record<string, T>>} record - Record by bucket and id.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @param {T|null} value - Value, or null to remove.
 * @returns {Record<string, Record<string, T>>} The new record.
 */
export const setNested = <T>(
  record: Record<string, Record<string, T>>,
  bucket: string,
  id: string,
  value: T | null
): Record<string, Record<string, T>> => {
  const ids = setEntry(own(record, bucket) ?? {}, id, value)
  return setEntry(record, bucket, Object.keys(ids).length > 0 ? ids : null)
}

/**
 * Returns the entry of a suggestion id in a bucket.
 * @param {Record<string, Record<string, T>>} record - Record by bucket and id.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @returns {T|undefined} The entry.
 */
export const getNested = <T>(record: Record<string, Record<string, T>>, bucket: string, id: string): T | undefined => {
  const ids = own(record, bucket)
  return ids ? own(ids, id) : undefined
}
