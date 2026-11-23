import type { AiProviderServiceDeps } from '@server/modules/ai/service/aiProviderService'
import type { AiPrefsUpdate, Queryable, StoredAiPrefs } from '@server/modules/user/repository/userAiPrefsRepository'
import * as SecretBox from '@server/utils/crypto/secretBox'

/**
 * Builds an in-memory store of the AI prefs of one user that behaves like the database writer: updates run one at a
 * time (the user row is locked), each is applied to the latest stored value, and one that returns null writes nothing.
 * @param {object|null} [initial] - The stored AI prefs.
 * @param {string[]} [copiedEnvelopes] - Envelopes that are also stored in the record of another user.
 * @returns {object} The store: `get`, `set` (another request's write), `writes` (every stored value) and `updateAiPrefs`.
 */
export const createAiPrefsStore = (initial: StoredAiPrefs | null = null, copiedEnvelopes: string[] = []) => {
  let current = initial
  let lock: Promise<unknown> = Promise.resolve()
  const writes: StoredAiPrefs[] = []
  return {
    get: (): StoredAiPrefs | null => current,
    set: (aiPrefs: StoredAiPrefs | null) => {
      current = aiPrefs
    },
    writes,
    findCopiedEnvelopes: ({ envelopes }: { envelopes: string[] }): Promise<string[]> =>
      Promise.resolve(envelopes.filter((envelope) => copiedEnvelopes.includes(envelope))),
    updateAiPrefs: (_userUuid: string, update: AiPrefsUpdate): Promise<StoredAiPrefs | null> => {
      const run = async () => {
        const next = await update(current, {} as Queryable)
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

/**
 * Builds recording dependencies of the AI provider service with the real secret box, over an in-memory store of the
 * AI prefs of the user.
 * @param {any} [user] - The user whose AI prefs are stored at the start.
 * @param {Partial<AiProviderServiceDeps>} [overrides] - Dependencies to replace.
 * @returns {object} The dependencies, what they recorded (`saved` is every stored AI prefs value) and the store.
 */
export const createRecordingAiProviderServiceDeps = (
  user: any = null,
  overrides: Partial<AiProviderServiceDeps> = {}
) => {
  const store = createAiPrefsStore(user?.prefs?.ai ?? null)
  const tests: any[] = []
  const listed: any[] = []
  const deps: AiProviderServiceDeps = {
    updateAiPrefs: store.updateAiPrefs,
    runTest: async ({ cfg }) => {
      tests.push(cfg)
      return { ok: true, latencyMs: 1 }
    },
    listModels: async (cfg) => {
      listed.push(cfg)
      return [{ id: 'm1' }]
    },
    encrypt: SecretBox.encrypt,
    decrypt: SecretBox.decrypt,
    isLegacyEnvelope: SecretBox.isLegacyEnvelope,
    isEncryptionConfigured: () => true,
    hasAdminDefault: () => true,
    isMockEnabled: () => false,
    newId: () => 'new-id',
    now: () => '2026-10-15T00:00:00.000Z',
    allowlist: [],
    findCopiedEnvelopes: store.findCopiedEnvelopes,
    ...overrides,
  }
  return { deps, saved: store.writes, tests, listed, store }
}
