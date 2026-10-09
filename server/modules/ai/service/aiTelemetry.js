/**
 * Telemetry wrapper for every model call. Every AI request flows through
 * {@link track} or {@link record}, which records latency, token counts, and outcome via the
 * standard log4js logger.
 */
import { formatCapabilityStats } from '@common/ai/capabilityStats'

import * as Log from '@server/log/log'

const logger = Log.getLogger('AiGateway')

const toCount = (value) => {
  const count = typeof value === 'object' && value !== null ? value.total : value
  return Number.isFinite(Number(count)) ? Number(count) : 0
}

/**
 * Reads token counts from any usage shape: v4 provider (nested `total`), AI SDK result (flat) or legacy.
 * @param {object} [usage] - Usage object.
 * @returns {{tokensIn: number, tokensOut: number}} Token counts (0 when unknown).
 */
export const normalizeUsage = (usage) => ({
  tokensIn: toCount(usage?.inputTokens ?? usage?.promptTokens),
  tokensOut: toCount(usage?.outputTokens ?? usage?.completionTokens),
})

const describeContext = (ctx) =>
  `feature=${ctx.feature} source=${ctx.source} provider=${ctx.provider} model=${ctx.model} user=${ctx.userUuid}`

/**
 * Logs the outcome of one model call (exactly one line per call).
 * @param {object} ctx - Telemetry context: feature, source, provider (openai | anthropic | google |
 *   openai-compatible | vercel-ai-sdk | mock), model, userUuid.
 * @param {object} outcome - Outcome.
 * @param {number} outcome.latencyMs - Duration.
 * @param {object} [outcome.usage] - Usage, any shape (see normalizeUsage).
 * @param {Error} [outcome.error] - Error, when the call failed or was aborted.
 * @returns {void}
 */
export const record = (ctx, { latencyMs, usage, error }) => {
  if (error) {
    logger.error(`fail ${describeContext(ctx)} latencyMs=${latencyMs} error=${error?.message || error}`)
    return
  }
  if (!logger.infoEnabled) return
  const { tokensIn, tokensOut } = normalizeUsage(usage)
  logger.info(`ok ${describeContext(ctx)} latencyMs=${latencyMs} tokensIn=${tokensIn} tokensOut=${tokensOut}`)
}

/**
 * Wraps an async model call so that latency, status, and token counts are recorded uniformly.
 * @param {object} ctx - Telemetry context (see record).
 * @param {Function} fn - The async work to time; may resolve to an object with `usage`.
 * @returns {Promise<*>} Whatever fn resolves to.
 */
export const track = async (ctx, fn) => {
  const start = Date.now()
  try {
    const result = await fn()
    record(ctx, { latencyMs: Date.now() - start, usage: result?.usage })
    return result
  } catch (error) {
    record(ctx, { latencyMs: Date.now() - start, error })
    throw error
  }
}

/**
 * Logs the anonymous capability statistics of one browser session (no user, URL or model).
 * @param {object} stats - Validated statistics (see common/ai/capabilityStats).
 * @returns {void}
 */
export const recordCapabilityStats = (stats) => {
  logger.info(`capabilityStats ${formatCapabilityStats(stats)}`)
}
