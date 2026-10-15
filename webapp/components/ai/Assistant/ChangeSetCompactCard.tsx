import './ChangeSetCard.scss'

import React, { useState } from 'react'

import type { ChangeSetCardState, OperationStatus } from '@webapp/ai/changeSets/types'
import { Button } from '@webapp/components/buttons'
import { useIsSurveyDirty } from '@webapp/store/survey'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { getReviewLabelText, getValuePreview, groupReviewItems, type ReviewItem } from './changeSetReviewModel'
import { summarizeSelection } from './changeSetSelectionModel'
import type { ChangeSetSelection } from './useChangeSetSelection'

// preview rows and kinds of change shown before "+ N more"
const PREVIEW_ROWS = 3
const MAX_KIND_CHIPS = 4

/**
 * Counts the results of an Apply by status.
 * @param {ReviewItem[]} items - Items.
 * @returns {[OperationStatus, number][]} The statuses with results, in a fixed order.
 */
const countResults = (items: ReviewItem[]): [OperationStatus, number][] =>
  (['applied', 'conflict', 'failed', 'skipped'] as OperationStatus[])
    .map((status): [OperationStatus, number] => [status, items.filter((item) => item.result?.status === status).length])
    .filter(([, count]) => count > 0)

/**
 * Asks to confirm an Apply of changes that were not reviewed, with the selected changes counted by kind.
 * @param {object} props - Props.
 * @param {ReviewItem[]} props.items - Changes of the card.
 * @param {string[]} props.selectedIds - Selected operations.
 * @param {boolean} props.disabled - Apply can't run now.
 * @param {Function} props.onApply - Applies the selection.
 * @param {Function} props.onReview - Opens the review dialog.
 * @param {Function} props.onCancel - Closes the confirmation.
 * @returns {React.ReactElement} The confirmation.
 */
const ApplyConfirmation = ({
  items,
  selectedIds,
  disabled,
  onApply,
  onReview,
  onCancel,
}: {
  items: ReviewItem[]
  selectedIds: string[]
  disabled: boolean
  onApply: () => void
  onReview: () => void
  onCancel: () => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const kinds = summarizeSelection(items, selectedIds)
  return (
    <div
      aria-label={t('aiAssistant.card.confirm.title')}
      className="ai-assistant-card__confirm"
      data-testid={TestId.aiAssistant.applyConfirm}
      role="group"
    >
      <p>{t('aiAssistant.card.confirm.text', { count: selectedIds.length })}</p>
      <ul className="ai-assistant-card__chips">
        {kinds.map(({ label, count }) => (
          <li className="ai-assistant-card__chip" key={JSON.stringify(label)}>
            {`${getReviewLabelText(label, t)}: ${count}`}
          </li>
        ))}
      </ul>
      <div className="ai-assistant-card__footer">
        <Button label="aiAssistant.card.confirm.review" onClick={onReview} />
        <Button
          disabled={disabled}
          label="aiAssistant.card.confirm.apply"
          labelParams={{ count: selectedIds.length }}
          onClick={onApply}
          primary
          testId={TestId.aiAssistant.applyConfirmBtn}
        />
        <Button label="aiAssistant.card.confirm.cancel" onClick={onCancel} variant="text" />
      </div>
    </div>
  )
}

/**
 * Compact card of a long change set: counts by kind of change, a preview of the first changes and Review all, which
 * opens the review dialog. Apply all applies the selection (the changes of expressions and properties start
 * unselected); until the dialog was opened it asks to confirm, with the selection counted by kind.
 * @param {object} props - Props.
 * @param {ChangeSetCardState} props.cardState - Card state.
 * @param {ReviewItem[]} props.items - Changes of the card.
 * @param {ChangeSetSelection} props.selection - Selection and actions.
 * @param {boolean} props.busy - An answer is running (Apply waits for it).
 * @param {boolean} props.reviewed - The review dialog was opened.
 * @param {Function} props.onReview - Opens the review dialog.
 * @returns {React.ReactElement} The card.
 */
export const ChangeSetCompactCard = ({
  cardState,
  items,
  selection,
  busy,
  reviewed,
  onReview,
}: {
  cardState: ChangeSetCardState
  items: ReviewItem[]
  selection: ChangeSetSelection
  busy: boolean
  reviewed: boolean
  onReview: () => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const dirty = useIsSurveyDirty()
  const [confirming, setConfirming] = useState(false)
  const { pendingIds, conflictIds, selectableIds, selectedIds, unselectedBehaviourIds, applying } = selection
  const kinds = groupReviewItems(items, 'field')
  const results = countResults(items)
  const allSelected = selectedIds.length === selectableIds.length
  const showConfirmation = confirming && selectedIds.length > 0

  const onApplyClick = () => {
    if (reviewed) void selection.apply()
    else setConfirming(true)
  }
  const onConfirmedApply = () => {
    setConfirming(false)
    void selection.apply()
  }
  const onReviewFirst = () => {
    setConfirming(false)
    onReview()
  }

  return (
    <section
      aria-label={t('aiAssistant.card.title')}
      className="ai-assistant-card ai-assistant-card--compact"
      data-testid={TestId.aiAssistant.changeSetCard}
      role="group"
    >
      <div className="ai-assistant-card__header">
        <div className="ai-assistant-card__title-row">
          <strong>{t('aiAssistant.card.title')}</strong>
          <span className="ai-assistant-card__count">{t('aiAssistant.card.changes', { count: items.length })}</span>
        </div>
        <span>{cardState.changeSet.summary}</span>
      </div>
      <ul className="ai-assistant-card__chips">
        {kinds.slice(0, MAX_KIND_CHIPS).map((kind) => (
          <li className="ai-assistant-card__chip" key={kind.key}>
            {`${getReviewLabelText(kind.label, t)}: ${kind.items.length}`}
          </li>
        ))}
        {kinds.length > MAX_KIND_CHIPS && (
          <li className="ai-assistant-card__chip">
            {t('aiAssistant.card.more', { count: kinds.length - MAX_KIND_CHIPS })}
          </li>
        )}
        {conflictIds.length > 0 && (
          <li
            className="ai-assistant-card__chip ai-assistant-card__chip--conflict"
            data-testid={TestId.aiAssistant.stale}
          >
            {`${t('aiAssistant.card.status.conflict')}: ${conflictIds.length}`}
          </li>
        )}
        {results.map(([status, count]) => (
          <li className={`ai-assistant-card__chip ai-assistant-card__chip--${status}`} key={status}>
            {`${t(`aiAssistant.card.status.${status}`)}: ${count}`}
          </li>
        ))}
      </ul>
      <ul className="ai-assistant-card__preview">
        {items.slice(0, PREVIEW_ROWS).map((item) => (
          <li key={item.id}>
            <code>{item.name}</code>
            <span>{getValuePreview(item.to, t)}</span>
          </li>
        ))}
      </ul>
      <span className="ai-assistant-card__hint">
        {t('aiAssistant.card.more', { count: items.length - PREVIEW_ROWS })}
      </span>
      {cardState.discarded && <p className="ai-assistant-card__hint">{t('aiAssistant.card.discarded')}</p>}
      {unselectedBehaviourIds.length > 0 && (
        <p className="ai-assistant-card__hint">
          {t('aiAssistant.card.behaviourUnselected', { count: unselectedBehaviourIds.length })}
        </p>
      )}
      {showConfirmation && (
        <ApplyConfirmation
          disabled={busy || applying || dirty}
          items={items}
          onApply={onConfirmedApply}
          onCancel={() => setConfirming(false)}
          onReview={onReviewFirst}
          selectedIds={selectedIds}
        />
      )}
      <div className="ai-assistant-card__footer">
        {pendingIds.length > 0 && dirty && (
          <p className="ai-assistant-card__hint">{t('aiAssistant.card.saveCurrentEditFirst')}</p>
        )}
        <Button
          label="aiAssistant.card.reviewAll"
          labelParams={{ count: items.length }}
          onClick={onReview}
          primary={pendingIds.length > 0}
          testId={TestId.aiAssistant.reviewBtn}
        />
        {pendingIds.length > 0 && (
          <>
            <Button
              disabled={busy || applying || dirty || selectedIds.length === 0 || showConfirmation}
              label={allSelected ? 'aiAssistant.card.applyAll' : 'aiAssistant.card.applySelectedCount'}
              labelParams={{ count: selectedIds.length }}
              onClick={onApplyClick}
              testId={TestId.aiAssistant.applyBtn}
            />
            <Button
              disabled={busy || applying}
              label="aiAssistant.card.discard"
              onClick={selection.discard}
              testId={TestId.aiAssistant.discardBtn}
              variant="text"
            />
          </>
        )}
      </div>
    </section>
  )
}
