import type { AiPrefsUpdate, StoredAiPrefs } from '@server/modules/user/repository/userAiPrefsRepository'

/**
 * Builds an in-memory store of the AI prefs of one user that behaves like the database writer: updates run one at a
 * time (the user row is locked), each is applied to the latest stored value, and one that returns null writes nothing.
 * @param {object|null} [initial] - The stored AI prefs.
 * @returns {object} The store: `get`, `set` (another request's write), `writes` (every stored value) and `updateAiPrefs`.
 */
export const createAiPrefsStore = (initial: StoredAiPrefs | null = null) => {
  let current = initial
  let lock: Promise<unknown> = Promise.resolve()
  const writes: StoredAiPrefs[] = []
  return {
    get: (): StoredAiPrefs | null => current,
    set: (aiPrefs: StoredAiPrefs | null) => {
      current = aiPrefs
    },
    writes,
    updateAiPrefs: (_userUuid: string, update: AiPrefsUpdate): Promise<StoredAiPrefs | null> => {
      const run = async () => {
        const next = await update(current)
        if (!next) return current
        writes.push(next)
        current = next
        return next
      }
      const result = lock.then(run)
      lock = result.catch(() => undefined)
      return result
    },
  }
}
