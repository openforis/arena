/**
 * Feature gating shared by the gateway endpoint and the server jobs: env master switch, env per-feature flags,
 * user master switch, user category toggle (in this order).
 */
import type { User } from '@openforis/arena-core'

import { ENV } from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import { getAiFeature } from '@common/ai/features'

import { areFeaturesEnabledForUser, isCategoryEnabledForUser } from './aiUserPrefs'

type GateEnv = { aiFeaturesEnabled: boolean; aiFeatureFlags: unknown }

const isDisabledByFlag = (flags: unknown, feature: string): boolean =>
  !!flags && typeof flags === 'object' && Object.hasOwn(flags, feature) && !flags[feature]

/**
 * Throws when the given feature can't be used by the user.
 * @param {string} feature - Feature key.
 * @param {User} user - Acting user (null for system calls: only the env checks apply).
 * @param {GateEnv} [env] - Env values (injectable for tests).
 * @returns {void}
 */
export const assertFeatureEnabled = (feature: string, user: User | null, env: GateEnv = ENV): void => {
  if (!env.aiFeaturesEnabled) {
    throw new SystemError('aiFeaturesDisabled', { feature }, StatusCodes.NOT_FOUND)
  }
  if (isDisabledByFlag(env.aiFeatureFlags, feature)) {
    throw new SystemError('aiFeatureDisabled', { feature }, StatusCodes.FORBIDDEN)
  }
  if (!user) return
  if (!areFeaturesEnabledForUser(user)) {
    throw new SystemError('aiFeaturesDisabled', { feature }, StatusCodes.FORBIDDEN)
  }
  const category = getAiFeature(feature)?.category
  if (category && !isCategoryEnabledForUser(user, category)) {
    throw new SystemError('aiFeatureDisabled', { feature }, StatusCodes.FORBIDDEN)
  }
}
