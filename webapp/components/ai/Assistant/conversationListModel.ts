/**
 * Conversation list of the assistant panel (pure): search by title, groups by day and the time shown on each row.
 */
import type { Conversation } from '@webapp/ai/conversations/types'

export type ConversationDayKey = 'today' | 'yesterday' | 'earlier'

export type ConversationDayGroup = { key: ConversationDayKey; items: Conversation[] }

// rows of the start screen's Recent conversations
export const START_SCREEN_RECENT_COUNT = 3

const DAY_KEYS: ConversationDayKey[] = ['today', 'yesterday', 'earlier']

const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }

/**
 * Returns the local midnight of a day, a number of days before the given date.
 * @param {Date} date - Reference date.
 * @param {number} daysBefore - Days to go back.
 * @returns {number} The time of that midnight.
 */
const midnight = (date: Date, daysBefore: number): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysBefore).getTime()

/**
 * Returns the day group of a conversation, in local time.
 * @param {object} params - Parameters.
 * @param {string} params.updatedAt - Last update (ISO).
 * @param {Date} params.now - Current time.
 * @returns {ConversationDayKey} today (also for a later time), yesterday or earlier.
 */
export const getConversationDayKey = ({ updatedAt, now }: { updatedAt: string; now: Date }): ConversationDayKey => {
  const time = new Date(updatedAt).getTime()
  if (time >= midnight(now, 0)) return 'today'
  return time >= midnight(now, 1) ? 'yesterday' : 'earlier'
}

/**
 * Returns the conversations whose title contains the query.
 * @param {object} params - Parameters.
 * @param {Conversation[]} params.conversations - Conversations.
 * @param {string} params.query - Typed search (case and surrounding spaces ignored).
 * @returns {Conversation[]} The matching conversations; all of them for a blank query.
 */
export const filterConversations = ({
  conversations,
  query,
}: {
  conversations: Conversation[]
  query: string
}): Conversation[] => {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return conversations
  return conversations.filter((item) => item.title.toLocaleLowerCase().includes(needle))
}

/**
 * Groups conversations by day, newest first in each group.
 * @param {object} params - Parameters.
 * @param {Conversation[]} params.conversations - Conversations.
 * @param {Date} params.now - Current time.
 * @returns {ConversationDayGroup[]} Today, yesterday and earlier, without the empty groups.
 */
export const groupConversationsByDay = ({
  conversations,
  now,
}: {
  conversations: Conversation[]
  now: Date
}): ConversationDayGroup[] => {
  const newestFirst = [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const byKey = new Map<ConversationDayKey, Conversation[]>()
  for (const item of newestFirst) {
    const key = getConversationDayKey({ updatedAt: item.updatedAt, now })
    byKey.set(key, [...(byKey.get(key) ?? []), item])
  }
  return DAY_KEYS.flatMap((key) => {
    const items = byKey.get(key)
    return items ? [{ key, items }] : []
  })
}

/**
 * Returns how the time of a row is shown.
 * @param {object} params - Parameters.
 * @param {string} params.updatedAt - Last update (ISO).
 * @param {Date} params.now - Current time.
 * @returns {Intl.DateTimeFormatOptions} The time for today and yesterday, the date before.
 */
export const getConversationTimeFormat = ({
  updatedAt,
  now,
}: {
  updatedAt: string
  now: Date
}): Intl.DateTimeFormatOptions => (getConversationDayKey({ updatedAt, now }) === 'earlier' ? DATE_FORMAT : TIME_FORMAT)

/**
 * Formats the time of a row in the UI language.
 * @param {object} params - Parameters.
 * @param {string} params.updatedAt - Last update (ISO).
 * @param {Date} params.now - Current time.
 * @param {string} params.lang - UI language.
 * @returns {string} For example 14:52 or 3 Oct.
 */
export const formatConversationTime = ({
  updatedAt,
  now,
  lang,
}: {
  updatedAt: string
  now: Date
  lang: string
}): string => {
  const options = getConversationTimeFormat({ updatedAt, now })
  const date = new Date(updatedAt)
  try {
    return new Intl.DateTimeFormat(lang, options).format(date)
  } catch {
    // an invalid language tag
    return new Intl.DateTimeFormat('en', options).format(date)
  }
}
