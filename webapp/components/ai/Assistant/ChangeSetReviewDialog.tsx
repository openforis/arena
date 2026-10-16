import './ChangeSetReviewDialog.scss'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import { Button, ButtonIconClose } from '@webapp/components/buttons'
import { Modal } from '@webapp/components/modal'
import { useIsSurveyDirty } from '@webapp/store/survey'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { CardValueView } from './CardValueView'
import {
  ChangeItemConflict,
  ChangeItemDetails,
  ChangeItemName,
  ChangeItemReplaces,
  ChangeItemStatus,
  LangTag,
} from './ChangeItem'
import { getItemKind, getItemLang, getReviewColumns, isSameItemAsPrevious, type ReviewColumns } from './changeItemModel'
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
import { useNodeDefExists, useShowNodeDef } from './useShowNodeDef'

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
 * One change: checkbox (pending only), item, what it changes, the original text of a translation, the current value
 * (only in the columns shown), the proposal and status.
 * @param {object} props - Props.
 * @param {ReviewItem} props.item - Change.
 * @param {boolean} props.repeated - The change before it is about the same item (its name is not repeated).
 * @param {ReviewColumns} props.columns - Columns of the table.
 * @param {ChangeSetSelection} props.selection - Selection.
 * @param {boolean} props.exists - The node definition of the change exists in the survey.
 * @param {Function} props.onNameClick - Shows the item in the form designer.
 * @returns {React.ReactElement} The row.
 */
const ReviewRow = ({
  item,
  repeated,
  columns,
  selection,
  exists,
  onNameClick,
}: {
  item: ReviewItem
  repeated: boolean
  columns: ReviewColumns
  selection: ChangeSetSelection
  exists: boolean
  onNameClick: (nodeDefUuid: string) => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const pending = selection.pendingIds.includes(item.id)
  const conflict = selection.conflicts.find((other) => other.id === item.id)
  const fieldText = t(item.field.key, item.field.params)
  const { nodeDefUuid, result, source } = item
  const lang = getItemLang(item)
  const kind = getItemKind(item)
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
            disabled={conflict !== undefined}
            onChange={() => selection.toggle(item.id)}
            type="checkbox"
          />
        )}
      </td>
      <td className="ai-change-review__item">
        {!repeated && nodeDefUuid && (
          <ChangeItemName exists={exists} name={item.name} onClick={() => onNameClick(nodeDefUuid)} />
        )}
        {!repeated && !nodeDefUuid && (
          <>
            <code>{item.name}</code>
            {item.detail && <span className="ai-change-review__detail">{item.detail}</span>}
          </>
        )}
      </td>
      <td className="ai-change-review__kind">
        {t(kind.key, kind.params)}
        {conflict && <span className="ai-change-review__badge">{t('aiAssistant.card.status.conflict')}</span>}
        {conflict && <ChangeItemConflict conflict={conflict} />}
      </td>
      {columns.original && (
        <td
          className="ai-change-item__original"
          data-testid={source ? TestId.aiAssistant.translationSource : undefined}
        >
          {source && (
            <span lang={source.lang}>
              {!columns.original.lang && <LangTag lang={source.lang} />}
              {source.text}
            </span>
          )}
        </td>
      )}
      {columns.current && (
        <td className="ai-change-review__from">{!source && item.from ? <CardValueView value={item.from} /> : null}</td>
      )}
      <td className="ai-change-review__to">
        {!columns.proposedLang && lang && source && <LangTag lang={lang} />}
        <CardValueView value={item.to} />
        {source && <ChangeItemReplaces value={item.from} />}
        <ChangeItemDetails item={item} />
      </td>
      <td>{result && <ChangeItemStatus result={result} />}</td>
    </tr>
  )
}

/**
 * Returns the number of columns of the table: check, item, change, the optional original and current, proposed,
 * status.
 * @param {ReviewColumns} columns - Columns of the table.
 * @returns {number} The count.
 */
const getColumnCount = (columns: ReviewColumns): number => 5 + (columns.original ? 1 : 0) + (columns.current ? 1 : 0)

/**
 * The changes of one group: a header row with its checkbox, then one row per change.
 * @param {object} props - Props.
 * @param {ReviewGroup} props.group - Group.
 * @param {ReviewColumns} props.columns - Columns of the table.
 * @param {ChangeSetSelection} props.selection - Selection.
 * @param {Function} props.nodeDefExists - Tells whether a node definition exists in the survey.
 * @param {Function} props.onNameClick - Shows an item in the form designer.
 * @returns {React.ReactElement} The rows.
 */
const ReviewGroupRows = ({
  group,
  columns,
  selection,
  nodeDefExists,
  onNameClick,
}: {
  group: ReviewGroup
  columns: ReviewColumns
  selection: ChangeSetSelection
  nodeDefExists: (nodeDefUuid: string) => boolean
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
        <td colSpan={getColumnCount(columns) - 1}>
          {name} <span className="ai-change-review__group-count">{group.items.length}</span>
        </td>
      </tr>
      {group.items.map((item, index) => (
        <ReviewRow
          columns={columns}
          repeated={isSameItemAsPrevious(group.items, index)}
          exists={item.nodeDefUuid !== null && nodeDefExists(item.nodeDefUuid)}
          item={item}
          key={item.id}
          onNameClick={onNameClick}
          selection={selection}
        />
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
  const titleId = useId()
  // a callback ref (state): the dialog takes the focus when it opens, so its name is announced
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  const dirty = useIsSurveyDirty()
  const showNodeDef = useShowNodeDef()
  const nodeDefExists = useNodeDefExists()
  const [groupBy, setGroupBy] = useState<ReviewGroupBy>('entity')
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [search, setSearch] = useState('')
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null)
  const { pendingIds, conflictIds, selectableIds, selectedIds, applying } = selection
  const columns = useMemo(() => getReviewColumns(items), [items])

  useEffect(() => {
    dialog?.focus()
  }, [dialog])

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
      {/* the shared Modal forwards no role: the dialog and its name are set here */}
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="ai-change-review__content"
        data-testid={TestId.aiAssistant.reviewDialog}
        ref={setDialog}
        role="dialog"
        tabIndex={-1}
      >
        <div className="ai-change-review__header">
          <h2 id={titleId}>{t('aiAssistant.card.review.title')}</h2>
          <span className="ai-change-review__summary">{cardState.changeSet.summary}</span>
          <ButtonIconClose onClick={onClose} testId={TestId.aiAssistant.reviewCloseBtn} />
        </div>
        {conflictIds.length > 0 && (
          <div className="ai-change-item__stale" role="status">
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
                  {columns.original && (
                    <th>
                      {t('aiAssistant.card.review.original')}
                      {columns.original.lang && <LangTag lang={columns.original.lang} />}
                    </th>
                  )}
                  {columns.current && <th>{t('aiAssistant.card.review.current')}</th>}
                  <th>
                    {t('aiAssistant.card.review.proposed')}
                    {columns.proposedLang && <LangTag lang={columns.proposedLang} />}
                  </th>
                  <th>
                    <span className="ai-change-review__sr-only">{t('aiAssistant.card.review.status')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shownGroups.map((group) => (
                  <ReviewGroupRows
                    columns={columns}
                    group={group}
                    key={group.key}
                    nodeDefExists={nodeDefExists}
                    onNameClick={onNameClick}
                    selection={selection}
                  />
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
