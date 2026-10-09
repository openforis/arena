import React from 'react'

import type { AnalysisQueryEntry } from '@webapp/ai/tools/analysis/queryStore'
import { isRecordEditChangeSet } from '@webapp/ai/changeSets/recordEdits/types'
import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import type {
  AssistantMessage,
  AssistantMessagePart,
  ConversationMessage,
  ConversationToolPart,
} from '@webapp/ai/conversations/types'
import { getAiEngineErrorView } from '@webapp/ai/engines/engineUi'
import { Button } from '@webapp/components/buttons'
import { AiEngineErrorActions } from '@webapp/components/ai/AiNotAvailable'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { AssistantMarkdown } from './AssistantMarkdown'
import { getProposedChangeSetId, getToolRowLabel } from './assistantPanelModel'
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
 * One part of an answer: markdown text, or a tool row with the change set card it proposed.
 * @param {object} props - Props.
 * @param {AssistantMessagePart} props.part - Part.
 * @param {ChangeSets} props.changeSets - Cards of the conversation.
 * @param {object} props.queries - Queries of the conversation.
 * @param {boolean} props.streaming - The answer is still streaming.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement} The part.
 */
const AnswerPart = ({
  part,
  changeSets,
  queries,
  streaming,
  api,
}: {
  part: AssistantMessagePart
  changeSets: ChangeSets
  queries: Queries
  streaming: boolean
  api: AssistantConversationApi
}) => {
  if (part.type === 'text') return <AssistantMarkdown text={part.text} />
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
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement|null} The footer.
 */
const AnswerFooter = ({
  message,
  isLast,
  api,
}: {
  message: AssistantMessage
  isLast: boolean
  api: AssistantConversationApi
}) => {
  const t = useI18nT({ unescapeHtml: true })
  // the record-data notice replaces the composer: the conversation can't continue, so no Retry
  const recordDataNotice = useRecordDataNotice(api.conversation)
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
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement|null} The message.
 */
export const AssistantMessageView = ({
  message,
  changeSets,
  queries,
  isLast,
  api,
}: {
  message: ConversationMessage
  changeSets: ChangeSets
  queries: Queries
  isLast: boolean
  api: AssistantConversationApi
}) => {
  if (message.role === 'applyNote') return null
  if (message.role === 'user') {
    return (
      <div className="ai-assistant-message ai-assistant-message--user" data-testid={TestId.aiAssistant.message('user')}>
        {message.text}
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
          key={part.type === 'tool' ? part.toolCallId : `text-${index}`}
          part={part}
          streaming={message.status === 'streaming'}
        />
      ))}
      {message.status === 'streaming' && <span aria-hidden="true" className="ai-assistant-message__typing" />}
      <AnswerFooter api={api} isLast={isLast} message={message} />
    </div>
  )
}
