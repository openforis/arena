import './ChangeSetReviewDialog.scss'

import React, { useEffect, useMemo, useRef, useState } from 'react'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import { Button, ButtonIconClose } from '@webapp/components/buttons'
import { Modal } from '@webapp/components/modal'
import { useIsSurveyDirty } from '@webapp/store/survey'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { CardValueView } from './CardValueView'
import {
  filterReviewItems,
  getReviewLabelText,
  getSelectionState,
  groupReviewItems,
  toggleSelection,
  type ReviewFilter,
  type ReviewGroup,
  type ReviewGroupBy,
  type ReviewItem,
  type SelectionState,
} from './changeSetReviewModel'
import type { ChangeSetSelection } from './useChangeSetSelection'
import { useShowNodeDef } from './useShowNodeDef'

/**
 * A checkbox for a group of changes: checked, unchecked or mixed.
 * @param {object} props - Props.
 * @param {SelectionState} props.state - State of the group.
 * @param {string} props.label - Accessible label.
 * @param {Function} props.onChange - Toggles the group.
 * @param {string} [props.testId] - Test id.
 * @returns {React.ReactElement} The checkbox.
 */
const GroupCheckbox = ({
  state,
  label,
  onChange,
  testId,
}: {
  state: SelectionState
  label: string
  onChange: () => void
  testId?: string
}) => {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'some'
  }, [state])
  return (
    <input
      aria-label={label}
      checked={state === 'all'}
      data-testid={testId}
      disabled={state === 'disabled'}
      onChange={onChange}
      ref={ref}
      type="checkbox"
    />
  )
}

/**
 * One change: checkbox (pending only), item, kind of change, current and proposed value, status.
 * @param {object} props - Props.
 * @param {ReviewItem} props.item - Change.
 * @param {ChangeSetSelection} props.selection - Selection.
 * @param {Function} props.onNameClick - Shows the item in the form designer.
 * @returns {React.ReactElement} The row.
 */
const ReviewRow = ({
  item,
  selection,
  onNameClick,
}: {
  item: ReviewItem
  selection: ChangeSetSelection
  onNameClick: (nodeDefUuid: string) => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const pending = selection.pendingIds.includes(item.id)
  const conflict = selection.conflictIds.includes(item.id)
  const fieldText = t(item.field.key, item.field.params)
  const { nodeDefUuid, result } = item
  return (
    <tr
      className={conflict ? 'ai-change-review__row--conflict' : undefined}
      data-testid={TestId.aiAssistant.reviewRow(item.id)}
    >
      <td className="ai-change-review__check">
        {pending && (
          <input
            aria-label={`${item.name}: ${fieldText}`}
            checked={selection.selectedIds.includes(item.id)}
            disabled={conflict}
            onChange={() => selection.toggle(item.id)}
            type="checkbox"
          />
        )}
      </td>
      <td className="ai-change-review__item">
        {nodeDefUuid ? (
          <button className="ai-assistant-card__name" onClick={() => onNameClick(nodeDefUuid)} type="button">
            {item.name}
          </button>
        ) : (
          <code>{item.name}</code>
        )}
        {item.detail && <span className="ai-change-review__detail">{item.detail}</span>}
      </td>
      <td>
        {fieldText}
        {conflict && <span className="ai-change-review__badge">{t('aiAssistant.card.status.conflict')}</span>}
      </td>
      <td className="ai-change-review__from">{item.from ? <CardValueView value={item.from} /> : null}</td>
      <td className="ai-change-review__to">
        <CardValueView value={item.to} />
      </td>
      <td>
        {result && (
          <span
            className={`ai-assistant-card__status ai-assistant-card__status--${result.status}`}
            title={result.message}
          >
            {t(`aiAssistant.card.status.${result.status}`)}
          </span>
        )}
      </td>
    </tr>
  )
}

/**
 * The changes of one group: a header row with its checkbox, then one row per change.
 * @param {object} props - Props.
 * @param {ReviewGroup} props.group - Group.
 * @param {ChangeSetSelection} props.selection - Selection.
 * @param {Function} props.onNameClick - Shows an item in the form designer.
 * @returns {React.ReactElement} The rows.
 */
const ReviewGroupRows = ({
  group,
  selection,
  onNameClick,
}: {
  group: ReviewGroup
  selection: ChangeSetSelection
  onNameClick: (nodeDefUuid: string) => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const ids = group.items.map((item) => item.id)
  const name = getReviewLabelText(group.label, t)
  const { selectedIds, selectableIds } = selection
  const state = getSelectionState({ ids, selectedIds, selectableIds })
  const onToggle = () => {
    const next = toggleSelection({ ids, selectedIds, selectableIds })
    selection.setSelected(next.ids, next.selected)
  }
  return (
    <>
      <tr className="ai-change-review__group">
        <td className="ai-change-review__check">
          {selection.pendingIds.length > 0 && (
            <GroupCheckbox
              label={t('aiAssistant.card.review.selectGroup', { name })}
              onChange={onToggle}
              state={state}
            />
          )}
        </td>
        <td colSpan={5}>
          {name} <span className="ai-change-review__group-count">{group.items.length}</span>
        </td>
      </tr>
      {group.items.map((item) => (
        <ReviewRow item={item} key={item.id} onNameClick={onNameClick} selection={selection} />
      ))}
    </>
  )
}

/**
 * Segmented buttons (group by, filter).
 * @param {object} props - Props.
 * @param {string} props.label - Accessible label of the set.
 * @param {{value: string, label: string}[]} props.options - Options.
 * @param {string} props.value - Pressed option.
 * @param {Function} props.onChange - Called with the clicked option.
 * @returns {React.ReactElement} The buttons.
 */
const Segmented = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) => (
  <div aria-label={label} className="ai-change-review__segmented" role="group">
    {options.map((option) => (
      <button
        aria-pressed={option.value === value}
        key={option.value}
        onClick={() => onChange(option.value)}
        type="button"
      >
        {option.label}
      </button>
    ))}
  </div>
)

/**
 * Review dialog of a long change set: the changes grouped by entity or by kind of change, a side list to show one
 * group, search and filters, checkboxes per change, per group and for everything shown, Apply and Discard.
 * @param {object} props - Props.
 * @param {ChangeSetCardState} props.cardState - Card state.
 * @param {ReviewItem[]} props.items - Changes.
 * @param {ChangeSetSelection} props.selection - Selection and actions (shared with the card).
 * @param {boolean} props.busy - An answer is running (Apply waits for it).
 * @param {Function} props.onClose - Closes the dialog (the selection is kept).
 * @returns {React.ReactElement} The dialog.
 */
export const ChangeSetReviewDialog = ({
  cardState,
  items,
  selection,
  busy,
  onClose,
}: {
  cardState: ChangeSetCardState
  items: ReviewItem[]
  selection: ChangeSetSelection
  busy: boolean
  onClose: () => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const dirty = useIsSurveyDirty()
  const showNodeDef = useShowNodeDef()
  const [groupBy, setGroupBy] = useState<ReviewGroupBy>('entity')
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [search, setSearch] = useState('')
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null)
  const { pendingIds, conflictIds, selectableIds, selectedIds, applying } = selection

  const allGroups = useMemo(() => groupReviewItems(items, groupBy), [groupBy, items])
  const shownItems = useMemo(
    () => filterReviewItems(items, { filter, search, selectedIds, conflictIds }),
    [conflictIds, filter, items, search, selectedIds]
  )
  const shownGroups = groupReviewItems(shownItems, groupBy).filter(
    (group) => activeGroupKey === null || group.key === activeGroupKey
  )
  const shownIds = shownGroups.flatMap((group) => group.items.map((item) => item.id))
  const shownState = getSelectionState({ ids: shownIds, selectedIds, selectableIds })

  const onGroupByChange = (value: ReviewGroupBy) => {
    setGroupBy(value)
    setActiveGroupKey(null)
  }

  const onToggleShown = () => {
    const next = toggleSelection({ ids: shownIds, selectedIds, selectableIds })
    selection.setSelected(next.ids, next.selected)
  }

  // the item opens in the form designer, behind the dialog: close it
  const onNameClick = (nodeDefUuid: string) => {
    onClose()
    showNodeDef(nodeDefUuid)
  }

  const filterOptions: { value: ReviewFilter; label: string }[] = [
    { value: 'all', label: t('aiAssistant.card.review.all', { count: items.length }) },
    { value: 'selected', label: t('aiAssistant.card.review.selected', { count: selectedIds.length }) },
    ...(conflictIds.length > 0
      ? [{ value: 'conflicts' as const, label: t('aiAssistant.card.review.conflicts', { count: conflictIds.length }) }]
      : []),
  ]

  return (
    <Modal className="ai-change-review" onClose={onClose}>
      <div className="ai-change-review__content" data-testid={TestId.aiAssistant.reviewDialog}>
        <div className="ai-change-review__header">
          <h2>{t('aiAssistant.card.review.title')}</h2>
          <span className="ai-change-review__summary">{cardState.changeSet.summary}</span>
          <ButtonIconClose onClick={onClose} testId={TestId.aiAssistant.reviewCloseBtn} />
        </div>
        {conflictIds.length > 0 && (
          <div className="ai-assistant-card__stale" role="status">
            {t('aiAssistant.card.stale')}
          </div>
        )}
        <div className="ai-change-review__toolbar">
          <input
            aria-label={t('aiAssistant.card.review.search')}
            className="ai-change-review__search"
            data-testid={TestId.aiAssistant.reviewSearch}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('aiAssistant.card.review.search')}
            type="search"
            value={search}
          />
          <Segmented<ReviewGroupBy>
            label={t('aiAssistant.card.review.groupBy')}
            onChange={onGroupByChange}
            options={[
              { value: 'entity', label: t('aiAssistant.card.review.byEntity') },
              { value: 'field', label: t('aiAssistant.card.review.byField') },
            ]}
            value={groupBy}
          />
          <Segmented<ReviewFilter>
            label={t('aiAssistant.card.review.show')}
            onChange={setFilter}
            options={filterOptions}
            value={filter}
          />
        </div>
        <div className="ai-change-review__main">
          <nav aria-label={t('aiAssistant.card.review.groups')} className="ai-change-review__side">
            <button aria-pressed={activeGroupKey === null} onClick={() => setActiveGroupKey(null)} type="button">
              <span>{t('aiAssistant.card.review.allChanges')}</span>
              <span>{items.length}</span>
            </button>
            {allGroups.map((group) => (
              <button
                aria-pressed={activeGroupKey === group.key}
                key={group.key}
                onClick={() => setActiveGroupKey(group.key)}
                type="button"
              >
                <span>{getReviewLabelText(group.label, t)}</span>
                <span>{group.items.length}</span>
              </button>
            ))}
          </nav>
          <div className="ai-change-review__table-wrap">
            <table className="ai-change-review__table">
              <thead>
                <tr>
                  <th className="ai-change-review__check">
                    {pendingIds.length > 0 && (
                      <GroupCheckbox
                        label={t('aiAssistant.card.review.selectShown')}
                        onChange={onToggleShown}
                        state={shownState}
                        testId={TestId.aiAssistant.reviewSelectShown}
                      />
                    )}
                  </th>
                  <th>{t('aiAssistant.card.review.item')}</th>
                  <th>{t('aiAssistant.card.review.change')}</th>
                  <th>{t('aiAssistant.card.review.current')}</th>
                  <th>{t('aiAssistant.card.review.proposed')}</th>
                  <th>
                    <span className="ai-change-review__sr-only">{t('aiAssistant.card.review.status')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shownGroups.map((group) => (
                  <ReviewGroupRows group={group} key={group.key} onNameClick={onNameClick} selection={selection} />
                ))}
              </tbody>
            </table>
            {shownGroups.length === 0 && (
              <p className="ai-change-review__empty">{t('aiAssistant.card.review.noMatch')}</p>
            )}
          </div>
        </div>
        <div className="ai-change-review__footer">
          <span className="ai-change-review__selected">
            {pendingIds.length > 0 &&
              t('aiAssistant.card.review.selectedOf', { selected: selectedIds.length, total: pendingIds.length })}
            {pendingIds.length > 0 && dirty && ` · ${t('aiAssistant.card.saveCurrentEditFirst')}`}
          </span>
          {pendingIds.length > 0 && (
            <Button
              disabled={busy || applying}
              label="aiAssistant.card.review.discardAll"
              onClick={selection.discard}
              testId={TestId.aiAssistant.reviewDiscardBtn}
              variant="text"
            />
          )}
          <Button label="aiAssistant.card.review.close" onClick={onClose} />
          {pendingIds.length > 0 && (
            <Button
              disabled={busy || applying || dirty || selectedIds.length === 0}
              label="aiAssistant.card.applySelectedCount"
              labelParams={{ count: selectedIds.length }}
              onClick={selection.apply}
              primary
              testId={TestId.aiAssistant.reviewApplyBtn}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
