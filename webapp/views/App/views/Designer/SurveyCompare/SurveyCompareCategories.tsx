import React from 'react'
import classNames from 'classnames'

import {
  SurveyCompareCategoryDiff,
  SurveyCompareResult,
  SurveyCompareStatus,
} from '@core/survey/surveyCompare/surveyCompareTypes'

import { useI18n } from '@webapp/store/system'

import { ApplicabilityIcon, ApplicabilityMessages, SelectionCheckbox, StatusBadge } from './SurveyCompareCommon'
import { SurveyComparePropDiffs } from './SurveyComparePropDiffs'

const maxItemsShown = 500

const ItemsCount = ({ diff }: { diff: SurveyCompareCategoryDiff }) => {
  const i18n = useI18n()
  const { added, changed, removed } = diff.itemsCount
  if (added + changed + removed === 0) return null
  return (
    <span className="survey-compare__row-note">
      {i18n.t('surveyCompareView:itemsCount', { added, changed, removed })}
    </span>
  )
}

const CategoryDiffDetails = ({ diff }: { diff?: SurveyCompareCategoryDiff }) => {
  const i18n = useI18n()
  if (!diff) {
    return <div className="survey-compare__details-empty">{i18n.t('surveyCompareView:selectItem')}</div>
  }
  const itemsShown = diff.items.slice(0, maxItemsShown)
  return (
    <div className="survey-compare__details">
      <div className="survey-compare__details-header">
        <StatusBadge status={diff.status} />
        <span className="survey-compare__details-path">{diff.name}</span>
      </div>
      <ApplicabilityMessages applicability={diff.applicability} />
      <SurveyComparePropDiffs propDiffs={diff.propDiffs} />
      {itemsShown.length > 0 && (
        <table className="survey-compare__prop-diffs">
          <thead>
            <tr>
              <th>{i18n.t('surveyCompareView:itemCode')}</th>
              <th>{i18n.t('surveyCompareView:statusLabel')}</th>
              <th>{i18n.t('surveyCompareView:changes')}</th>
            </tr>
          </thead>
          <tbody>
            {itemsShown.map((item) => (
              <tr key={item.codePath.join('/')}>
                <td>{item.codePath.join(' / ')}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td>
                  <SurveyComparePropDiffs propDiffs={item.propDiffs} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {diff.items.length > maxItemsShown && (
        <div className="survey-compare__details-info">
          {i18n.t('surveyCompareView:moreItems', { count: diff.items.length - maxItemsShown })}
        </div>
      )}
    </div>
  )
}

export const SurveyCompareCategories = ({
  result,
  canEdit,
  selectedIds,
  onToggle,
  onlyDifferences,
  selectedItemId,
  onSelectItem,
}: {
  result: SurveyCompareResult
  canEdit: boolean
  selectedIds: Set<string>
  onToggle: (id: string, selected: boolean) => void
  onlyDifferences: boolean
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}) => {
  const i18n = useI18n()
  const diffs = result.categories.filter((diff) => !onlyDifferences || diff.status !== SurveyCompareStatus.identical)
  return (
    <div className="survey-compare__split">
      <div className="survey-compare__tree">
        {diffs.length === 0 && (
          <div className="survey-compare__details-empty">{i18n.t('surveyCompareView:noDifferences')}</div>
        )}
        {diffs.map((diff) => (
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
              <ItemsCount diff={diff} />
              <ApplicabilityIcon applicability={diff.applicability} />
            </button>
          </div>
        ))}
      </div>
      <CategoryDiffDetails diff={result.categories.find((diff) => diff.id === selectedItemId)} />
    </div>
  )
}
