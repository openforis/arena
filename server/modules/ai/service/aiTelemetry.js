/**
 * Telemetry wrapper for every model call. Every AI request flows through
 * {@link track}, which records latency, token counts, and outcome via the
 * standard log4js logger.
 */
import * as Log from '@server/log/log'

const logger = Log.getLogger('AiGateway')

/**
 * Wraps an async model call so that latency, status, and token counts are
 * recorded uniformly. The wrapped function should resolve to an object that
 * may include `usage: { promptTokens, completionTokens }`.
 * @param {object} ctx - Telemetry context.
 * @param {string} ctx.feature - Feature key (e.g. "translation").
 * @param {string} ctx.source - One of "user" | "admin-default".
 * @param {string} ctx.provider - Provider key (openai | anthropic | google | openai-compatible).
 * @param {string} ctx.model - Model identifier.
 * @param {string} ctx.userUuid - User UUID making the request.
 * @param {Function} fn - The async work to time.
 * @returns {Promise<*>} Whatever fn resolves to.
 */
export const track = async (ctx, fn) => {
  const start = Date.now()
  try {
    const result = await fn()
    const latencyMs = Date.now() - start
    const usage = (result && result.usage) || {}
    const tokensIn = Number(usage.promptTokens || usage.inputTokens || 0)
    const tokensOut = Number(usage.completionTokens || usage.outputTokens || 0)

    if (logger.infoEnabled) {
      logger.info(
        `ok feature=${ctx.feature} source=${ctx.source} provider=${ctx.provider} ` +
          `model=${ctx.model} user=${ctx.userUuid} latencyMs=${latencyMs} ` +
          `tokensIn=${tokensIn} tokensOut=${tokensOut}`
      )
    }

    return result
  } catch (error) {
    const latencyMs = Date.now() - start
    logger.error(
      `fail feature=${ctx.feature} source=${ctx.source} provider=${ctx.provider} ` +
        `model=${ctx.model} user=${ctx.userUuid} latencyMs=${latencyMs} ` +
        `error=${error?.message || error}`
    )
    throw error
  }
}
