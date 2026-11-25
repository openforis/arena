import './RecordEditCard.scss'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'

import {
  countOperationResults,
  getRetryOperationIds,
  getSelectableOperationIds,
  groupOperationsByRecord,
} from '@webapp/ai/changeSets/recordEdits/recordEditCardModel'
import { isRecordEditOperation, type RecordAttributeUpdateOperation } from '@webapp/ai/changeSets/recordEdits/types'
import type { ChangeSet, OperationResult } from '@webapp/ai/changeSets/types'
import { Button } from '@webapp/components/buttons'
import { useNotifyError } from '@webapp/components/hooks'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import { runWithFailureNotice } from '../runWithFailureNotice'
import { useOperationSelection } from '../useOperationSelection'

type Props = {
  changeSet: ChangeSet
  results?: OperationResult[]
  // an answer is running (Apply waits for it)
  busy: boolean
  // applies the edits and stores the results in the conversation (the conversation keeps the guards)
  onApply: (operationIds: string[], onProgress: (done: number, total: number) => void) => Promise<void>
}

type EditRowProps = {
  operation: RecordAttributeUpdateOperation
  result?: OperationResult
  selected: boolean
  selectable: boolean
  onToggle: (id: string) => void
}

/**
 * Returns the translated text of an edit result.
 * @param {Function} t - Translation function (unescaped: the message is translated twice).
 * @returns {string} The text.
 */
const getResultText = (t: (key: string, params?: any) => string, result: OperationResult): string => {
  if (result.status !== 'failed') return t(`aiCleaning.result.${result.status}`)
  const message = result.message ? t(result.message, result.params ?? {}) : ''
  return t('aiCleaning.result.failed', { message })
}

/**
 * One edit of the card: checkbox, path, from → to, preview badge, result.
 * @returns {React.ReactElement} The row.
 */
const EditRow = ({ operation, result, selected, selectable, onToggle }: EditRowProps) => {
  const t = useI18nT({ unescapeHtml: true })
  const { badge, messages } = operation.preview
  const empty = t('aiCleaning.card.empty')
  return (
    <li className="ai-cleaning-card__edit" data-testid={TestId.aiCleaning.edit} data-node-uuid={operation.nodeUuid}>
      <input
        aria-label={`${operation.recordKeys} ${operation.path}: ${operation.display.from ?? empty} → ${operation.display.to ?? empty}`}
        checked={selected}
        data-testid={TestId.aiCleaning.editCheckbox}
        disabled={!selectable}
        onChange={() => onToggle(operation.id)}
        type="checkbox"
      />
      <div className="ai-cleaning-card__edit-body">
        <div className="ai-cleaning-card__path">{operation.path}</div>
        <div className="ai-cleaning-card__values">
          <span className="ai-cleaning-card__from">{operation.display.from ?? empty}</span>
          {' → '}
          <span className="ai-cleaning-card__to">{operation.display.to ?? empty}</span>
        </div>
        <span
          className={`ai-cleaning-card__badge ai-cleaning-card__badge--${badge}`}
          data-testid={TestId.aiCleaning.badge}
          data-value={badge}
          title={messages.join('\n')}
        >
          {t(`aiCleaning.badge.${badge}`)}
        </span>
        {result && (
          <div
            className={`ai-cleaning-card__result ai-cleaning-card__result--${result.status}`}
            data-testid={TestId.aiCleaning.result}
            data-value={result.status}
          >
            {getResultText(t, result)}
          </div>
        )}
      </div>
    </li>
  )
}

/**
 * Card of a record-edit change set: edits grouped by record, preview badges, Apply selected and Retry.
 * @returns {React.ReactElement} The card.
 */
export const RecordEditCard = ({ changeSet, results = [], busy, onApply }: Props) => {
  const t = useI18nT({ unescapeHtml: true })
  const operations = useMemo(() => changeSet.operations.filter(isRecordEditOperation), [changeSet])
  const groups = useMemo(() => groupOperationsByRecord(operations), [operations])
  const selectableIds = useMemo(() => getSelectableOperationIds(operations, results), [operations, results])
  const { selectedIds, toggle } = useOperationSelection({ selectableIds })
  const notifyError = useNotifyError()
  // where the focus goes after an Apply: the actions can unmount (nothing left to apply)
  const statusRef = useRef<HTMLOutputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const resultById = useMemo(() => new Map(results.map((result) => [result.id, result])), [results])
  const counts = countOperationResults(results)

  // the conversation holds the guard against a second Apply; a rejection (store error) is shown on the card
  const apply = useCallback(
    async (operationIds: string[]) => {
      const ok = await runWithFailureNotice({
        action: async () => {
          // one request, as the applier will report it (no "0 of 0" while it is prepared)
          setProgress({ done: 0, total: 1 })
          try {
            await onApply(operationIds, (done, total) => setProgress({ done, total }))
          } finally {
            setProgress(null)
          }
        },
        notifyError,
        key: 'aiAssistant.card.applyFailed',
      })
      if (ok) statusRef.current?.focus()
      return ok
    },
    [notifyError, onApply]
  )

  const retryIds = getRetryOperationIds(results)

  return (
    <div className="ai-cleaning-card" data-testid={TestId.aiCleaning.card}>
      <div className="ai-cleaning-card__summary">{changeSet.summary}</div>
      {groups.map((group) => (
        <section className="ai-cleaning-card__record" data-testid={TestId.aiCleaning.record} key={group.recordUuid}>
          <header className="ai-cleaning-card__record-header">
            <Link to={group.link} data-testid={TestId.aiCleaning.recordLink}>
              {group.recordKeys}
            </Link>
            {group.recordNewErrors > 0 && (
              <span className="ai-cleaning-card__new-errors">
                {t('aiCleaning.card.newErrors', { count: group.recordNewErrors })}
              </span>
            )}
          </header>
          <ul>
            {group.operations.map((operation) => (
              <EditRow
                key={operation.id}
                operation={operation}
                result={resultById.get(operation.id)}
                selected={selectedIds.includes(operation.id)}
                selectable={!busy && selectableIds.includes(operation.id)}
                onToggle={toggle}
              />
            ))}
          </ul>
        </section>
      ))}
      {progress && (
        <div className="ai-cleaning-card__progress" data-testid={TestId.aiCleaning.progress}>
          {t('aiCleaning.card.applying', progress)}
        </div>
      )}
      <output className="ai-cleaning-card__counts" ref={statusRef} tabIndex={-1}>
        {results.length > 0 && t('aiCleaning.card.counts', counts)}
      </output>
      <div className="ai-cleaning-card__actions">
        <Button
          primary
          disabled={busy || selectedIds.length === 0}
          label="aiCleaning.card.applySelected"
          labelParams={{ count: selectedIds.length }}
          onClick={() => void apply(selectedIds)}
          testId={TestId.aiCleaning.applyBtn}
        />
        {retryIds.length > 0 && (
          <Button
            disabled={busy}
            label="aiCleaning.card.retryFailed"
            labelParams={{ count: retryIds.length }}
            onClick={() => void apply(retryIds)}
            testId={TestId.aiCleaning.retryBtn}
            variant="outlined"
          />
        )}
      </div>
    </div>
  )
}
