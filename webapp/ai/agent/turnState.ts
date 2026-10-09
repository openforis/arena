/**
 * Mutable holder of the conversation during a turn: each change makes a new conversation object and reports it.
 */
import { getMaxAiDataClass, type AiDataClass } from '@common/ai/features'
import { uuidv4 } from '@core/uuid'

import type { AnalysisQueryEntry } from '@webapp/ai/tools/analysis/queryStore'
import type { ChangeSet } from '@webapp/ai/changeSets/types'
import { toConversationTitle } from '@webapp/ai/conversations/conversationModel'
import type {
  AssistantMessage,
  AssistantMessageStatus,
  Conversation,
  UserMessage,
} from '@webapp/ai/conversations/types'

export type TurnState = {
  get: () => Conversation
  appendText: (text: string) => void
  startTool: (call: { toolCallId: string; toolName: string; input: unknown }) => void
  endTool: (result: { toolCallId: string; output: unknown }) => void
  addChangeSet: (changeSet: ChangeSet) => void
  escalateDataClass: (dataClass: AiDataClass) => void
  setQueries: (queries: Record<string, AnalysisQueryEntry>) => void
  finish: (status: AssistantMessageStatus, errorKey?: string) => void
}

/**
 * Returns true for the structured error results of the tool wrapper.
 * @param {unknown} output - Tool output.
 * @returns {boolean} True when the output is `{ error: … }`.
 */
export const isToolErrorOutput = (output: unknown): boolean =>
  typeof output === 'object' && output !== null && 'error' in output

/**
 * Appends text to the last text part of an answer (or starts a new one after a tool part).
 * @param {AssistantMessage} message - Answer.
 * @param {string} text - Text to append.
 * @returns {AssistantMessage} The new answer.
 */
const appendTextPart = (message: AssistantMessage, text: string): AssistantMessage => {
  const last = message.parts.at(-1)
  if (last?.type === 'text') {
    return { ...message, parts: [...message.parts.slice(0, -1), { type: 'text', text: last.text + text }] }
  }
  return { ...message, parts: [...message.parts, { type: 'text', text }] }
}

/**
 * Starts a turn: adds the user message and an empty streaming answer to the conversation.
 * @param {object} params - Parameters.
 * @param {Conversation} params.conversation - Conversation before the turn.
 * @param {string} params.userMessage - User message.
 * @param {Function} params.onUpdate - Called with every new conversation object.
 * @returns {TurnState} The turn state.
 */
export const createTurnState = ({
  conversation,
  userMessage,
  onUpdate,
}: {
  conversation: Conversation
  userMessage: string
  onUpdate: (conversation: Conversation) => void
}): TurnState => {
  const now = new Date().toISOString()
  const user: UserMessage = { id: uuidv4(), role: 'user', text: userMessage, createdAt: now }
  const answer: AssistantMessage = { id: uuidv4(), role: 'assistant', parts: [], status: 'streaming', createdAt: now }
  let current: Conversation = {
    ...conversation,
    title: conversation.title || toConversationTitle(userMessage),
    messages: [...conversation.messages, user, answer],
    updatedAt: now,
  }
  /**
   * Makes the conversation current and reports it.
   * @param {Conversation} next - New conversation.
   * @returns {void}
   */
  const set = (next: Conversation) => {
    current = { ...next, updatedAt: new Date().toISOString() }
    onUpdate(current)
  }
  /**
   * Updates the answer of the turn.
   * @param {Function} update - Maps the answer to its new version.
   * @returns {void}
   */
  const updateAnswer = (update: (message: AssistantMessage) => AssistantMessage) =>
    set({
      ...current,
      messages: current.messages.map((message) =>
        message.id === answer.id && message.role === 'assistant' ? update(message) : message
      ),
    })
  onUpdate(current)
  return {
    get: () => current,
    appendText: (text) => updateAnswer((message) => appendTextPart(message, text)),
    startTool: ({ toolCallId, toolName, input }) =>
      updateAnswer((message) => ({
        ...message,
        parts: [...message.parts, { type: 'tool', toolCallId, toolName, input, state: 'running' }],
      })),
    endTool: ({ toolCallId, output }) =>
      updateAnswer((message) => ({
        ...message,
        parts: message.parts.map((part) =>
          part.type === 'tool' && part.toolCallId === toolCallId
            ? { ...part, output, state: isToolErrorOutput(output) ? 'failed' : 'done' }
            : part
        ),
      })),
    addChangeSet: (changeSet) =>
      set({ ...current, changeSets: { ...current.changeSets, [changeSet.id]: { changeSet } } }),
    // never lowers the class (same rule as escalateConversationDataClass, without importing it: no cycle)
    escalateDataClass: (dataClass) => {
      if (getMaxAiDataClass(current.dataClass, dataClass) !== current.dataClass) set({ ...current, dataClass })
    },
    setQueries: (queries) => set({ ...current, queries }),
    finish: (status, errorKey) =>
      updateAnswer((message) => (errorKey ? { ...message, status, errorKey } : { ...message, status })),
  }
}
