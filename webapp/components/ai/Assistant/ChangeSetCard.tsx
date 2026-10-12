import React, { useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import { Button } from '@webapp/components/buttons'
import { useIsSurveyDirty, useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { CardValueView } from './CardValueView'
import { buildCategoryLabelGroups } from './categoryLabelCardModel'
import { CategoryLabelGroups } from './CategoryLabelGroups'
import { ChangeSetCompactCard } from './ChangeSetCompactCard'
import { ChangeSetReviewDialog } from './ChangeSetReviewDialog'
import { buildCardRows, type CardRow } from './changeSetCardModel'
import { buildReviewItems, isCompactCard } from './changeSetReviewModel'
import { useChangeSetSelection, type ChangeSetSelection } from './useChangeSetSelection'
import { useShowNodeDef } from './useShowNodeDef'

/**
 * One row of the card: checkbox, item name, title, status and the change.
 * @param {object} props - Props.
 * @param {CardRow} props.row - Row.
 * @param {boolean} props.pending - Row can still be applied.
 * @param {boolean} props.selected - Row is selected.
 * @param {boolean} props.conflict - The survey changed since the proposal: the row cannot be selected.
 * @param {boolean} props.exists - Item exists in the survey.
 * @param {Function} props.onToggle - Toggles the selection.
 * @param {Function} props.onNameClick - Shows the item in the form designer.
 * @returns {React.ReactElement} The row.
 */
const CardRowView = ({
  row,
  pending,
  selected,
  conflict,
  exists,
  onToggle,
  onNameClick,
}: {
  row: CardRow
  pending: boolean
  selected: boolean
  conflict: boolean
  exists: boolean
  onToggle: () => void
  onNameClick: () => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const { result } = row
  return (
    <li className="ai-assistant-card__row" data-testid={TestId.aiAssistant.changeSetRow(row.nodeDefName)}>
      {pending && (
        <input
          aria-label={`${row.nodeDefName}: ${t(row.titleKey, row.titleParams)}`}
          checked={selected && !conflict}
          disabled={conflict}
          onChange={onToggle}
          type="checkbox"
        />
      )}
      <div className="ai-assistant-card__row-body">
        <div className="ai-assistant-card__row-title">
          <button className="ai-assistant-card__name" disabled={!exists} onClick={onNameClick} type="button">
            {row.nodeDefName}
          </button>
          <span>{t(row.titleKey, row.titleParams)}</span>
          {result && (
            <span
              className={`ai-assistant-card__status ai-assistant-card__status--${result.status}`}
              data-testid={TestId.aiAssistant.changeSetRowStatus}
              title={result.message}
            >
              {t(`aiAssistant.card.status.${result.status}`)}
            </span>
          )}
        </div>
        <div className="ai-assistant-card__diff">
          {row.from && (
            <>
              <span className="ai-assistant-card__from">
                <CardValueView value={row.from} />
              </span>
              <span aria-hidden="true">→</span>
            </>
          )}
          <span className="ai-assistant-card__to">
            <CardValueView value={row.to} />
          </span>
        </div>
      </div>
    </li>
  )
}

/**
 * The card with every change listed (short change sets).
 * @param {object} props - Props.
 * @param {ChangeSetCardState} props.cardState - Card state.
 * @param {ChangeSetSelection} props.selection - Selection and actions.
 * @param {boolean} props.busy - An answer is running (Apply waits for it).
 * @returns {React.ReactElement} The card.
 */
const ChangeSetFullCard = ({
  cardState,
  selection,
  busy,
}: {
  cardState: ChangeSetCardState
  selection: ChangeSetSelection
  busy: boolean
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const dirty = useIsSurveyDirty()
  const showNodeDef = useShowNodeDef()
  const { pendingIds, conflictIds, selectedIds, applying, toggle } = selection

  const rows = useMemo(() => buildCardRows({ cardState, survey, lang }), [cardState, lang, survey])
  const categoryGroups = useMemo(() => buildCategoryLabelGroups({ cardState, survey }), [cardState, survey])

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
        <div className="ai-assistant-card__stale" data-testid={TestId.aiAssistant.stale} role="status">
          {t('aiAssistant.card.stale')}
        </div>
      )}
      <ul className="ai-assistant-card__rows">
        {rows.map((row) => (
          <CardRowView
            exists={Boolean(Survey.getNodeDefByUuid(row.nodeDefUuid)(survey))}
            conflict={conflictIds.includes(row.id)}
            key={row.id}
            onNameClick={() => showNodeDef(row.nodeDefUuid)}
            onToggle={() => toggle(row.id)}
            pending={pendingIds.includes(row.id)}
            row={row}
            selected={selectedIds.includes(row.id)}
          />
        ))}
      </ul>
      <CategoryLabelGroups
        groups={categoryGroups}
        onToggle={toggle}
        pendingIds={pendingIds}
        selectedIds={selectedIds}
      />
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
 * that, a compact card whose changes are reviewed in a dialog. Both share one selection.
 * @param {object} props - Props.
 * @param {ChangeSetCardState} props.cardState - Card state.
 * @param {boolean} props.busy - An answer is running (Apply waits for it).
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
  const selection = useChangeSetSelection({ cardState, survey, onApply, onDiscard })
  const [reviewOpen, setReviewOpen] = useState(false)
  const items = useMemo(() => buildReviewItems({ cardState, survey, lang }), [cardState, lang, survey])

  if (!isCompactCard(items.length)) return <ChangeSetFullCard busy={busy} cardState={cardState} selection={selection} />

  return (
    <>
      <ChangeSetCompactCard
        busy={busy}
        cardState={cardState}
        items={items}
        onReview={() => setReviewOpen(true)}
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
