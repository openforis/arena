/**
 * Model calls made by the server (jobs, admin ping): `generate` for plain text and `generateStructured` for an
 * object validated against a zod schema. Each call checks the feature gate and the prompt size, resolves the
 * model, checks the survey AI policy (before the provider is called) and records telemetry.
 */
import { generateObject, generateText } from 'ai'

import { ENV } from '@core/processUtils'
import SystemError from '@core/systemError'
import { getAiFeature } from '@common/ai/features'

import * as AiTelemetry from './aiTelemetry'
import { assertFeatureEnabled } from './featureGate'
import { assertPolicyAllows } from './gateway/policy'
import * as ProviderResolver from './providerResolver'

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
 * @param {AbortSignal} [args.signal] - Optional cancellation signal.
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
  return AiTelemetry.track(buildContext({ user, feature, meta }), () =>
    generateText({ model, prompt, system, abortSignal: signal })
  )
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
 * @param {AbortSignal} [args.signal] - Optional cancellation signal.
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
  return AiTelemetry.track(buildContext({ user, feature, meta }), () =>
    generateObject({ model, prompt, system, schema, abortSignal: signal })
  )
}
