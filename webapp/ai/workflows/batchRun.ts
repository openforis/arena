/**
 * Runs the many AI calls of a browser batch (label translation, data dictionary): the AI switch and the survey
 * policy are checked again before each call, progress is reported, the run can be cancelled, and a failed call is
 * counted instead of failing the run. A run that cannot go on (cancelled, a guard or an error that will fail every
 * call) keeps the results it already has.
 */
import { type AiPolicy, assertHostingAllowed } from '@common/ai/policy'
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
  // the part of failedCount that was not run because the run stopped
  notRunCount: number
  stop: AiBatchStop | null
}

// size: what a failure of the call leaves untranslated / undescribed (counted in the result)
// split: the two halves of the call, when its answer is unusable (cut off or unparsable) and it has more than one item
export type AiBatchCall<T> = { size: number; run: (signal?: AbortSignal) => Promise<T>; split?: () => AiBatchCall<T>[] }

export type AiBatchGuard = () => Promise<void>

export type AiBatchGuardDeps = {
  // GET /api/ai/settings, uncached
  fetchSettings: () => Promise<AiFeatureSwitches | null>
  // the survey's effective policy for the batch's feature, uncached
  fetchEffectivePolicy: (surveyId: number, feature: string) => Promise<AiPolicy | null>
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

// a passed check is trusted this long: fast calls don't re-read the settings and the policy each time
export const AI_BATCH_GUARD_RECHECK_MS = 5000

/**
 * Creates the check run before each call: the feature must still be on in the user's AI settings and the survey
 * policy must still allow the engine's hosting class for the data class. Both are read fresh (fail closed), at most
 * once every `recheckMs`.
 * @param {object} params - Parameters.
 * @param {string} params.feature - Feature key.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.dataClass - Data class sent by the feature.
 * @param {string|null} params.hostingClass - Hosting class of the engine the run uses.
 * @param {AiBatchGuardDeps} params.deps - Fresh reads of the settings and the policy.
 * @param {number} [params.recheckMs] - How long a passed check is trusted.
 * @returns {AiBatchGuard} The guard; it rejects with aiFeatureDisabled (403) or aiPolicyRefused (403).
 */
export const createAiBatchGuard = ({
  feature,
  surveyId,
  dataClass,
  hostingClass,
  deps,
  recheckMs = AI_BATCH_GUARD_RECHECK_MS,
}: {
  feature: string
  surveyId: number
  dataClass: string
  hostingClass: string | null
  deps: AiBatchGuardDeps
  recheckMs?: number
}): AiBatchGuard => {
  let passedAt: number | null = null
  return async () => {
    if (passedAt !== null && Date.now() - passedAt < recheckMs) return
    const settings = await deps.fetchSettings()
    if (!isAiFeatureEnabledInSettings(settings, feature)) {
      throw new SystemError('aiFeatureDisabled', { feature }, StatusCodes.FORBIDDEN)
    }
    const effective = await deps.fetchEffectivePolicy(surveyId, feature)
    assertHostingAllowed({ effective: effective ?? OFF_POLICY, dataClass, hostingClass })
    passedAt = Date.now()
  }
}

// the gateway allows AI_RATE_LIMIT_PER_MINUTE calls a minute: a limited call waits and tries again
export const AI_BATCH_RATE_LIMIT_WAIT_MS = 20000
const AI_BATCH_RATE_LIMIT_RETRIES = 3

/**
 * Waits `ms`, or less when the signal aborts.
 * @param {number} ms - Time to wait.
 * @param {AbortSignal} [signal] - Cancellation signal.
 * @returns {Promise<void>} Settles after the wait or at the abort.
 */
const waitUnlessAborted = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise<void>((resolve) => {
    const onAbort = () => {
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })

type StopCause = Pick<AiBatchStop, 'cause' | 'error'>

// failedSize: what the call tried and failed; notRunSize: what a stop kept it from trying; succeeded: a result was kept
type CallOutcome = { stop?: StopCause; succeeded: boolean; failedSize: number; notRunSize: number }

// the task keys of an answer that could not be used (the model's output was cut off or is not the expected JSON)
const UNUSABLE_ANSWER_KEYS: ReadonlySet<string> = new Set(['aiTranslationInvalid', 'aiDataDictionaryInvalid'])

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
 * @param {number} params.rateLimitWaitMs - How long to wait before repeating a call the gateway rate-limited.
 * @returns {Promise<CallOutcome>} What succeeded and failed (counted, the run goes on), and the cause that stops the run.
 */
const runCall = async <T>({
  call,
  index,
  guard,
  onResult,
  signal,
  rateLimitWaitMs,
}: {
  call: AiBatchCall<T>
  index: number
  guard: AiBatchGuard
  onResult: (result: T, index: number) => void
  signal?: AbortSignal
  rateLimitWaitMs: number
}): Promise<CallOutcome> => {
  const cancelled: StopCause = { cause: 'cancelled' }
  const stopped = (stop: StopCause): CallOutcome => ({ stop, succeeded: false, failedSize: 0, notRunSize: call.size })
  if (signal?.aborted) return stopped(cancelled)
  try {
    // a switch or policy change during the run stops it before the next call
    await guardUnlessAborted(guard, signal)
  } catch (error) {
    return stopped(signal?.aborted ? cancelled : { cause: 'error', error })
  }
  if (signal?.aborted) return stopped(cancelled)
  for (let retries = 0; ; retries += 1) {
    try {
      onResult(await call.run(signal), index)
      return { succeeded: true, failedSize: 0, notRunSize: 0 }
    } catch (error) {
      switch (afterCallError({ error, retries, signal, canSplit: Boolean(call.split) })) {
        case 'cancelled':
          return stopped(cancelled)
        case 'stop':
          return stopped({ cause: 'error', error })
        case 'split':
          // repeating the same call would get the same cut-off answer: run each half instead
          return runHalves({ halves: call.split?.() ?? [], index, guard, onResult, signal, rateLimitWaitMs })
        case 'failed':
          return { succeeded: false, failedSize: call.size, notRunSize: 0 }
        default:
          await waitUnlessAborted(rateLimitWaitMs, signal)
          if (signal?.aborted) return stopped(cancelled)
      }
    }
  }
}

/**
 * Decides what follows a failed call.
 * @param {object} params - Parameters.
 * @param {unknown} params.error - What the call threw.
 * @param {number} params.retries - Repeats already made after a rate limit.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @param {boolean} params.canSplit - Whether the call can be split in halves.
 * @returns {string} cancelled, retry (after a wait), stop (the run), split (run the halves) or failed (go on).
 */
const afterCallError = ({
  error,
  retries,
  signal,
  canSplit,
}: {
  error: unknown
  retries: number
  signal?: AbortSignal
  canSplit: boolean
}): 'cancelled' | 'retry' | 'stop' | 'split' | 'failed' => {
  // what the HTTP client throws when its request is aborted is not always an AbortError
  if (signal?.aborted || isAiAbortError(error)) return 'cancelled'
  const key = getAiErrorKey(error)
  if (key === 'aiRateLimited' && retries < AI_BATCH_RATE_LIMIT_RETRIES) return 'retry'
  if (isRunStoppingError(error)) return 'stop'
  if (key !== null && UNUSABLE_ANSWER_KEYS.has(key) && canSplit) return 'split'
  return 'failed'
}

/**
 * Runs the halves of a split call one after the other; a stop leaves the rest of the halves not run.
 * @param {object} params - Parameters of runCall, with the halves instead of the call.
 * @returns {Promise<CallOutcome>} The outcomes of the halves, summed.
 */
const runHalves = async <T>({
  halves,
  ...params
}: {
  halves: AiBatchCall<T>[]
  index: number
  guard: AiBatchGuard
  onResult: (result: T, index: number) => void
  signal?: AbortSignal
  rateLimitWaitMs: number
}): Promise<CallOutcome> => {
  const total: CallOutcome = { succeeded: false, failedSize: 0, notRunSize: 0 }
  for (const [position, half] of halves.entries()) {
    const outcome = await runCall({ call: half, ...params })
    total.succeeded ||= outcome.succeeded
    total.failedSize += outcome.failedSize
    total.notRunSize += outcome.notRunSize
    if (outcome.stop) {
      total.stop = outcome.stop
      total.notRunSize += halves.slice(position + 1).reduce((sum, notRun) => sum + notRun.size, 0)
      return total
    }
  }
  return total
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
 * @param {number} [params.rateLimitWaitMs] - Wait before repeating a rate-limited call (3 repeats, then the run stops).
 * @returns {Promise<AiBatchRunResult>} The summed size of the failed calls and of the calls not run, and the stop.
 */
export const runAiBatchCalls = async <T>({
  calls,
  guard,
  onResult,
  onProgress,
  signal,
  rateLimitWaitMs = AI_BATCH_RATE_LIMIT_WAIT_MS,
}: {
  calls: AiBatchCall<T>[]
  guard: AiBatchGuard
  onResult: (result: T, index: number) => void
  onProgress?: (progress: AiBatchProgress) => void
  signal?: AbortSignal
  rateLimitWaitMs?: number
}): Promise<AiBatchRunResult> => {
  const total = calls.length
  let failedCount = 0
  let succeededCount = 0
  onProgress?.({ done: 0, total })
  for (const [index, call] of calls.entries()) {
    const { stop, succeeded, failedSize, notRunSize } = await runCall({
      call,
      index,
      guard,
      onResult,
      signal,
      rateLimitWaitMs,
    })
    if (succeeded) succeededCount += 1
    failedCount += failedSize
    if (stop) {
      if (succeededCount === 0) throw stop.cause === 'error' ? stop.error : createAbortError()
      const notRunCount = calls.slice(index + 1).reduce((sum, notRun) => sum + notRun.size, notRunSize)
      return { failedCount: failedCount + notRunCount, notRunCount, stop: { ...stop, done: index, total } }
    }
    onProgress?.({ done: index + 1, total })
  }
  return { failedCount, notRunCount: 0, stop: null }
}
