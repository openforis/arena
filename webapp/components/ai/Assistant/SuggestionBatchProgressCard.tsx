import './SuggestionBatchProgressCard.scss'

import { useState } from 'react'

import type { ConversationToolPart } from '@webapp/ai/conversations/types'
import type { SuggestionBatchKind, SuggestionBatchProgress } from '@webapp/ai/suggestions/suggestionBatchTurn'
import { Button } from '@webapp/components/buttons'
import ProgressBar from '@webapp/components/ProgressBar'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

const KEYS = 'aiAssistant.missingTextsBatch'

const TITLE_KEYS: Record<SuggestionBatchKind, string> = {
  missingTranslations: `${KEYS}.progressTitle`,
  categoryItemTranslations: `${KEYS}.categoryProgressTitle`,
  newEntriesDescriptions: `${KEYS}.descriptionsProgressTitle`,
}

const MINUTE_MS = 60_000

/**
 * Returns the estimated time left as text.
 * @param {number} remainingMs - Time left.
 */
const getRemainingText = (remainingMs: number, t: ReturnType<typeof useI18nT>): string =>
  remainingMs < MINUTE_MS
    ? t(`${KEYS}.lessThanMinuteLeft`)
    : t(`${KEYS}.minutesLeft`, { minutes: Math.ceil(remainingMs / MINUTE_MS) })

/**
 * Returns the line under the bar: the requests done and the time left, or "Preparing…" before the first request.
 * @returns {string} The line.
 */
const getStatusText = (progress: SuggestionBatchProgress | undefined, t: ReturnType<typeof useI18nT>): string => {
  if (!progress?.total) return t('aiBatch.preparing')
  const requests = t('aiBatch.progress', { done: progress.done, total: progress.total })
  return progress.remainingMs === undefined ? requests : `${requests} · ${getRemainingText(progress.remainingMs, t)}`
}

/**
 * The progress of a batch run in the chat, until the change set card replaces it.
 * @param {object} props - Props.
 * @param {SuggestionBatchKind} props.kind - Batch.
 * @param {ConversationToolPart} props.part - Tool row of the batch (language name and count; output: progress).
 * @param {Function} props.onStop - Stops the turn.
 * @returns {React.ReactElement} The card.
 */
export const SuggestionBatchProgressCard = ({
  kind,
  part,
  onStop,
}: {
  kind: SuggestionBatchKind
  part: ConversationToolPart
  onStop: () => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const [stopping, setStopping] = useState(false)
  const progress = part.output as SuggestionBatchProgress | undefined
  // a Do it puts the language and the count in the input; a batch tool of the model, in its progress
  const { name, count } = { ...progress, ...(part.input as object) } as { name?: string; count?: number }
  const known = !!progress?.total
  const title = t(TITLE_KEYS[kind], { count, lang: name })
  return (
    <fieldset aria-label={title} className="ai-assistant-card ai-batch-card" data-testid={TestId.ai.batchProgress}>
      <strong>{title}</strong>
      <ProgressBar indeterminate={!known} progress={known ? Math.floor((100 * progress.done) / progress.total) : 0} />
      <div className="ai-batch-card__row">
        {/* announced at the start only, not at every request */}
        <span aria-live="off" className="ai-batch-card__status">
          {stopping ? t('aiBatch.stopping') : getStatusText(progress, t)}
        </span>
        <Button
          disabled={stopping}
          label="aiBatch.stop"
          onClick={() => {
            setStopping(true)
            onStop()
          }}
          size="small"
          testId={TestId.ai.batchCancel}
          variant="text"
        />
      </div>
    </fieldset>
  )
}
