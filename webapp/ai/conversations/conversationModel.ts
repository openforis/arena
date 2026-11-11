import { uuidv4 } from '@core/uuid'

import type { AiToolArea } from '@webapp/ai/tools/types'

import type { Conversation } from './types'

const TITLE_MAX_CHARS = 60

/**
 * Returns the IndexedDB key of a survey id.
 * @param {number|null} surveyId - Survey id.
 * @returns {number} The id, or 0 without survey.
 */
export const toSurveyKey = (surveyId: number | null): number => surveyId ?? 0

/**
 * Creates an empty conversation.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - Owner.
 * @param {number|null} params.surveyId - Current survey.
 * @param {AiToolArea} params.area - Area.
 * @param {Date} [params.now] - Creation date.
 * @param {Function} [params.idFactory] - Id generator.
 * @returns {Conversation} The conversation.
 */
export const createConversation = ({
  userUuid,
  surveyId,
  area,
  now = new Date(),
  idFactory = uuidv4,
}: {
  userUuid: string
  surveyId: number | null
  area: AiToolArea
  now?: Date
  idFactory?: () => string
}): Conversation => ({
  id: idFactory(),
  userUuid,
  surveyId,
  surveyKey: toSurveyKey(surveyId),
  area,
  dataClass: 'schema',
  title: '',
  messages: [],
  changeSets: {},
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
})

/**
 * Returns the conversation with the provider picked in the chat.
 * @param {object} params - Parameters.
 * @param {Conversation} params.conversation - Conversation.
 * @param {string} params.providerId - Provider id.
 * @returns {Conversation} The conversation (its history order is unchanged: updatedAt is kept).
 */
export const withConversationProvider = ({
  conversation,
  providerId,
}: {
  conversation: Conversation
  providerId: string
}): Conversation => ({ ...conversation, providerId })

/**
 * Returns the history title of a conversation from its first user message.
 * @param {string} text - First user message.
 * @returns {string} The first line, at most 60 characters.
 */
export const toConversationTitle = (text: string): string => {
  const firstLine = text.trim().split('\n')[0].trim()
  return firstLine.length > TITLE_MAX_CHARS ? `${firstLine.slice(0, TITLE_MAX_CHARS - 1)}…` : firstLine
}

// quotes and markdown emphasis models wrap titles in
const TITLE_WRAPPER_CHARS = '"\'`*_«»“”‘’'

/**
 * Removes the wrapping characters and spaces at the start (also `#`) and at the end of a title.
 * @param {string} title - The title.
 * @returns {string} The title without them.
 */
const stripTitleWrappers = (title: string): string => {
  const isWrapper = (char: string) => TITLE_WRAPPER_CHARS.includes(char) || /\s/.test(char)
  let start = 0
  let end = title.length
  while (start < end && (isWrapper(title[start]) || title[start] === '#')) start += 1
  while (end > start && isWrapper(title[end - 1])) end -= 1
  return title.slice(start, end)
}

/**
 * Removes the periods at the end of a title.
 * @param {string} title - The title.
 * @returns {string} The title without them.
 */
const stripFinalPeriods = (title: string): string => {
  let end = title.length
  while (end > 0 && (title[end - 1] === '.' || title[end - 1] === '。')) end -= 1
  return title.slice(0, end)
}

/**
 * Cleans a title written by the model: one line, without wrapping quotes or emphasis, no final period.
 * @param {string} title - Model title.
 * @returns {string} The title, at most 60 characters (empty when nothing is left).
 */
export const cleanConversationTitle = (title: string): string => {
  const oneLine = stripTitleWrappers(title.replaceAll(/\s+/g, ' '))
  return toConversationTitle(stripTitleWrappers(stripFinalPeriods(oneLine)))
}
