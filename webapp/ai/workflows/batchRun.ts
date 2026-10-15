/**
 * Runs the many AI calls of a browser batch (label translation, data dictionary): the AI switch and the survey
 * policy are checked again before each call, progress is reported, the run can be cancelled, and a failed call is
 * counted instead of failing the run. A run that cannot go on (cancelled, a guard or an error that will fail every
 * call) keeps the results it already has.
 */
import { assertHostingAllowed, type AiPolicy } from '@common/ai/policy'
import SystemError, { StatusCodes } from '@core/systemError'

import { type AiFeatureSwitches, isAiFeatureEnabledInSettings } from '../engines/featureSwitches'
import { aborted as createAbortError, OFF_POLICY } from '../engines/resolveModel'
import { getAiErrorKey, isAiAbortError } from '../runtime/runtimeErrors'

export type AiBatchProgress = { done: number; total: number }

// why a run ended before its last call, and how many calls it had finished
export type AiBatchStop = { cause: 'cancelled' | 'error'; error?: unknown } & AiBatchProgress

export type AiBatchRunResult = {
  // the summed size of the failed calls and of the calls not run
  failedCount: number
  stop: AiBatchStop | null
}

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
  'aiApiKeyUnreadable',
  'aiDailyBudgetExceeded',
  'aiFeatureDisabled',
  'aiFeaturesDisabled',
  'aiLocalServerModelMissing',
  'aiLocalServerUnreachable',
  'aiNoEngineAvailable',
  'aiNotAuthorized',
  'aiNotConfigured',
  'aiPolicyRefused',
  'aiProviderAuth',
  'aiProviderChooseAnother',
  'aiProviderNotFound',
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

type StopCause = Pick<AiBatchStop, 'cause' | 'error'>

type CallOutcome = 'succeeded' | 'failed' | StopCause

/**
 * Waits for the guard, but not longer than the signal: a stop must not wait for a slow check.
 * @param {AiBatchGuard} guard - The guard.
 * @param {AbortSignal} [signal] - Cancellation signal.
 * @returns {Promise<void>} Settles with the guard, or when the signal aborts (the caller then sees the abort).
 */
const guardUnlessAborted = (guard: AiBatchGuard, signal?: AbortSignal): Promise<void> => {
  if (!signal) return guard()
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => resolve()
    signal.addEventListener('abort', onAbort, { once: true })
    guard()
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', onAbort))
  })
}

/**
 * Runs one call: the guard first, then the call.
 * @param {object} params - Parameters.
 * @param {AiBatchCall} params.call - The call.
 * @param {number} params.index - Index of the call.
 * @param {AiBatchGuard} params.guard - Check run before the call.
 * @param {Function} params.onResult - Called with the result of a successful call.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @returns {Promise<CallOutcome>} succeeded, failed (counted, the run goes on) or the cause that stops the run.
 */
const runCall = async <T>({
  call,
  index,
  guard,
  onResult,
  signal,
}: {
  call: AiBatchCall<T>
  index: number
  guard: AiBatchGuard
  onResult: (result: T, index: number) => void
  signal?: AbortSignal
}): Promise<CallOutcome> => {
  const cancelled: StopCause = { cause: 'cancelled' }
  if (signal?.aborted) return cancelled
  try {
    // a switch or policy change during the run stops it before the next call
    await guardUnlessAborted(guard, signal)
  } catch (error) {
    return signal?.aborted ? cancelled : { cause: 'error', error }
  }
  if (signal?.aborted) return cancelled
  try {
    onResult(await call.run(signal), index)
    return 'succeeded'
  } catch (error) {
    // what the HTTP client throws when its request is aborted is not always an AbortError
    if (signal?.aborted || isAiAbortError(error)) return cancelled
    return isRunStoppingError(error) ? { cause: 'error', error } : 'failed'
  }
}

/**
 * Runs the calls one after the other. Before each call the run stops if it was cancelled or the guard rejects;
 * a call that fails with an error not in RUN_STOPPING_ERROR_KEYS is counted by its size and the run goes on.
 * A run that stops after at least one result returns what it has, with the stop; the calls not run count as failed.
 * A run that stops with no result throws (the abort error of a cancel, else the error).
 * @param {object} params - Parameters.
 * @param {AiBatchCall[]} params.calls - The calls.
 * @param {AiBatchGuard} params.guard - Check run before each call.
 * @param {Function} params.onResult - Called with the result and the index of each successful call.
 * @param {Function} [params.onProgress] - Called with { done, total } at the start and after each call.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @returns {Promise<AiBatchRunResult>} The summed size of the failed calls and of the calls not run, and the stop.
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
}): Promise<AiBatchRunResult> => {
  const total = calls.length
  let failedCount = 0
  let succeededCount = 0
  onProgress?.({ done: 0, total })
  for (const [index, call] of calls.entries()) {
    const outcome = await runCall({ call, index, guard, onResult, signal })
    if (typeof outcome === 'object') {
      if (succeededCount === 0) throw outcome.cause === 'error' ? outcome.error : createAbortError()
      const notRunSize = calls.slice(index).reduce((sum, notRun) => sum + notRun.size, 0)
      return { failedCount: failedCount + notRunSize, stop: { ...outcome, done: index, total } }
    }
    if (outcome === 'succeeded') succeededCount += 1
    else failedCount += call.size
    onProgress?.({ done: index + 1, total })
  }
  return { failedCount, stop: null }
}
