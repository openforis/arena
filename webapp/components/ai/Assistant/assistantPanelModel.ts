/**
 * Pure helpers of the panel: tool row labels, Retry, Apply / Discard results stored in the conversation.
 */
import { uuidv4 } from '@core/uuid'

import { CONVERSATION_TITLE_TOOL_NAME } from '@common/ai/prompts/assistantConversationTitle'

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
 * Returns true for the tool calls the chat doesn't list (the conversation title).
 * @param {ConversationToolPart} part - Tool part.
 * @returns {boolean} True when hidden.
 */
export const isHiddenToolPart = (part: ConversationToolPart): boolean => part.toolName === CONVERSATION_TITLE_TOOL_NAME

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
 * @returns {{base: Conversation, text: string, displayText?: string}|null} Null when the last answer did not fail.
 */
export const getRetryBase = (
  conversation: Conversation
): { base: Conversation; text: string; displayText?: string } | null => {
  const { messages } = conversation
  const last = messages.at(-1)
  if (last?.role !== 'assistant' || last.status !== 'error') return null
  let index = messages.length - 1
  while (index >= 0 && messages[index].role !== 'user') index -= 1
  const userMessage = messages[index]
  if (userMessage?.role !== 'user') return null
  const { text, displayText } = userMessage
  return {
    base: { ...conversation, messages: messages.slice(0, index) },
    text,
    ...(displayText ? { displayText } : {}),
  }
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

export type LoadedConversationDecision = 'show' | 'keep' | 'forget'

/**
 * Decides what the panel does with the remembered conversation id once the store answered.
 * @param {object} params - Parameters.
 * @param {Conversation|null} params.loaded - Conversation read from the store (null when missing).
 * @param {string} params.conversationId - Remembered id.
 * @param {string|null} params.runningId - Id of the conversation whose turn is running now.
 * @param {object} params.scope - User, area and survey the panel shows.
 * @returns {LoadedConversationDecision} `show` it, `keep` the id (its first save is pending) or `forget` the id.
 */
export const decideLoadedConversation = ({
  loaded,
  conversationId,
  runningId,
  scope,
}: {
  loaded: Conversation | null
  conversationId: string
  runningId: string | null
  scope: { userUuid: string; area: string; surveyId: number | null }
}): LoadedConversationDecision => {
  // the running answer is saved after its first update: its id is valid before the store has it
  if (!loaded) return runningId === conversationId ? 'keep' : 'forget'
  const inScope = loaded.userUuid === scope.userUuid && loaded.area === scope.area && loaded.surveyId === scope.surveyId
  return inScope ? 'show' : 'forget'
}

/**
 * Whether a finished save may update the UI. Saves always run (a stored conversation keeps its own user); the UI is
 * left alone after a reset (logout, maybe another user next) or when the conversation is not the selected one.
 * @param {object} params - Parameters.
 * @param {number} params.startedGeneration - Registry generation when the work started.
 * @param {number} params.currentGeneration - Registry generation now.
 * @param {string|null} params.selectedId - Conversation selected in the panel.
 * @param {string} params.id - Conversation that was saved.
 * @returns {boolean} True when the conversation may be shown.
 */
export const canShowAfterSave = ({
  startedGeneration,
  currentGeneration,
  selectedId,
  id,
}: {
  startedGeneration: number
  currentGeneration: number
  selectedId: string | null
  id: string
}): boolean => startedGeneration === currentGeneration && selectedId === id
