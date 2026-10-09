import './RecordEditCard.scss'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import type { ChangeSet, OperationResult } from '@webapp/ai/changeSets/types'
import { isRecordEditOperation, type RecordAttributeUpdateOperation } from '@webapp/ai/changeSets/recordEdits/types'
import {
  countOperationResults,
  getRetryOperationIds,
  getSelectableOperationIds,
  groupOperationsByRecord,
} from '@webapp/ai/changeSets/recordEdits/recordEditCardModel'
import { Button } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

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
 * @param {object} i18n - Translator.
 * @param {OperationResult} result - The result.
 * @returns {string} The text.
 */
const getResultText = (i18n: any, result: OperationResult): string => {
  if (result.status !== 'failed') return i18n.t(`aiCleaning.result.${result.status}`)
  const message = result.message ? i18n.t(result.message, result.params ?? {}) : ''
  return i18n.t('aiCleaning.result.failed', { message })
}

/**
 * One edit of the card: checkbox, path, from → to, preview badge, result.
 * @param {EditRowProps} props - Props.
 * @returns {React.ReactElement} The row.
 */
const EditRow = ({ operation, result, selected, selectable, onToggle }: EditRowProps) => {
  const i18n = useI18n()
  const { badge, messages } = operation.preview
  const empty = i18n.t('aiCleaning.card.empty')
  return (
    <li className="ai-cleaning-card__edit" data-testid={TestId.aiCleaning.edit} data-node-uuid={operation.nodeUuid}>
      <Checkbox
        checked={selected}
        disabled={!selectable}
        onChange={() => onToggle(operation.id)}
        testId={TestId.aiCleaning.editCheckbox}
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
          {i18n.t(`aiCleaning.badge.${badge}`)}
        </span>
        {result && (
          <div
            className={`ai-cleaning-card__result ai-cleaning-card__result--${result.status}`}
            data-testid={TestId.aiCleaning.result}
            data-value={result.status}
          >
            {getResultText(i18n, result)}
          </div>
        )}
      </div>
    </li>
  )
}

/**
 * Card of a record-edit change set: edits grouped by record, preview badges, Apply selected and Retry.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The card.
 */
export const RecordEditCard = ({ changeSet, results = [], busy, onApply }: Props) => {
  const i18n = useI18n()
  const operations = useMemo(() => changeSet.operations.filter(isRecordEditOperation), [changeSet])
  const groups = useMemo(() => groupOperationsByRecord(operations), [operations])
  const selectableIds = useMemo(() => getSelectableOperationIds(operations, results), [operations, results])
  const [deselectedIds, setDeselectedIds] = useState<string[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  // set before the re-render, so two quick clicks can't both start an Apply
  const applyingRef = useRef(false)
  const resultById = useMemo(() => new Map(results.map((result) => [result.id, result])), [results])
  const counts = countOperationResults(results)

  const onToggle = useCallback((id: string) => {
    setDeselectedIds((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]))
  }, [])

  const apply = useCallback(
    async (operationIds: string[]) => {
      if (applyingRef.current) return
      applyingRef.current = true
      setProgress({ done: 0, total: 0 })
      try {
        await onApply(operationIds, (done, total) => setProgress({ done, total }))
      } finally {
        applyingRef.current = false
        setProgress(null)
      }
    },
    [onApply]
  )

  const applicableSelectedIds = selectableIds.filter((id) => !deselectedIds.includes(id))
  const retryIds = getRetryOperationIds(results)
  const applying = progress !== null
  const locked = applying || busy

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
                {i18n.t('aiCleaning.card.newErrors', { count: group.recordNewErrors })}
              </span>
            )}
          </header>
          <ul>
            {group.operations.map((operation) => (
              <EditRow
                key={operation.id}
                operation={operation}
                result={resultById.get(operation.id)}
                selected={selectableIds.includes(operation.id) && !deselectedIds.includes(operation.id)}
                selectable={!locked && selectableIds.includes(operation.id)}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </section>
      ))}
      {applying && (
        <div className="ai-cleaning-card__progress" data-testid={TestId.aiCleaning.progress}>
          {i18n.t('aiCleaning.card.applying', progress)}
        </div>
      )}
      {results.length > 0 && <div className="ai-cleaning-card__counts">{i18n.t('aiCleaning.card.counts', counts)}</div>}
      <div className="ai-cleaning-card__actions">
        <Button
          primary
          disabled={locked || applicableSelectedIds.length === 0}
          label="aiCleaning.card.applySelected"
          labelParams={{ count: applicableSelectedIds.length }}
          onClick={() => apply(applicableSelectedIds)}
          testId={TestId.aiCleaning.applyBtn}
        />
        {retryIds.length > 0 && (
          <Button
            disabled={locked}
            label="aiCleaning.card.retryFailed"
            labelParams={{ count: retryIds.length }}
            onClick={() => apply(retryIds)}
            testId={TestId.aiCleaning.retryBtn}
            variant="outlined"
          />
        )}
      </div>
    </div>
  )
}
