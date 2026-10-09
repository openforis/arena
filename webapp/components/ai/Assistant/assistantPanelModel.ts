/**
 * Pure helpers of the panel: tool row labels, Retry, Apply / Discard results stored in the conversation.
 */
import { uuidv4 } from '@core/uuid'

import type { OperationResult } from '@webapp/ai/changeSets/types'
import type { ApplyNoteMessage, Conversation, ConversationToolPart } from '@webapp/ai/conversations/types'
import type { AiTranslate } from '@webapp/ai/tools/types'

// told to the model on its next turn (APPLY_NOTE_PREFIX is added by buildHistory)
export const DISCARD_NOTE = 'The user discarded these proposed changes.'

const LABEL_PARAM_NAMES = ['name', 'text', 'query']

/**
 * Picks the tool input values a row label can show.
 * @param {unknown} input - Tool input.
 * @returns {Record<string, string>} The label parameters.
 */
const toLabelParams = (input: unknown): Record<string, string> => {
  const params: Record<string, string> = {}
  if (typeof input !== 'object' || input === null) return params
  for (const name of LABEL_PARAM_NAMES) {
    const value = (input as Record<string, unknown>)[name]
    if (typeof value === 'string') params[name] = value
  }
  return params
}

/**
 * Returns the label of a tool row ("Looked up tree_height"); tools without a label key get the default label.
 * @param {ConversationToolPart} part - Tool part.
 * @param {AiTranslate} t - Translator (returns the key when missing).
 * @returns {string} The label.
 */
export const getToolRowLabel = (part: ConversationToolPart, t: AiTranslate): string => {
  const key = `aiAssistant.tools.${part.toolName}`
  const label = t(key, toLabelParams(part.input))
  return label === key ? t('aiAssistant.tools.default') : label
}

/**
 * Returns the change set a propose tool handed to the conversation (its card goes under the tool row).
 * @param {ConversationToolPart} part - Tool part.
 * @returns {string|null} The change set id.
 */
export const getProposedChangeSetId = (part: ConversationToolPart): string | null => {
  const changeSetId = (part.output as { changeSetId?: unknown } | undefined)?.changeSetId
  return part.state === 'done' && typeof changeSetId === 'string' ? changeSetId : null
}

/**
 * Returns what Retry resends: the conversation without the failed pair, and the user message of that pair.
 * @param {Conversation} conversation - Conversation.
 * @returns {{base: Conversation, text: string}|null} Null when the last answer did not fail.
 */
export const getRetryBase = (conversation: Conversation): { base: Conversation; text: string } | null => {
  const { messages } = conversation
  const last = messages.at(-1)
  if (last?.role !== 'assistant' || last.status !== 'error') return null
  let index = messages.length - 1
  while (index >= 0 && messages[index].role !== 'user') index -= 1
  const userMessage = messages[index]
  if (userMessage?.role !== 'user') return null
  return { base: { ...conversation, messages: messages.slice(0, index) }, text: userMessage.text }
}

/**
 * Merges the results of a new Apply into the previous ones (an operation keeps its latest result).
 * @param {OperationResult[]} [previous] - Earlier results.
 * @param {OperationResult[]} next - New results.
 * @returns {OperationResult[]} The merged results.
 */
export const mergeOperationResults = (previous: OperationResult[] = [], next: OperationResult[]): OperationResult[] => {
  const byId = new Map(previous.map((result) => [result.id, result]))
  for (const result of next) byId.set(result.id, result)
  return [...byId.values()]
}

/**
 * Builds an apply note message.
 * @param {object} params - Parameters.
 * @param {string} params.text - Note.
 * @param {string} params.changeSetId - Card.
 * @param {string} params.now - Date.
 * @param {Function} params.idFactory - Id factory.
 * @returns {ApplyNoteMessage} The message.
 */
const toNote = ({
  text,
  changeSetId,
  now,
  idFactory,
}: {
  text: string
  changeSetId: string
  now: string
  idFactory: () => string
}): ApplyNoteMessage => ({
  id: idFactory(),
  role: 'applyNote',
  text,
  changeSetId,
  createdAt: now,
})

type NoteParams = { conversation: Conversation; changeSetId: string; now?: string; idFactory?: () => string }

/**
 * Stores the results of an Apply on the card and adds the summary for the model.
 * @param {object} params - Parameters.
 * @param {Conversation} params.conversation - Conversation.
 * @param {string} params.changeSetId - Card.
 * @param {OperationResult[]} params.results - Results of the Apply.
 * @param {string} params.note - Summary for the model (summarizeResults).
 * @param {string} [params.now] - Date (tests).
 * @param {Function} [params.idFactory] - Id factory (tests).
 * @returns {Conversation} The updated conversation (unchanged when the card doesn't exist).
 */
export const withApplyResults = ({
  conversation,
  changeSetId,
  results,
  note,
  now = new Date().toISOString(),
  idFactory = uuidv4,
}: NoteParams & { results: OperationResult[]; note: string }): Conversation => {
  const cardState = conversation.changeSets[changeSetId]
  if (!cardState) return conversation
  return {
    ...conversation,
    changeSets: {
      ...conversation.changeSets,
      [changeSetId]: { ...cardState, results: mergeOperationResults(cardState.results, results) },
    },
    messages: [...conversation.messages, toNote({ text: note, changeSetId, now, idFactory })],
    updatedAt: now,
  }
}

/**
 * Marks a card discarded and tells the model.
 * @param {object} params - Parameters.
 * @param {Conversation} params.conversation - Conversation.
 * @param {string} params.changeSetId - Card.
 * @param {string} [params.now] - Date (tests).
 * @param {Function} [params.idFactory] - Id factory (tests).
 * @returns {Conversation} The updated conversation (unchanged when the card doesn't exist).
 */
export const withDiscarded = ({
  conversation,
  changeSetId,
  now = new Date().toISOString(),
  idFactory = uuidv4,
}: NoteParams): Conversation => {
  const cardState = conversation.changeSets[changeSetId]
  if (!cardState) return conversation
  return {
    ...conversation,
    changeSets: { ...conversation.changeSets, [changeSetId]: { ...cardState, discarded: true } },
    messages: [...conversation.messages, toNote({ text: DISCARD_NOTE, changeSetId, now, idFactory })],
    updatedAt: now,
  }
}

/**
 * Marks as stopped the answers a closed tab or a crash left "streaming" (they would spin forever and offer no Retry).
 * @param {Conversation} conversation - Conversation read from the store.
 * @param {boolean} running - A turn of this conversation is running now (nothing to normalize).
 * @returns {Conversation} The conversation (the same object when nothing changed).
 */
export const normalizeLoadedConversation = (conversation: Conversation, running = false): Conversation => {
  if (running || !conversation.messages.some((m) => m.role === 'assistant' && m.status === 'streaming')) {
    return conversation
  }
  return {
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.role === 'assistant' && message.status === 'streaming'
        ? { ...message, status: 'stopped' as const }
        : message
    ),
  }
}
