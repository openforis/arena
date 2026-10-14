import React from 'react'
import classNames from 'classnames'

import {
  SurveyCompareChange,
  SurveyCompareChildItemDiff,
  SurveyCompareCounts,
  SurveyComparePropDiff,
  SurveyCompareStatus,
} from '@core/survey/surveyCompare/surveyCompareTypes'

import { useI18n } from '@webapp/store/system'

import {
  ApplicabilityIcon,
  ApplicabilityMessages,
  ChildItemStatus,
  DeletionNote,
  RemovalChange,
  SelectionCheckbox,
  StatusBadge,
} from './SurveyCompareCommon'
import { SurveyComparePropDiffs } from './SurveyComparePropDiffs'

const maxChildrenShown = 500

export interface DiffWithChildren extends SurveyCompareChange {
  name: string
  propDiffs: SurveyComparePropDiff[]
  removal?: SurveyCompareChange
}

export interface ChildRow {
  key: string
  label: string
  item: SurveyCompareChildItemDiff
}

interface ListWithChildrenConfig<T extends DiffWithChildren> {
  getChildren: (diff: T) => ChildRow[]
  getCounts: (diff: T) => SurveyCompareCounts
  countsLabelKey: string
  childLabelKey: string
  removalLabelKey: string
}

const Counts = ({ counts, labelKey }: { counts: SurveyCompareCounts; labelKey: string }) => {
  const i18n = useI18n()
  const { added, changed, removed } = counts
  if (added + changed + removed === 0) return null
  return <span className="survey-compare__row-note">{i18n.t(labelKey, { added, changed, removed })}</span>
}

const Details = <T extends DiffWithChildren>({
  diff,
  config,
  canEdit,
  selectedIds,
  onToggle,
}: {
  diff?: T
  config: ListWithChildrenConfig<T>
  canEdit: boolean
  selectedIds: Set<string>
  onToggle: (id: string, selected: boolean) => void
}) => {
  const i18n = useI18n()
  if (!diff) {
    return <div className="survey-compare__details-empty">{i18n.t('surveyCompareView:selectItem')}</div>
  }
  const children = config.getChildren(diff)
  const childrenShown = children.slice(0, maxChildrenShown)
  return (
    <div className="survey-compare__details">
      <div className="survey-compare__details-header">
        <StatusBadge status={diff.status} />
        <span className="survey-compare__details-path">{diff.name}</span>
      </div>
      <ApplicabilityMessages applicability={diff.applicability} />
      {diff.status === SurveyCompareStatus.removed && (
        <div className="survey-compare__deletion-info">{i18n.t('surveyCompareView:removedItemInfo')}</div>
      )}
      <RemovalChange
        canEdit={canEdit}
        removal={diff.removal}
        label={config.removalLabelKey}
        selected={Boolean(diff.removal && selectedIds.has(diff.removal.id))}
        onToggle={onToggle}
      />
      <SurveyComparePropDiffs propDiffs={diff.propDiffs} />
      {childrenShown.length > 0 && (
        <table className="survey-compare__prop-diffs">
          <thead>
            <tr>
              <th>{i18n.t(config.childLabelKey)}</th>
              <th>{i18n.t('surveyCompareView:statusLabel')}</th>
              <th>{i18n.t('surveyCompareView:changes')}</th>
            </tr>
          </thead>
          <tbody>
            {childrenShown.map(({ key, label, item }) => (
              <tr key={key}>
                <td>{label}</td>
                <td>
                  <ChildItemStatus item={item} />
                </td>
                <td>
                  <SurveyComparePropDiffs propDiffs={item.propDiffs} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {children.length > maxChildrenShown && (
        <div className="survey-compare__details-info">
          {i18n.t('surveyCompareView:moreItems', { count: children.length - maxChildrenShown })}
        </div>
      )}
    </div>
  )
}

/**
 * List of elements with children (categories with items, taxonomies with taxa) and details of the selected one.
 * @returns {React.ReactElement} - The component.
 */
export const SurveyCompareListWithChildren = <T extends DiffWithChildren>({
  diffs,
  config,
  canEdit,
  selectedIds,
  onToggle,
  onlyDifferences,
  selectedItemId,
  onSelectItem,
}: {
  diffs: T[]
  config: ListWithChildrenConfig<T>
  canEdit: boolean
  selectedIds: Set<string>
  onToggle: (id: string, selected: boolean) => void
  onlyDifferences: boolean
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}) => {
  const i18n = useI18n()
  const diffsShown = diffs.filter((diff) => !onlyDifferences || diff.status !== SurveyCompareStatus.identical)
  return (
    <div className="survey-compare__split">
      <div className="survey-compare__tree">
        {diffsShown.length === 0 && (
          <div className="survey-compare__details-empty">{i18n.t('surveyCompareView:noDifferences')}</div>
        )}
        {diffsShown.map((diff) => (
          <div
            key={diff.id}
            className={classNames('survey-compare__row', `survey-compare__row--${diff.status}`, {
              'survey-compare__row--active': diff.id === selectedItemId,
            })}
          >
            <SelectionCheckbox canEdit={canEdit} diff={diff} selected={selectedIds.has(diff.id)} onToggle={onToggle} />
            <button type="button" className="survey-compare__row-button" onClick={() => onSelectItem(diff.id)}>
              <span className="survey-compare__row-name">{diff.name}</span>
              <StatusBadge status={diff.status} />
              <Counts counts={config.getCounts(diff)} labelKey={config.countsLabelKey} />
              <ApplicabilityIcon applicability={diff.applicability} />
              <DeletionNote diff={diff} selected={selectedIds.has(diff.id)} />
              {diff.removal && selectedIds.has(diff.removal.id) && (
                <span className="survey-compare__row-note">{i18n.t('surveyCompareView:removalSelected')}</span>
              )}
            </button>
          </div>
        ))}
      </div>
      <Details
        diff={diffs.find((diff) => diff.id === selectedItemId)}
        config={config}
        canEdit={canEdit}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  )
}
