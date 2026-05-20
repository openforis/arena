/**
 * Single entry point that every Tier-1 AI feature calls. Hides the
 * provider plumbing behind three Vercel-AI-SDK-shaped methods: `generate`
 * for plain text, `generateStructured` for JSON validated against a Zod
 * schema, and `stream` for token-by-token streaming.
 *
 * Each method:
 *   1. Resolves the model via `providerResolver` (user → admin → 503).
 *   2. Enforces the global prompt-character cap (`AI_MAX_PROMPT_CHARS`).
 *   3. Wraps the call in `aiTelemetry.track` so latency, tokens, and
 *      outcome are recorded uniformly.
 */
import { generateObject, generateText, streamText } from 'ai'

import { ENV } from '@core/processUtils'

import SystemError from '@core/systemError'

import * as AiSettingsService from './aiSettingsService'
import * as AiTelemetry from './aiTelemetry'
import * as ProviderResolver from './providerResolver'

// Maps each Tier-1 feature key to the user-facing category it belongs to
// (see `featureCategories` in aiSettingsService). Unknown features fall
// through to the ENV check only — add new feature keys here when they
// ship.
const featureToCategory = {
  chatbot: AiSettingsService.featureCategories.chat,
  translation: AiSettingsService.featureCategories.translation,
  expressionGenerate: AiSettingsService.featureCategories.expressions,
  expressionExplain: AiSettingsService.featureCategories.expressions,
  activityLogSummary: AiSettingsService.featureCategories.analysis,
  dataDictionary: AiSettingsService.featureCategories.analysis,
}

const assertFeaturesEnabled = (feature, user) => {
  if (!ENV.aiFeaturesEnabled) {
    throw new SystemError('aiFeaturesDisabled', { feature })
  }
  const flags = ENV.aiFeatureFlags
  if (flags && Object.prototype.hasOwnProperty.call(flags, feature) && !flags[feature]) {
    throw new SystemError('aiFeatureDisabled', { feature })
  }
  // User-level master + category gating (defense in depth: the UI hides
  // the entry-point button, but a direct API call still has to clear this
  // check).
  if (user) {
    if (!AiSettingsService.areFeaturesEnabledForUser(user)) {
      throw new SystemError('aiFeaturesDisabled', { feature })
    }
    const category = featureToCategory[feature]
    if (category && !AiSettingsService.isCategoryEnabledForUser(user, category)) {
      throw new SystemError('aiFeatureDisabled', { feature })
    }
  }
}

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
  assertFeaturesEnabled(feature, user)
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
  assertFeaturesEnabled(feature, user)
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

/**
 * Multi-turn streaming chat. Like {@link stream} but accepts a Vercel AI
 * SDK v4 `messages` array (`[{role, content}]`) for back-and-forth
 * conversations. Routed through the same per-user provider resolution and
 * telemetry path as the single-shot calls. Used by the documentation
 * chatbot.
 * @param {object} args - Args.
 * @param {object} args.user - Arena user.
 * @param {string} args.feature - Feature key (e.g. "chatbot").
 * @param {Array<{role: string, content: string}>} args.messages - Conversation history.
 * @param {string} [args.system] - Optional system prompt.
 * @param {AbortSignal} [args.signal] - Optional cancellation signal.
 * @returns {Promise<{textStream: AsyncIterable<string>, usage: Promise<object>}>}
 *   The SDK stream result.
 */
export const streamChat = async ({ user, feature, messages, system, signal }) => {
  assertFeaturesEnabled(feature, user)
  const totalChars =
    (messages || []).reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : 0), 0) +
    (system?.length || 0)
  if (totalChars > ENV.aiMaxPromptChars) {
    throw new SystemError('aiPromptTooLarge', { feature, size: totalChars, limit: ENV.aiMaxPromptChars })
  }
  const { model, meta } = await ProviderResolver.resolveModelForUser({ user, feature })
  const ctx = buildContext({ user, feature, meta })
  const start = Date.now()
  const result = streamText({
    model,
    messages,
    system,
    abortSignal: signal,
  })
  result.usage
    .then(async (usage) => {
      await AiTelemetry.track({ ...ctx }, async () => ({ usage }))
    })
    .catch(() => {})
  result._aiStartedAt = start
  return result
}

/**
 * Streaming text generation. Returns the Vercel AI SDK stream handle whose
 * `textStream` async-iterates over chunks. Telemetry is recorded once the
 * stream completes, and the final usage block is awaited via `.usage`.
 * @param {object} args - Args.
 * @param {object} args.user - Arena user.
 * @param {string} args.feature - Feature key.
 * @param {string} args.prompt - User prompt.
 * @param {string} [args.system] - Optional system prompt.
 * @param {AbortSignal} [args.signal] - Optional cancellation signal.
 * @returns {Promise<{textStream: AsyncIterable<string>, usage: Promise<object>}>}
 *   The SDK stream result; callers iterate `textStream` and may await `.usage`.
 */
export const stream = async ({ user, feature, prompt, system, signal }) => {
  assertFeaturesEnabled(feature, user)
  assertPromptSize(prompt, system, feature)
  const { model, meta } = await ProviderResolver.resolveModelForUser({ user, feature })
  const ctx = buildContext({ user, feature, meta })
  const start = Date.now()
  const result = streamText({
    model,
    prompt,
    system,
    abortSignal: signal,
  })
  // Fire-and-forget telemetry once the stream finishes.
  result.usage
    .then(async (usage) => {
      await AiTelemetry.track({ ...ctx }, async () => ({ usage }))
    })
    .catch(() => {
      // The error path is handled by the route's stream consumer; suppress
      // here to avoid an unhandled-rejection warning on cancellation.
    })
  // Annotate the returned object so route handlers can log start time if needed.
  result._aiStartedAt = start
  return result
}
