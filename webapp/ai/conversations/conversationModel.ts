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
 * Returns the history title of a conversation from its first user message.
 * @param {string} text - First user message.
 * @returns {string} The first line, at most 60 characters.
 */
export const toConversationTitle = (text: string): string => {
  const firstLine = text.trim().split('\n')[0].trim()
  return firstLine.length > TITLE_MAX_CHARS ? `${firstLine.slice(0, TITLE_MAX_CHARS - 1)}…` : firstLine
}
