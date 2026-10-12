/**
 * Assistant conversations, as stored in the browser (IndexedDB) and rendered by the panel.
 */
import type { AiDataClass } from '@common/ai/features'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import type { AnalysisQueryEntry } from '@webapp/ai/tools/analysis/queryStore'
import type { AiToolArea } from '@webapp/ai/tools/types'
import type { SuggestionScope } from '@webapp/ai/suggestions/types'

export type ConversationTextPart = { type: 'text'; text: string }

// the model's thinking: shown collapsed, never sent back to the model
export type ConversationReasoningPart = { type: 'reasoning'; text: string }

export type ConversationToolPart = {
  type: 'tool'
  toolCallId: string
  toolName: string
  input: unknown
  output?: unknown
  state: 'running' | 'done' | 'failed'
}

export type AssistantMessagePart = ConversationTextPart | ConversationReasoningPart | ConversationToolPart

// text: what the model gets; displayText: what the chat shows instead (a Do it request in the user's words)
export type UserMessage = { id: string; role: 'user'; text: string; displayText?: string; createdAt: string }

export type AssistantMessageStatus = 'streaming' | 'done' | 'stopped' | 'error'

// context the model held at the end of the answer (the context meter); estimated: the provider reported no usage
export type AssistantMessageUsage = {
  contextTokens: number
  // model context size (local server); null when unknown (cloud models)
  windowTokens: number | null
  // the window is the 8,192-token default: the local server didn't report its context size
  windowAssumed: boolean
  estimated: boolean
  // older messages were left out of the request
  historyTrimmed: boolean
}

export type AssistantMessage = {
  id: string
  role: 'assistant'
  parts: AssistantMessagePart[]
  status: AssistantMessageStatus
  // appErrors key of a failed turn
  errorKey?: string
  // absent on answers saved before the meter, and when no request was sent
  usage?: AssistantMessageUsage
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
  // analysis area: proposed queries by id (q1, q2, …)
  queries?: Record<string, AnalysisQueryEntry>
  // started by a suggestion's Do it: the work lists of its tools stay within these targets (follow-ups included)
  suggestionScope?: SuggestionScope
  createdAt: string
  updatedAt: string
}
