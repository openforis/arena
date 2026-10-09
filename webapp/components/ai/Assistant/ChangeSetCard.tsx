import React, { useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

import * as Survey from '@core/survey/survey'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { Button } from '@webapp/components/buttons'
import { useIsSurveyDirty, useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18nT } from '@webapp/store/system'
import { SurveyFormActions, useTreeSelectViewMode } from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

import {
  buildCardRows,
  getNodeDefNavigation,
  getPendingOperationIds,
  isCardStale,
  type CardRow,
  type CardValue,
} from './changeSetCardModel'

/**
 * A value of a card row (text, boolean or expression list).
 * @param {object} props - Props.
 * @param {CardValue} props.value - Value.
 * @returns {React.ReactElement} The value.
 */
const CardValueView = ({ value }: { value: CardValue }) => {
  const t = useI18nT({ unescapeHtml: true })
  if (value.kind === 'boolean') return <span>{t(value.value ? 'aiAssistant.card.yes' : 'aiAssistant.card.no')}</span>
  if (value.kind === 'text') return <span>{value.text || t('aiAssistant.card.empty')}</span>
  if (value.items.length === 0) return <span>{t('aiAssistant.card.empty')}</span>
  return (
    <ul className="ai-assistant-card__expressions">
      {value.items.map((item, index) => (
        <li key={`${index}-${item.expression}`}>
          <code>{item.expression}</code>
          {item.applyIf && (
            <>
              {' '}
              <span>{t('nodeDefEdit.expressionsProp.applyIf')}</span> <code>{item.applyIf}</code>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

/**
 * One row of the card: checkbox, item name, title, status and the change.
 * @param {object} props - Props.
 * @param {CardRow} props.row - Row.
 * @param {boolean} props.pending - Row can still be applied.
 * @param {boolean} props.selected - Row is selected.
 * @param {boolean} props.exists - Item exists in the survey.
 * @param {Function} props.onToggle - Toggles the selection.
 * @param {Function} props.onNameClick - Shows the item in the form designer.
 * @returns {React.ReactElement} The row.
 */
const CardRowView = ({
  row,
  pending,
  selected,
  exists,
  onToggle,
  onNameClick,
}: {
  row: CardRow
  pending: boolean
  selected: boolean
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
          aria-label={t('aiAssistant.card.selectOperation')}
          checked={selected}
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
 * Change set card: the proposed operations with checkboxes, Apply selected and Discard.
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
  const t = useI18nT({ unescapeHtml: true })
  const dispatch = useDispatch<any>()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const cycle = useSurveyCycleKey()
  const dirty = useIsSurveyDirty()
  const viewMode = useTreeSelectViewMode()
  const [deselected, setDeselected] = useState<string[]>([])
  const [applying, setApplying] = useState(false)
  // set before the re-render, so two quick clicks can't both start an Apply
  const applyingRef = useRef(false)

  const rows = useMemo(() => buildCardRows({ cardState, survey, lang }), [cardState, lang, survey])
  const pendingIds = useMemo(() => getPendingOperationIds(cardState), [cardState])
  const stale = useMemo(() => isCardStale({ cardState, survey }), [cardState, survey])
  const selectedIds = pendingIds.filter((id) => !deselected.includes(id))

  /**
   * Toggles the selection of an operation.
   * @param {string} id - Operation id.
   * @returns {void} Nothing.
   */
  const toggle = (id: string) =>
    setDeselected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))

  /**
   * Shows an item in the form designer.
   * @param {string} nodeDefUuid - Item uuid.
   * @returns {void} Nothing.
   */
  const showNodeDef = (nodeDefUuid: string) => {
    const navigation = getNodeDefNavigation({ survey, nodeDefUuid, cycle, viewMode })
    if (!navigation) return
    if (navigation.type === 'select') {
      dispatch(SurveyFormActions.setFormActiveNodeDefUuid(navigation.nodeDefUuid))
    } else {
      dispatch(
        SurveyFormActions.setFormActivePage({ nodeDef: Survey.getNodeDefByUuid(navigation.pageNodeDefUuid)(survey) })
      )
    }
    const formDesignerUri = appModuleUri(designerModules.formDesigner)
    if (!pathname.startsWith(formDesignerUri)) navigate(formDesignerUri)
  }

  /**
   * Runs an Apply or Discard unless one is already running.
   * @param {Function} action - The action to run.
   * @returns {Promise<void>} Resolves when the action ends.
   */
  const runExclusive = async (action: () => Promise<void> | void) => {
    if (applyingRef.current) return
    applyingRef.current = true
    setApplying(true)
    try {
      await action()
    } finally {
      applyingRef.current = false
      setApplying(false)
    }
  }

  /**
   * Applies the selected operations.
   * @returns {Promise<void>} Resolves when the Apply ends.
   */
  const onApplyClick = () => runExclusive(() => onApply(selectedIds))

  /**
   * Discards the card.
   * @returns {Promise<void>} Resolves when the Discard ends.
   */
  const onDiscardClick = () => runExclusive(onDiscard)

  return (
    <section
      aria-label={t('aiAssistant.card.title')}
      className="ai-assistant-card"
      data-testid={TestId.aiAssistant.changeSetCard}
    >
      <div className="ai-assistant-card__header">
        <strong>{t('aiAssistant.card.title')}</strong>
        <span>{cardState.changeSet.summary}</span>
      </div>
      {stale && (
        <div className="ai-assistant-card__stale" data-testid={TestId.aiAssistant.stale} role="status">
          {t('aiAssistant.card.stale')}
        </div>
      )}
      <ul className="ai-assistant-card__rows">
        {rows.map((row) => (
          <CardRowView
            exists={Boolean(Survey.getNodeDefByUuid(row.nodeDefUuid)(survey))}
            key={row.id}
            onNameClick={() => showNodeDef(row.nodeDefUuid)}
            onToggle={() => toggle(row.id)}
            pending={pendingIds.includes(row.id)}
            row={row}
            selected={selectedIds.includes(row.id)}
          />
        ))}
      </ul>
      {cardState.discarded && <p className="ai-assistant-card__hint">{t('aiAssistant.card.discarded')}</p>}
      {pendingIds.length > 0 && (
        <div className="ai-assistant-card__footer">
          {dirty && <p className="ai-assistant-card__hint">{t('aiAssistant.card.saveCurrentEditFirst')}</p>}
          <Button
            disabled={busy || applying || dirty || selectedIds.length === 0}
            label="aiAssistant.card.applySelected"
            onClick={onApplyClick}
            primary
            testId={TestId.aiAssistant.applyBtn}
          />
          <Button
            disabled={busy || applying}
            label="aiAssistant.card.discard"
            onClick={onDiscardClick}
            testId={TestId.aiAssistant.discardBtn}
            variant="text"
          />
        </div>
      )}
    </section>
  )
}
