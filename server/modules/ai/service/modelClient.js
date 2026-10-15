/**
 * Model calls made by the server (the admin ping): `generate` for plain text and `generateStructured` for an
 * object validated against a zod schema. Each call checks the feature gate and the prompt size, resolves the
 * model, checks the survey AI policy (before the provider is called) and records telemetry.
 */
import { generateObject, generateText } from 'ai'

import { ENV } from '@core/processUtils'
import SystemError from '@core/systemError'
import { getAiFeature } from '@common/ai/features'

import * as Log from '@server/log/log'

import * as AiTelemetry from './aiTelemetry'
import { assertFeatureEnabled } from './featureGate'
import { formatErrorForLog, toAiSystemError } from './gateway/errorMapping'
import { assertPolicyAllows } from './gateway/policy'
import * as ProviderResolver from './providerResolver'

const logger = Log.getLogger('AiModelClient')

const assertPromptSize = (prompt, system, feature) => {
  const total = (prompt?.length || 0) + (system?.length || 0)
  if (total > ENV.aiMaxPromptChars) {
    throw new SystemError('aiPromptTooLarge', { feature, size: total, limit: ENV.aiMaxPromptChars })
  }
}

const buildContext = ({ user, feature, meta }) => ({
  feature,
  source: meta.source,
  provider: meta.provider,
  model: meta.model,
  userUuid: user.uuid,
})

/**
 * Runs a model call with telemetry, under the timeout of model calls and the cancellation signal of the caller. A
 * failure is sent on as an error key: what the provider or the network said goes to the server log only.
 * @param {object} args - Args.
 * @param {object} args.ctx - Telemetry context.
 * @param {AbortSignal} [args.signal] - Cancellation signal of the caller.
 * @param {(abortSignal: AbortSignal) => Promise<*>} args.call - Makes the call, with the signal that stops it.
 * @returns {Promise<*>} The result of the call.
 * @throws {SystemError} An error key (`aiRequestTimeout` when the timeout stopped the call).
 */
const callModel = async ({ ctx, signal, call }) => {
  const timeout = AbortSignal.timeout(ENV.aiRequestTimeoutMs)
  const abortSignal = signal ? AbortSignal.any([signal, timeout]) : timeout
  try {
    return await AiTelemetry.track(ctx, () => call(abortSignal))
  } catch (error) {
    // the caller cancelled: nobody waits for an error key
    if (signal?.aborted) throw error
    if (!(error instanceof SystemError)) logger.warn(formatErrorForLog(ctx.feature, error))
    throw toAiSystemError(error, { timedOut: timeout.aborted })
  }
}

/**
 * Production dependencies; tests pass their own.
 * @returns {{resolveModel: Function, assertPolicyAllows: Function, gateEnv: object|undefined}} The dependencies.
 */
export const createDefaultModelClientDeps = () => ({
  resolveModel: ProviderResolver.resolveModelForUser,
  assertPolicyAllows,
  gateEnv: undefined, // featureGate defaults to ENV
})

// null means "no survey" (ceilings only); undefined means a caller was not updated for the survey AI policy
const assertSurveyIdGiven = (surveyId, feature) => {
  if (surveyId === undefined) {
    throw new Error(`ModelClient: surveyId is required for feature ${feature} (pass null when there is no survey)`)
  }
}

const prepareModel = async ({ user, feature, surveyId }, deps) => {
  const { model, meta } = await deps.resolveModel({ user, feature })
  await deps.assertPolicyAllows({
    surveyId: surveyId === null ? null : Number(surveyId),
    // unknown features get the stricter class
    dataClass: getAiFeature(feature)?.dataClass ?? 'data',
    hostingClass: meta.hostingClass ?? null,
  })
  return { model, meta }
}

/**
 * One-shot text generation.
 * @param {object} args - Args.
 * @param {object} args.user - Arena user.
 * @param {string} args.feature - Feature key (e.g. "translation").
 * @param {number|null} args.surveyId - Survey whose content is sent (null when there is none).
 * @param {string} args.prompt - User prompt.
 * @param {string} [args.system] - Optional system prompt.
 * @param {AbortSignal} [args.signal] - Optional cancellation signal (the timeout of model calls applies too).
 * @param {object} [deps] - Dependencies (tests).
 * @returns {Promise<{text: string, usage: object, finishReason: string}>} AI SDK result.
 */
export const generate = async (
  { user, feature, surveyId, prompt, system, signal },
  deps = createDefaultModelClientDeps()
) => {
  assertSurveyIdGiven(surveyId, feature)
  assertFeatureEnabled(feature, user, deps.gateEnv)
  assertPromptSize(prompt, system, feature)
  const { model, meta } = await prepareModel({ user, feature, surveyId }, deps)
  return callModel({
    ctx: buildContext({ user, feature, meta }),
    signal,
    call: (abortSignal) => generateText({ model, prompt, system, abortSignal }),
  })
}

/**
 * Structured generation: the output is validated against the zod schema.
 * @param {object} args - Args.
 * @param {object} args.user - Arena user.
 * @param {string} args.feature - Feature key.
 * @param {number|null} args.surveyId - Survey whose content is sent (null when there is none).
 * @param {string} args.prompt - User prompt.
 * @param {string} [args.system] - Optional system prompt.
 * @param {object} args.schema - Zod schema describing the desired object.
 * @param {AbortSignal} [args.signal] - Optional cancellation signal (the timeout of model calls applies too).
 * @param {object} [deps] - Dependencies (tests).
 * @returns {Promise<{object: *, usage: object, finishReason: string}>} AI SDK result.
 */
export const generateStructured = async (
  { user, feature, surveyId, prompt, system, schema, signal },
  deps = createDefaultModelClientDeps()
) => {
  assertSurveyIdGiven(surveyId, feature)
  assertFeatureEnabled(feature, user, deps.gateEnv)
  assertPromptSize(prompt, system, feature)
  if (!schema) throw new SystemError('aiSchemaMissing', { feature })
  const { model, meta } = await prepareModel({ user, feature, surveyId }, deps)
  return callModel({
    ctx: buildContext({ user, feature, meta }),
    signal,
    call: (abortSignal) => generateObject({ model, prompt, system, schema, abortSignal }),
  })
}
