/**
 * The one writer of the user's AI prefs for the AI services (account providers and settings). A change is applied to
 * the AI prefs as they are stored when it is committed, not to a copy read earlier: the browser's copy of the user is
 * never refreshed after a save, and a provider test or a model list can take many seconds, so a copy is always stale
 * by the time it is written. Old provider keys (no AAD) are encrypted again with their AAD on every write.
 */
import type { User } from '@openforis/arena-core'

import * as UserUtils from '@core/user/user'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { ENV } from '@core/processUtils'
import {
  type AiPrefsUpdate,
  findEnvelopesOfOtherUsers,
  type Queryable,
  type StoredAiPrefs,
  updateAiPrefs,
} from '@server/modules/user/repository/userAiPrefsRepository'

import { getProviderPrefs, type KeyCipher, listUpgradableKeys, upgradeLegacyKeysInAiPrefs } from './aiProviderPrefs'

export type AiPrefsWriterDeps = {
  updateAiPrefs: (userUuid: string, update: AiPrefsUpdate) => Promise<StoredAiPrefs | null>
  cipher: KeyCipher
  isEncryptionConfigured: () => boolean
  // org-hosted base URLs: an old key (no AAD) is accepted for these endpoints only (see isLegacyKeyAllowed)
  allowlist: string[]
  // the envelopes among those given that are stored in the record of another user (copied)
  findCopiedEnvelopes: (args: { userUuid: string; envelopes: string[] }, client: Queryable) => Promise<string[]>
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
  allowlist: ENV.aiOrgHostedBaseUrls ?? [],
  findCopiedEnvelopes: findEnvelopesOfOtherUsers,
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
 * Encrypts again, with their AAD, the old keys of the AI prefs; an old key that is also stored in the record of
 * another user was copied and is removed instead (one query, only when there are old keys to upgrade).
 * @param {object} params - Parameters.
 * @param {object|null} params.aiPrefs - The AI prefs about to be stored.
 * @param {User} params.user - The user.
 * @param {Queryable} params.client - The transaction.
 * @param {AiPrefsWriterDeps} params.deps - Dependencies.
 * @returns {Promise<object|null>} The AI prefs to store; the same object when no key changed.
 */
const upgradeOldKeys = async ({
  aiPrefs,
  user,
  client,
  deps,
}: {
  aiPrefs: StoredAiPrefs | null
  user: User
  client: Queryable
  deps: AiPrefsWriterDeps
}): Promise<StoredAiPrefs | null> => {
  const { cipher, allowlist } = deps
  const envelopes = listUpgradableKeys(getProviderPrefs(aiPrefs), cipher.isLegacy, allowlist)
  if (envelopes.length === 0) return aiPrefs
  const copied = new Set(await deps.findCopiedEnvelopes({ userUuid: user.uuid, envelopes }, client))
  return upgradeLegacyKeysInAiPrefs({ aiPrefs, userUuid: user.uuid, cipher, allowlist, copied })
}

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
  const stored = await deps.updateAiPrefs(user.uuid, async (latest, client) => {
    const next = change(latest) ?? latest
    const upgraded = deps.isEncryptionConfigured() ? await upgradeOldKeys({ aiPrefs: next, user, client, deps }) : next
    return upgraded === latest ? null : upgraded
  })
  return withStoredAiPrefs(user, stored)
}
