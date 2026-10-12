import type { Conversation } from '@webapp/ai/conversations/types'
import {
  filterConversations,
  formatConversationTime,
  getConversationDayKey,
  getConversationTimeFormat,
  groupConversationsByDay,
  START_SCREEN_RECENT_COUNT,
} from '@webapp/components/ai/Assistant/conversationListModel'

// local times: the groups follow the user's day, not UTC
const at = (year: number, month: number, day: number, hour = 12, minute = 0): string =>
  new Date(year, month, day, hour, minute).toISOString()

const conversation = (id: string, title: string, updatedAt: string): Conversation =>
  ({ id, title, updatedAt }) as unknown as Conversation

describe('conversation list model (246)', () => {
  const now = new Date(2026, 9, 12, 15, 0)

  test('day keys follow local midnight', () => {
    expect(getConversationDayKey({ updatedAt: at(2026, 9, 12, 0, 0), now })).toBe('today')
    expect(getConversationDayKey({ updatedAt: at(2026, 9, 11, 23, 59), now })).toBe('yesterday')
    expect(getConversationDayKey({ updatedAt: at(2026, 9, 11, 0, 0), now })).toBe('yesterday')
    expect(getConversationDayKey({ updatedAt: at(2026, 9, 10, 23, 59), now })).toBe('earlier')
    // a clock slightly behind another device: a future time is still today
    expect(getConversationDayKey({ updatedAt: at(2026, 9, 13, 1, 0), now })).toBe('today')
  })

  test('yesterday crosses month and year ends', () => {
    expect(getConversationDayKey({ updatedAt: at(2026, 8, 30, 20), now: new Date(2026, 9, 1, 9) })).toBe('yesterday')
    expect(getConversationDayKey({ updatedAt: at(2025, 11, 31, 20), now: new Date(2026, 0, 1, 9) })).toBe('yesterday')
  })

  test('groups keep today, yesterday, earlier order, drop empty groups and sort newest first', () => {
    const conversations = [
      conversation('old', 'Old', at(2026, 8, 3)),
      conversation('t1', 'Morning', at(2026, 9, 12, 9)),
      conversation('t2', 'Afternoon', at(2026, 9, 12, 14)),
      conversation('older', 'Older', at(2026, 7, 28)),
    ]
    const groups = groupConversationsByDay({ conversations, now })
    expect(groups.map((group) => group.key)).toEqual(['today', 'earlier'])
    expect(groups[0].items.map((item) => item.id)).toEqual(['t2', 't1'])
    expect(groups[1].items.map((item) => item.id)).toEqual(['old', 'older'])
  })

  test('no conversations: no groups', () => {
    expect(groupConversationsByDay({ conversations: [], now })).toEqual([])
  })

  test('filter matches titles, ignoring case and surrounding spaces; blank returns all', () => {
    const conversations = [
      conversation('a', 'Change the label of cluster_id', at(2026, 9, 12)),
      conversation('b', 'Add French labels', at(2026, 9, 12)),
    ]
    expect(filterConversations({ conversations, query: '' })).toHaveLength(2)
    expect(filterConversations({ conversations, query: '   ' })).toHaveLength(2)
    expect(filterConversations({ conversations, query: ' FRENCH ' }).map((item) => item.id)).toEqual(['b'])
    expect(filterConversations({ conversations, query: 'label' }).map((item) => item.id)).toEqual(['a', 'b'])
    expect(filterConversations({ conversations, query: 'taxonomy' })).toEqual([])
  })

  test('today and yesterday show the time, earlier shows the date', () => {
    expect(getConversationTimeFormat({ updatedAt: at(2026, 9, 12, 9), now })).toEqual({
      hour: '2-digit',
      minute: '2-digit',
    })
    expect(getConversationTimeFormat({ updatedAt: at(2026, 9, 11, 9), now })).toEqual({
      hour: '2-digit',
      minute: '2-digit',
    })
    expect(getConversationTimeFormat({ updatedAt: at(2026, 9, 3), now })).toEqual({ day: 'numeric', month: 'short' })
  })

  test('formatting falls back to English on an invalid language tag', () => {
    const updatedAt = at(2026, 9, 3)
    expect(formatConversationTime({ updatedAt, now, lang: 'not a tag' })).toBe(
      formatConversationTime({ updatedAt, now, lang: 'en' })
    )
    expect(formatConversationTime({ updatedAt, now, lang: 'en' })).toMatch(/3/)
  })

  test('the start screen lists three conversations', () => {
    expect(START_SCREEN_RECENT_COUNT).toBe(3)
  })
})
