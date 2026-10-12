import React from 'react'

import { assistantAreaFeatures } from '@webapp/ai/agent/runAssistantTurn'
import type { AnalysisQueryEntry } from '@webapp/ai/tools/analysis/queryStore'
import { isRecordEditChangeSet } from '@webapp/ai/changeSets/recordEdits/types'
import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import type {
  AssistantMessage,
  AssistantMessagePart,
  ConversationMessage,
  ConversationReasoningPart,
  ConversationToolPart,
} from '@webapp/ai/conversations/types'
import { getAiEngineErrorView } from '@webapp/ai/engines/engineUi'
import { Button } from '@webapp/components/buttons'
import { AiEngineErrorActions } from '@webapp/components/ai/AiNotAvailable'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { AssistantArea } from './assistantAreas'
import { AssistantMarkdown } from './AssistantMarkdown'
import { getProposedChangeSetId, getToolRowLabel, isHiddenToolPart } from './assistantPanelModel'
import { getProposedQueryId } from './analysis/analysisArea'
import { useRecordDataNotice } from './analysis/useAnalysisArea'
import { QueryCard } from './analysis/QueryCard'
import { RecordEditCard } from './cleaning/RecordEditCard'
import { ChangeSetCard } from './ChangeSetCard'
import type { AssistantConversationApi } from './useAssistantConversation'

type ChangeSets = Record<string, ChangeSetCardState>
type Queries = Record<string, AnalysisQueryEntry>

/**
 * One tool row. A call still "running" in an answer that is no longer streaming was interrupted (stopped, failed or
 * reloaded), so it gets no spinner.
 * @param {object} props - Props.
 * @param {ConversationToolPart} props.part - Tool part.
 * @param {boolean} props.interrupted - The tool never reported back.
 * @returns {React.ReactElement} The row.
 */
const ToolRow = ({ part, interrupted }: { part: ConversationToolPart; interrupted: boolean }) => {
  const t = useI18nT({ unescapeHtml: true })
  const state = interrupted ? 'interrupted' : part.state
  return (
    <div
      className={`ai-assistant-tool ai-assistant-tool--${state}`}
      data-testid={TestId.aiAssistant.toolRow(part.toolName)}
    >
      <span>{getToolRowLabel(part, t)}</span>
      {part.state === 'failed' && <span className="ai-assistant-tool__failed">{t('aiAssistant.tools.failed')}</span>}
      {interrupted && <span className="ai-assistant-tool__interrupted">{t('aiAssistant.tools.interrupted')}</span>}
    </div>
  )
}

/**
 * The model's thinking, collapsed: the user opens it to read it.
 * @param {object} props - Props.
 * @param {ConversationReasoningPart} props.part - Reasoning part.
 * @param {boolean} props.active - The model is still thinking (last part of a streaming answer).
 * @returns {React.ReactElement} The section.
 */
const ThinkingSection = ({ part, active }: { part: ConversationReasoningPart; active: boolean }) => {
  const t = useI18nT({ unescapeHtml: true })
  return (
    <details className="ai-assistant-thinking" data-testid={TestId.aiAssistant.thinking}>
      <summary>{t(active ? 'aiAssistant.thinkingActive' : 'aiAssistant.thinking')}</summary>
      <div className="ai-assistant-thinking__text">
        <AssistantMarkdown text={part.text} />
      </div>
    </details>
  )
}

/**
 * One part of an answer: markdown text, the collapsed thinking, or a tool row with the change set card it proposed.
 * @param {object} props - Props.
 * @param {AssistantMessagePart} props.part - Part.
 * @param {ChangeSets} props.changeSets - Cards of the conversation.
 * @param {object} props.queries - Queries of the conversation.
 * @param {boolean} props.streaming - The answer is still streaming.
 * @param {boolean} props.isLastPart - Last part of the answer.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement} The part.
 */
const AnswerPart = ({
  part,
  changeSets,
  queries,
  streaming,
  isLastPart,
  api,
}: {
  part: AssistantMessagePart
  changeSets: ChangeSets
  queries: Queries
  streaming: boolean
  isLastPart: boolean
  api: AssistantConversationApi
}) => {
  if (part.type === 'text') return <AssistantMarkdown text={part.text} />
  if (part.type === 'reasoning') return <ThinkingSection active={streaming && isLastPart} part={part} />
  if (isHiddenToolPart(part)) return null
  const changeSetId = getProposedChangeSetId(part)
  const cardState = changeSetId ? changeSets[changeSetId] : undefined
  const queryId = getProposedQueryId({ toolName: part.toolName, output: part.output })
  const queryEntry = queryId ? (queries[queryId] ?? null) : undefined
  return (
    <>
      <ToolRow interrupted={part.state === 'running' && !streaming} part={part} />
      {cardState &&
        (isRecordEditChangeSet(cardState.changeSet) ? (
          <RecordEditCard
            busy={api.busy || api.applying}
            changeSet={cardState.changeSet}
            onApply={(operationIds, onProgress) =>
              api.applyRecordEdits(cardState.changeSet.id, operationIds, onProgress)
            }
            results={cardState.results}
          />
        ) : (
          <ChangeSetCard
            busy={api.busy}
            cardState={cardState}
            onApply={(operationIds) => api.apply(cardState.changeSet.id, operationIds)}
            onDiscard={() => api.discard(cardState.changeSet.id)}
          />
        ))}
      {queryEntry !== undefined && <QueryCard entry={queryEntry} />}
    </>
  )
}

/**
 * End status of an answer: Stopped, or the error with Retry (or the engine error actions).
 * @param {object} props - Props.
 * @param {AssistantMessage} props.message - Answer.
 * @param {boolean} props.isLast - Last message.
 * @param {AssistantArea} props.area - Current area (its feature decides the record-data notice).
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement|null} The footer.
 */
const AnswerFooter = ({
  message,
  isLast,
  area,
  api,
}: {
  message: AssistantMessage
  isLast: boolean
  area: AssistantArea
  api: AssistantConversationApi
}) => {
  const t = useI18nT({ unescapeHtml: true })
  // the record-data notice replaces the composer: the conversation can't continue, so no Retry
  const recordDataNotice = useRecordDataNotice(api.conversation, assistantAreaFeatures[area])
  if (message.status === 'stopped') return <p className="ai-assistant-message__stopped">{t('aiAssistant.stopped')}</p>
  if (message.status !== 'error') return null
  // only the key is stored with the message: engine errors get their own Retry / Open settings buttons
  const engineError = { key: message.errorKey }
  const hasEngineRetry = getAiEngineErrorView(engineError)?.retry === true
  return (
    <div className="ai-assistant-message__error" role="alert">
      <span>{t(`appErrors:${message.errorKey ?? 'aiProviderUnavailable'}`)}</span>
      {isLast && !recordDataNotice && (
        <AiEngineErrorActions disabled={api.busy} error={engineError} onRetry={api.retry} />
      )}
      {isLast && !recordDataNotice && !hasEngineRetry && (
        <Button
          disabled={api.busy}
          label="aiAssistant.retry"
          onClick={api.retry}
          size="small"
          testId={TestId.aiAssistant.retryBtn}
        />
      )}
    </div>
  )
}

/**
 * One message: the user's text, or the answer with its tool rows, change set cards and end status. Apply notes are
 * for the model only.
 * @param {object} props - Props.
 * @param {ConversationMessage} props.message - Message.
 * @param {object} props.changeSets - Cards of the conversation.
 * @param {object} props.queries - Queries of the conversation.
 * @param {boolean} props.isLast - Last message (Retry).
 * @param {AssistantArea} props.area - Current area.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement|null} The message.
 */
export const AssistantMessageView = ({
  message,
  changeSets,
  queries,
  isLast,
  area,
  api,
}: {
  message: ConversationMessage
  changeSets: ChangeSets
  queries: Queries
  isLast: boolean
  area: AssistantArea
  api: AssistantConversationApi
}) => {
  if (message.role === 'applyNote') return null
  if (message.role === 'user') {
    return (
      <div className="ai-assistant-message ai-assistant-message--user" data-testid={TestId.aiAssistant.message('user')}>
        {message.displayText || message.text}
      </div>
    )
  }
  return (
    <div
      className="ai-assistant-message ai-assistant-message--assistant"
      data-status={message.status}
      data-testid={TestId.aiAssistant.message('assistant')}
    >
      {message.parts.map((part, index) => (
        <AnswerPart
          api={api}
          changeSets={changeSets}
          queries={queries}
          isLastPart={index === message.parts.length - 1}
          key={part.type === 'tool' ? part.toolCallId : `${part.type}-${index}`}
          part={part}
          streaming={message.status === 'streaming'}
        />
      ))}
      {message.status === 'streaming' && <span aria-hidden="true" className="ai-assistant-message__typing" />}
      <AnswerFooter api={api} area={area} isLast={isLast} message={message} />
    </div>
  )
}
