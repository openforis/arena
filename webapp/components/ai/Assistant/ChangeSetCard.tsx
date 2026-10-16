import './ChangeSetCard.scss'

import React, { useMemo, useState } from 'react'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import { Button } from '@webapp/components/buttons'
import { useIsSurveyDirty, useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { ChangeItemRow } from './ChangeItem'
import { ChangeSetCompactCard } from './ChangeSetCompactCard'
import { ChangeSetReviewDialog } from './ChangeSetReviewDialog'
import { splitReviewItems } from './changeItemModel'
import { buildReviewItems, isCompactCard, type ReviewItem } from './changeSetReviewModel'
import { useChangeSetSelection, type ChangeSetSelection } from './useChangeSetSelection'
import { useNodeDefExists, useShowNodeDef } from './useShowNodeDef'

/**
 * The card with every change listed (short change sets): the node definition changes, then the category labels
 * grouped by category.
 * @param {object} props - Props.
 * @param {ChangeSetCardState} props.cardState - Card state.
 * @param {ReviewItem[]} props.items - Changes of the card.
 * @param {ChangeSetSelection} props.selection - Selection and actions.
 * @param {boolean} props.busy - An answer is running (Apply waits for it).
 * @returns {React.ReactElement} The card.
 */
const ChangeSetFullCard = ({
  cardState,
  items,
  selection,
  busy,
}: {
  cardState: ChangeSetCardState
  items: ReviewItem[]
  selection: ChangeSetSelection
  busy: boolean
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const dirty = useIsSurveyDirty()
  const showNodeDef = useShowNodeDef()
  const nodeDefExists = useNodeDefExists()
  const { pendingIds, conflicts, conflictIds, selectedIds, applying, toggle } = selection
  const { nodeDefItems, categoryGroups } = useMemo(() => splitReviewItems(items), [items])

  /**
   * Renders one change of the card.
   * @param {ReviewItem} item - Change.
   * @returns {React.ReactElement} The row.
   */
  const renderRow = (item: ReviewItem) => {
    const { nodeDefUuid } = item
    return (
      <ChangeItemRow
        conflict={conflicts.find((conflict) => conflict.id === item.id)}
        exists={nodeDefUuid !== null && nodeDefExists(nodeDefUuid)}
        item={item}
        key={item.id}
        onNameClick={() => {
          if (nodeDefUuid !== null) showNodeDef(nodeDefUuid)
        }}
        onToggle={() => toggle(item.id)}
        pending={pendingIds.includes(item.id)}
        selected={selectedIds.includes(item.id)}
      />
    )
  }

  return (
    <section
      aria-label={t('aiAssistant.card.title')}
      className="ai-assistant-card"
      data-testid={TestId.aiAssistant.changeSetCard}
      role="group"
    >
      <div className="ai-assistant-card__header">
        <strong>{t('aiAssistant.card.title')}</strong>
        <span>{cardState.changeSet.summary}</span>
      </div>
      {conflictIds.length > 0 && (
        <div className="ai-change-item__stale" data-testid={TestId.aiAssistant.stale} role="status">
          {t('aiAssistant.card.stale')}
        </div>
      )}
      <ul className="ai-assistant-card__rows">{nodeDefItems.map(renderRow)}</ul>
      {categoryGroups.map((group) => (
        <div
          className="ai-assistant-card__category"
          data-testid={TestId.aiAssistant.categoryLabelGroup(group.categoryName)}
          key={group.categoryUuid}
        >
          <div className="ai-assistant-card__category-name">{group.categoryName}</div>
          <ul className="ai-assistant-card__rows">{group.items.map(renderRow)}</ul>
        </div>
      ))}
      {cardState.discarded && <p className="ai-assistant-card__hint">{t('aiAssistant.card.discarded')}</p>}
      {pendingIds.length > 0 && (
        <div className="ai-assistant-card__footer">
          {dirty && <p className="ai-assistant-card__hint">{t('aiAssistant.card.saveCurrentEditFirst')}</p>}
          <Button
            disabled={busy || applying || dirty || selectedIds.length === 0}
            label="aiAssistant.card.applySelected"
            onClick={selection.apply}
            primary
            testId={TestId.aiAssistant.applyBtn}
          />
          <Button
            disabled={busy || applying}
            label="aiAssistant.card.discard"
            onClick={selection.discard}
            testId={TestId.aiAssistant.discardBtn}
            variant="text"
          />
        </div>
      )}
    </section>
  )
}

/**
 * Change set card: up to COMPACT_CARD_MAX_INLINE changes listed with checkboxes, Apply selected and Discard; above
 * that, a compact card whose changes are reviewed in a dialog. Both share one selection and one list of changes.
 * @param {object} props - Props.
 * @param {ChangeSetCardState} props.cardState - Card state.
 * @param {boolean} props.busy - An answer is running, or another card is applying (Apply waits for it).
 * @param {Function} props.onApply - Applies the selected operations.
 * @param {Function} props.onDiscard - Discards the card.
 * @returns {React.ReactElement} The card.
 */
export const ChangeSetCard = ({
  cardState,
  busy,
  onApply,
  onDiscard,
}: {
  cardState: ChangeSetCardState
  busy: boolean
  onApply: (operationIds: string[]) => Promise<void>
  onDiscard: () => Promise<void> | void
}) => {
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const items = useMemo(() => buildReviewItems({ cardState, survey, lang }), [cardState, lang, survey])
  const compact = isCompactCard(items.length)
  const selection = useChangeSetSelection({ cardState, compact, survey, onApply, onDiscard })
  const [reviewOpen, setReviewOpen] = useState(false)
  // Apply all of a compact card asks to confirm until the dialog was opened
  const [reviewed, setReviewed] = useState(false)

  if (!compact) return <ChangeSetFullCard busy={busy} cardState={cardState} items={items} selection={selection} />

  return (
    <>
      <ChangeSetCompactCard
        busy={busy}
        cardState={cardState}
        items={items}
        onReview={() => {
          setReviewed(true)
          setReviewOpen(true)
        }}
        reviewed={reviewed}
        selection={selection}
      />
      {reviewOpen && (
        <ChangeSetReviewDialog
          busy={busy}
          cardState={cardState}
          items={items}
          onClose={() => setReviewOpen(false)}
          selection={selection}
        />
      )}
    </>
  )
}
