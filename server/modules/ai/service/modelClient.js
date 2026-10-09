/**
 * Single entry point that every Tier-1 AI feature calls. Hides the
 * provider plumbing behind two Vercel-AI-SDK-shaped methods: `generate`
 * for plain text and `generateStructured` for JSON validated against a Zod
 * schema.
 *
 * Each method:
 *   1. Resolves the model via `providerResolver` (user → admin → 503).
 *   2. Enforces the global prompt-character cap (`AI_MAX_PROMPT_CHARS`).
 *   3. Wraps the call in `aiTelemetry.track` so latency, tokens, and
 *      outcome are recorded uniformly.
 */
import { generateObject, generateText } from 'ai'

import { ENV } from '@core/processUtils'

import SystemError from '@core/systemError'

import * as AiTelemetry from './aiTelemetry'
import { assertFeatureEnabled } from './featureGate'
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
 * One-shot text generation.
 * @param {object} args - Args.
 * @param {object} args.user - Arena user.
 * @param {string} args.feature - Feature key (e.g. "expressionExplain").
 * @param {string} args.prompt - User prompt.
 * @param {string} [args.system] - Optional system prompt.
 * @param {AbortSignal} [args.signal] - Optional cancellation signal.
 * @returns {Promise<{text: string, usage: object, finishReason: string}>} Vercel AI SDK result.
 */
export const generate = async ({ user, feature, prompt, system, signal }) => {
  assertFeatureEnabled(feature, user)
  assertPromptSize(prompt, system, feature)
  const { model, meta } = await ProviderResolver.resolveModelForUser({ user, feature })
  return AiTelemetry.track(buildContext({ user, feature, meta }), () =>
    generateText({
      model,
      prompt,
      system,
      abortSignal: signal,
    })
  )
}

/**
 * Structured generation. The model output is validated against the Zod
 * schema before being returned; on schema mismatch the SDK throws.
 * @param {object} args - Args.
 * @param {object} args.user - Arena user.
 * @param {string} args.feature - Feature key.
 * @param {string} args.prompt - User prompt.
 * @param {string} [args.system] - Optional system prompt.
 * @param {object} args.schema - Zod schema describing the desired object.
 * @param {AbortSignal} [args.signal] - Optional cancellation signal.
 * @returns {Promise<{object: *, usage: object, finishReason: string}>} Vercel AI SDK result.
 */
export const generateStructured = async ({ user, feature, prompt, system, schema, signal }) => {
  assertFeatureEnabled(feature, user)
  assertPromptSize(prompt, system, feature)
  if (!schema) throw new SystemError('aiSchemaMissing', { feature })
  const { model, meta } = await ProviderResolver.resolveModelForUser({ user, feature })
  return AiTelemetry.track(buildContext({ user, feature, meta }), () =>
    generateObject({
      model,
      prompt,
      system,
      schema,
      abortSignal: signal,
    })
  )
}
