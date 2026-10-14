/**
 * Runs the many AI calls of a browser batch (label translation, data dictionary): the AI switch and the survey
 * policy are checked again before each call, progress is reported, the run can be cancelled, and a failed call is
 * counted instead of failing the run (unless the error will fail every call).
 */
import { assertHostingAllowed, type AiPolicy } from '@common/ai/policy'
import SystemError, { StatusCodes } from '@core/systemError'

import { type AiFeatureSwitches, isAiFeatureEnabledInSettings } from '../engines/featureSwitches'
import { aborted as createAbortError, OFF_POLICY } from '../engines/resolveModel'
import { getAiErrorKey, isAiAbortError } from '../runtime/runtimeErrors'

export type AiBatchProgress = { done: number; total: number }

// size: what a failure of the call leaves untranslated / undescribed (counted in the result)
export type AiBatchCall<T> = { size: number; run: (signal?: AbortSignal) => Promise<T> }

export type AiBatchGuard = () => Promise<void>

export type AiBatchGuardDeps = {
  // GET /api/ai/settings, uncached
  fetchSettings: () => Promise<AiFeatureSwitches | null>
  // the survey's effective policy, uncached
  fetchEffectivePolicy: (surveyId: number) => Promise<AiPolicy | null>
}

// errors that will fail every following call too: the run stops at once with this message
export const RUN_STOPPING_ERROR_KEYS: readonly string[] = [
  'aiApiKeyMissing',
  'aiFeatureDisabled',
  'aiFeaturesDisabled',
  'aiLocalServerModelMissing',
  'aiLocalServerUnreachable',
  'aiNoEngineAvailable',
  'aiNotAuthorized',
  'aiNotConfigured',
  'aiPolicyRefused',
  'aiProviderAuth',
  'aiProviderRejected',
  'aiProviderUnavailable',
  'aiRateLimited',
  'aiSessionExpired',
]

/**
 * Returns true when the error will fail every call of the run (provider, policy, switch or session error).
 * @param {unknown} error - The error of a call.
 * @returns {boolean} True when the run must stop.
 */
export const isRunStoppingError = (error: unknown): boolean => {
  const key = getAiErrorKey(error)
  return key !== null && RUN_STOPPING_ERROR_KEYS.includes(key)
}

/**
 * Splits an array into chunks of at most `size` elements.
 * @param {Array} array - Source array.
 * @param {number} size - Maximum chunk size.
 * @returns {Array[]} The chunks.
 */
export const chunkArray = <T>(array: readonly T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let start = 0; start < array.length; start += size) {
    chunks.push(array.slice(start, start + size))
  }
  return chunks
}

// re-exported so the workflows stop a run with the same abort error as the engine layer (isAiAbortError)
export { createAbortError }

/**
 * Creates the check run before each call: the feature must still be on in the user's AI settings and the survey
 * policy must still allow the engine's hosting class for the data class. Both are read fresh (fail closed).
 * @param {object} params - Parameters.
 * @param {string} params.feature - Feature key.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.dataClass - Data class sent by the feature.
 * @param {string|null} params.hostingClass - Hosting class of the engine the run uses.
 * @param {AiBatchGuardDeps} params.deps - Fresh reads of the settings and the policy.
 * @returns {AiBatchGuard} The guard; it rejects with aiFeatureDisabled (403) or aiPolicyRefused (403).
 */
export const createAiBatchGuard =
  ({
    feature,
    surveyId,
    dataClass,
    hostingClass,
    deps,
  }: {
    feature: string
    surveyId: number
    dataClass: string
    hostingClass: string | null
    deps: AiBatchGuardDeps
  }): AiBatchGuard =>
  async () => {
    const settings = await deps.fetchSettings()
    if (!isAiFeatureEnabledInSettings(settings, feature)) {
      throw new SystemError('aiFeatureDisabled', { feature }, StatusCodes.FORBIDDEN)
    }
    const effective = await deps.fetchEffectivePolicy(surveyId)
    assertHostingAllowed({ effective: effective ?? OFF_POLICY, dataClass, hostingClass })
  }

/**
 * Runs the calls one after the other. Before each call the run stops if it was cancelled or the guard rejects;
 * a call that fails with an error not in RUN_STOPPING_ERROR_KEYS is counted by its size and the run goes on.
 * @param {object} params - Parameters.
 * @param {AiBatchCall[]} params.calls - The calls.
 * @param {AiBatchGuard} params.guard - Check run before each call.
 * @param {Function} params.onResult - Called with the result and the index of each successful call.
 * @param {Function} [params.onProgress] - Called with { done, total } at the start and after each call.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @returns {Promise<{failedCount: number}>} The summed size of the failed calls.
 */
export const runAiBatchCalls = async <T>({
  calls,
  guard,
  onResult,
  onProgress,
  signal,
}: {
  calls: AiBatchCall<T>[]
  guard: AiBatchGuard
  onResult: (result: T, index: number) => void
  onProgress?: (progress: AiBatchProgress) => void
  signal?: AbortSignal
}): Promise<{ failedCount: number }> => {
  const total = calls.length
  let failedCount = 0
  onProgress?.({ done: 0, total })
  for (const [index, call] of calls.entries()) {
    if (signal?.aborted) throw createAbortError()
    // a switch or policy change during the run stops it before the next call (outside the try: never counted)
    await guard()
    if (signal?.aborted) throw createAbortError()
    try {
      onResult(await call.run(signal), index)
    } catch (error) {
      if (signal?.aborted) throw createAbortError()
      if (isAiAbortError(error) || isRunStoppingError(error)) throw error
      failedCount += call.size
    }
    onProgress?.({ done: index + 1, total })
  }
  return { failedCount }
}
