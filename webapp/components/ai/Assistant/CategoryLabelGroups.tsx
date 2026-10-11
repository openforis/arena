import React from 'react'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { CategoryLabelGroup, CategoryLabelRow } from './categoryLabelCardModel'

/**
 * One label row: checkbox, item, language, status and the change.
 * @param {object} props - Props.
 * @param {CategoryLabelRow} props.row - Row.
 * @param {boolean} props.pending - Row can still be applied.
 * @param {boolean} props.selected - Row is selected.
 * @param {Function} props.onToggle - Toggles the selection.
 * @returns {React.ReactElement} The row.
 */
const CategoryLabelRowView = ({
  row,
  pending,
  selected,
  onToggle,
}: {
  row: CategoryLabelRow
  pending: boolean
  selected: boolean
  onToggle: () => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const { result } = row
  const title = t('aiAssistant.card.categoryItem', { ref: row.ref, level: row.levelName })
  const statusTitle = row.currentText ? `${result?.message}: ${row.currentText}` : result?.message
  return (
    <li className="ai-assistant-card__row" data-testid={TestId.aiAssistant.categoryLabelRow(row.ref, row.lang)}>
      {pending && (
        <input aria-label={`${title} (${row.lang})`} checked={selected} onChange={onToggle} type="checkbox" />
      )}
      <div className="ai-assistant-card__row-body">
        <div className="ai-assistant-card__row-title">
          <span>{title}</span>
          <code>{row.lang}</code>
          {result && (
            <span
              className={`ai-assistant-card__status ai-assistant-card__status--${result.status}`}
              data-testid={TestId.aiAssistant.changeSetRowStatus}
              title={statusTitle}
            >
              {t(`aiAssistant.card.status.${result.status}`)}
            </span>
          )}
        </div>
        <div className="ai-assistant-card__diff">
          <span className="ai-assistant-card__from">{row.from ?? t('aiAssistant.card.empty')}</span>
          <span aria-hidden="true">→</span>
          <span className="ai-assistant-card__to">{row.to}</span>
        </div>
      </div>
    </li>
  )
}

/**
 * The category label operations of a card, one group per category.
 * @param {object} props - Props.
 * @param {CategoryLabelGroup[]} props.groups - Groups.
 * @param {string[]} props.pendingIds - Operations that can still be applied.
 * @param {string[]} props.selectedIds - Selected operations.
 * @param {Function} props.onToggle - Toggles the selection of an operation.
 * @returns {React.ReactElement|null} The groups.
 */
export const CategoryLabelGroups = ({
  groups,
  pendingIds,
  selectedIds,
  onToggle,
}: {
  groups: CategoryLabelGroup[]
  pendingIds: string[]
  selectedIds: string[]
  onToggle: (id: string) => void
}) => {
  if (groups.length === 0) return null
  return (
    <>
      {groups.map((group) => (
        <div
          className="ai-assistant-card__category"
          data-testid={TestId.aiAssistant.categoryLabelGroup(group.categoryName)}
          key={group.categoryUuid}
        >
          <div className="ai-assistant-card__category-name">{group.categoryName}</div>
          <ul className="ai-assistant-card__rows">
            {group.rows.map((row) => (
              <CategoryLabelRowView
                key={row.id}
                onToggle={() => onToggle(row.id)}
                pending={pendingIds.includes(row.id)}
                row={row}
                selected={selectedIds.includes(row.id)}
              />
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}
