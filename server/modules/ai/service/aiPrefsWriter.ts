/**
 * The one writer of the user's AI prefs for the AI services (account providers and settings). A change is applied to
 * the AI prefs as they are stored when it is committed, not to a copy read earlier: the browser's copy of the user is
 * never refreshed after a save, and a provider test or a model list can take many seconds, so a copy is always stale
 * by the time it is written. Old provider keys (no AAD) are encrypted again with their AAD on every write.
 */
import type { User } from '@openforis/arena-core'

import * as UserUtils from '@core/user/user'
import * as SecretBox from '@server/utils/crypto/secretBox'
import {
  type AiPrefsUpdate,
  type StoredAiPrefs,
  updateAiPrefs,
} from '@server/modules/user/repository/userAiPrefsRepository'

import { type KeyCipher, upgradeLegacyKeysInAiPrefs } from './aiProviderPrefs'

export type AiPrefsWriterDeps = {
  updateAiPrefs: (userUuid: string, update: AiPrefsUpdate) => Promise<StoredAiPrefs | null>
  cipher: KeyCipher
  isEncryptionConfigured: () => boolean
}

// returns the AI prefs to store, or null when there is nothing to change
export type AiPrefsChange = (latest: StoredAiPrefs | null) => StoredAiPrefs | null

/**
 * Returns the default dependencies: the database and the server encryption secret.
 * @returns {AiPrefsWriterDeps} The dependencies.
 */
export const createDefaultAiPrefsWriterDeps = (): AiPrefsWriterDeps => ({
  updateAiPrefs: (userUuid, update) => updateAiPrefs({ userUuid, update }),
  cipher: { encrypt: SecretBox.encrypt, decrypt: SecretBox.decrypt, isLegacy: SecretBox.isLegacyEnvelope },
  isEncryptionConfigured: SecretBox.isConfigured,
})

/**
 * Returns the user with the AI prefs as stored.
 * @param {User} user - The user.
 * @param {object|null} aiPrefs - Stored AI prefs.
 * @returns {User} The user with those prefs (the other prefs are the user's own).
 */
export const withStoredAiPrefs = (user: User, aiPrefs: StoredAiPrefs | null): User =>
  ({ ...user, prefs: { ...(UserUtils.getPrefs(user) || {}), ai: aiPrefs } }) as User

/**
 * Applies a change to the latest stored AI prefs of the user and stores the result, atomically: the change runs while
 * the user row is locked, so it must not wait for the network; it may throw to refuse the write (nothing is stored).
 * Nothing is written when the change returns null and no old key needs to be encrypted again.
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {AiPrefsChange} params.change - Receives the latest stored AI prefs, returns the ones to store (or null).
 * @param {AiPrefsWriterDeps} [params.deps] - Dependencies.
 * @returns {Promise<User>} The user with the AI prefs as stored.
 */
export const changeAiPrefs = async ({
  user,
  change,
  deps = createDefaultAiPrefsWriterDeps(),
}: {
  user: User
  change: AiPrefsChange
  deps?: AiPrefsWriterDeps
}): Promise<User> => {
  const stored = await deps.updateAiPrefs(user.uuid, (latest) => {
    const next = change(latest) ?? latest
    const upgraded = deps.isEncryptionConfigured()
      ? upgradeLegacyKeysInAiPrefs({ aiPrefs: next, userUuid: user.uuid, cipher: deps.cipher })
      : next
    return upgraded === latest ? null : upgraded
  })
  return withStoredAiPrefs(user, stored)
}
