/**
 * Level of content an assistant conversation sends to the model (pure), shown by the composer footer's chip.
 */
import { getConversationDataClass } from '@webapp/ai/conversations/dataClass'

import type { AssistantArea } from './assistantAreas'

// from the least to the most sensitive
export type SentDataLevel = 'questions' | 'schema' | 'data'

// before the first message: Cleaning has record content from its first turn
const startingLevels: Record<AssistantArea, SentDataLevel> = {
  help: 'questions',
  design: 'schema',
  analysis: 'schema',
  cleaning: 'data',
}

/**
 * Returns what the conversation of an area sends.
 * @param {object} params - Parameters.
 * @param {AssistantArea} params.area - Area of the panel.
 * @param {object|null} params.conversation - Open conversation (null before the first message).
 * @returns {SentDataLevel} questions for Help (no survey content), else the conversation's data class.
 */
export const getSentDataLevel = ({
  area,
  conversation,
}: {
  area: AssistantArea
  conversation: { dataClass?: unknown } | null
}): SentDataLevel => {
  if (area === 'help') return 'questions'
  if (!conversation) return startingLevels[area]
  return getConversationDataClass(conversation)
}
