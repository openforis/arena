/**
 * Assistant conversations, as stored in the browser (IndexedDB) and rendered by the panel.
 */
import type { AiDataClass } from '@common/ai/features'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import type { AiToolArea } from '@webapp/ai/tools/types'

export type ConversationTextPart = { type: 'text'; text: string }

export type ConversationToolPart = {
  type: 'tool'
  toolCallId: string
  toolName: string
  input: unknown
  output?: unknown
  state: 'running' | 'done' | 'failed'
}

export type AssistantMessagePart = ConversationTextPart | ConversationToolPart

export type UserMessage = { id: string; role: 'user'; text: string; createdAt: string }

export type AssistantMessageStatus = 'streaming' | 'done' | 'stopped' | 'error'

export type AssistantMessage = {
  id: string
  role: 'assistant'
  parts: AssistantMessagePart[]
  status: AssistantMessageStatus
  // appErrors key of a failed turn
  errorKey?: string
  createdAt: string
}

// what Arena tells the model after an Apply or a Discard (the user sees the results on the card instead)
export type ApplyNoteMessage = { id: string; role: 'applyNote'; text: string; changeSetId: string; createdAt: string }

export type ConversationMessage = UserMessage | AssistantMessage | ApplyNoteMessage

export type Conversation = {
  id: string
  userUuid: string
  surveyId: number | null
  // surveyId ?? 0: IndexedDB can't index null (deviation 13)
  surveyKey: number
  area: AiToolArea
  // the most sensitive class a tool result of this conversation exposed (D2 escalates it)
  dataClass: AiDataClass
  title: string
  messages: ConversationMessage[]
  changeSets: Record<string, ChangeSetCardState>
  createdAt: string
  updatedAt: string
}
