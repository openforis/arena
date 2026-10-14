import React, { useMemo } from 'react'
import classNames from 'classnames'

import {
  SurveyCompareNodeDefDiff,
  SurveyCompareResult,
  SurveyCompareStatus,
} from '@core/survey/surveyCompare/surveyCompareTypes'

import { useI18n } from '@webapp/store/system'

import { ApplicabilityIcon, ApplicabilityMessages, SelectionCheckbox, StatusBadge } from './SurveyCompareCommon'
import { SurveyComparePropDiffs } from './SurveyComparePropDiffs'

const indentPx = 18

// a node def is shown when it (or one of its descendants) differs, or when all node defs are shown
const getVisibleIds = ({ diffs, onlyDifferences, hideLayoutOnly }) => {
  const differs = (diff: SurveyCompareNodeDefDiff) =>
    diff.status !== SurveyCompareStatus.identical && !(hideLayoutOnly && diff.layoutOnly)
  const visible = new Set<string>()
  const diffsById = Object.fromEntries(diffs.map((diff) => [diff.id, diff]))
  for (const diff of [...diffs].reverse()) {
    if (!onlyDifferences || differs(diff) || visible.has(diff.id)) {
      visible.add(diff.id)
      let parentId = diff.parentId
      while (parentId && !visible.has(parentId)) {
        visible.add(parentId)
        parentId = diffsById[parentId]?.parentId
      }
    }
  }
  return visible
}

const NodeDefDiffDetails = ({
  diff,
  diffsById,
}: {
  diff: SurveyCompareNodeDefDiff | null
  diffsById: Record<string, any>
}) => {
  const i18n = useI18n()
  if (!diff) {
    return <div className="survey-compare__details-empty">{i18n.t('surveyCompareView:selectItem')}</div>
  }
  return (
    <div className="survey-compare__details">
      <div className="survey-compare__details-header">
        <StatusBadge status={diff.status} />
        <span className="survey-compare__details-path">{diff.path}</span>
      </div>
      {diff.matchedBy && (
        <div className="survey-compare__details-info">{i18n.t(`surveyCompareView:matchedBy.${diff.matchedBy}`)}</div>
      )}
      <ApplicabilityMessages applicability={diff.applicability} />
      {diff.dependsOn.length > 0 && (
        <div className="survey-compare__details-info">
          {i18n.t('surveyCompareView:dependsOn')}{' '}
          {diff.dependsOn.map((id: string) => diffsById[id]?.path ?? diffsById[id]?.name ?? id).join(', ')}
        </div>
      )}
      {diff.status === SurveyCompareStatus.identical && (
        <div className="survey-compare__details-info">{i18n.t('surveyCompareView:identicalItem')}</div>
      )}
      <SurveyComparePropDiffs propDiffs={diff.propDiffs} />
    </div>
  )
}

export const SurveyCompareNodeDefs = ({
  result,
  canEdit,
  selectedIds,
  onToggle,
  onlyDifferences,
  hideLayoutOnly,
  selectedItemId,
  onSelectItem,
}: {
  result: SurveyCompareResult
  canEdit: boolean
  selectedIds: Set<string>
  onToggle: (id: string, selected: boolean) => void
  onlyDifferences: boolean
  hideLayoutOnly: boolean
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}) => {
  const i18n = useI18n()
  const diffs = result.nodeDefs
  const diffsById = useMemo(
    () => Object.fromEntries([...diffs, ...result.categories].map((diff) => [diff.id, diff])),
    [diffs, result.categories]
  )
  const visibleIds = useMemo(
    () => getVisibleIds({ diffs, onlyDifferences, hideLayoutOnly }),
    [diffs, onlyDifferences, hideLayoutOnly]
  )
  const visibleDiffs = diffs.filter((diff) => visibleIds.has(diff.id))

  return (
    <div className="survey-compare__split">
      <div className="survey-compare__tree">
        {visibleDiffs.length === 0 && (
          <div className="survey-compare__details-empty">{i18n.t('surveyCompareView:noDifferences')}</div>
        )}
        {visibleDiffs.map((diff) => (
          <div
            key={diff.id}
            role="button"
            tabIndex={0}
            className={classNames('survey-compare__row', `survey-compare__row--${diff.status}`, {
              'survey-compare__row--active': diff.id === selectedItemId,
              'survey-compare__row--layout-only': diff.layoutOnly,
            })}
            style={{ paddingLeft: diff.depth * indentPx }}
            onClick={() => onSelectItem(diff.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSelectItem(diff.id)
            }}
          >
            <SelectionCheckbox canEdit={canEdit} diff={diff} selected={selectedIds.has(diff.id)} onToggle={onToggle} />
            <span className="survey-compare__row-name">{diff.name}</span>
            <span className="survey-compare__row-type">{diff.type}</span>
            <StatusBadge status={diff.status} />
            {diff.layoutOnly && (
              <span className="survey-compare__row-note">{i18n.t('surveyCompareView:layoutOnly')}</span>
            )}
            <ApplicabilityIcon applicability={diff.applicability} />
          </div>
        ))}
      </div>
      <NodeDefDiffDetails diff={diffs.find((diff) => diff.id === selectedItemId) ?? null} diffsById={diffsById} />
    </div>
  )
}
