/**
 * Context meter of the assistant chat (pure): how much of the model's context the conversation uses, from the latest
 * answer that has a usage.
 */
import type { AssistantMessageUsage, ConversationMessage } from '@webapp/ai/conversations/types'

export const CONTEXT_WARNING_RATIO = 0.8
export const CONTEXT_CRITICAL_RATIO = 0.95

export type ContextMeterLevel = 'normal' | 'warning' | 'critical'

export type ContextMeter = {
  contextTokens: number
  windowTokens: number | null
  // share of the window, 0–1 (null without a window)
  ratio: number | null
  // aria-valuenow of the bar: the tokens, at most the window
  barValue: number | null
  level: ContextMeterLevel
  estimated: boolean
  windowAssumed: boolean
  historyTrimmed: boolean
  usedText: string
  windowText: string | null
}

type Translate = (key: string, params?: Record<string, unknown>) => string

const COMPACT: Intl.NumberFormatOptions = { notation: 'compact', maximumFractionDigits: 1 }

/**
 * Returns the usage of the latest answer that has one.
 * @param {ConversationMessage[]} messages - Conversation messages.
 * @returns {AssistantMessageUsage|null} The usage, or null.
 */
export const getLatestUsage = (messages: ConversationMessage[]): AssistantMessageUsage | null => {
  for (const message of [...messages].reverse()) {
    if (message.role === 'assistant' && message.usage) return message.usage
  }
  return null
}

/**
 * Returns the level of a window share.
 * @param {number|null} ratio - Share of the window (null: no window).
 * @returns {ContextMeterLevel} normal, warning (from 80 %) or critical (from 95 %).
 */
export const getContextMeterLevel = (ratio: number | null): ContextMeterLevel => {
  if (ratio === null) return 'normal'
  if (ratio >= CONTEXT_CRITICAL_RATIO) return 'critical'
  return ratio >= CONTEXT_WARNING_RATIO ? 'warning' : 'normal'
}

/**
 * Formats a token count in compact notation.
 * @param {number} tokens - Tokens.
 * @param {string} lang - UI language.
 * @returns {string} For example 12.4K in English.
 */
export const formatTokenCount = (tokens: number, lang: string): string => {
  try {
    return new Intl.NumberFormat(lang, COMPACT).format(tokens)
  } catch {
    // an invalid language tag
    return new Intl.NumberFormat('en', COMPACT).format(tokens)
  }
}

/**
 * Builds the meter of a conversation.
 * @param {object} params - Parameters.
 * @param {ConversationMessage[]} params.messages - Conversation messages.
 * @param {string} params.lang - UI language.
 * @returns {ContextMeter|null} The meter, or null before the first answer with a usage.
 */
export const buildContextMeter = ({
  messages,
  lang,
}: {
  messages: ConversationMessage[]
  lang: string
}): ContextMeter | null => {
  const usage = getLatestUsage(messages)
  if (!usage) return null
  const { contextTokens } = usage
  const windowTokens = usage.windowTokens !== null && usage.windowTokens > 0 ? usage.windowTokens : null
  const ratio = windowTokens === null ? null : Math.min(1, contextTokens / windowTokens)
  return {
    contextTokens,
    windowTokens,
    ratio,
    barValue: windowTokens === null ? null : Math.min(contextTokens, windowTokens),
    level: getContextMeterLevel(ratio),
    estimated: usage.estimated,
    windowAssumed: windowTokens !== null && usage.windowAssumed === true,
    historyTrimmed: usage.historyTrimmed,
    usedText: formatTokenCount(contextTokens, lang),
    windowText: windowTokens === null ? null : formatTokenCount(windowTokens, lang),
  }
}

/**
 * Returns the text of the meter.
 * @param {object} params - Parameters.
 * @param {ContextMeter} params.meter - Meter.
 * @param {Function} params.t - Translation function.
 * @returns {string} For example "≈ 6K / 8.2K tokens (assumed)".
 */
export const getContextMeterText = ({ meter, t }: { meter: ContextMeter; t: Translate }): string => {
  const base =
    meter.windowText === null
      ? t('aiAssistant.context.tokens', { used: meter.usedText })
      : t('aiAssistant.context.tokensOfWindow', { used: meter.usedText, window: meter.windowText })
  const withAssumed = meter.windowAssumed ? `${base} ${t('aiAssistant.context.assumed')}` : base
  return meter.estimated ? `≈ ${withAssumed}` : withAssumed
}
