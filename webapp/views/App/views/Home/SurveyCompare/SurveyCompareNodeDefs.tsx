import React, { useMemo } from 'react'
import classNames from 'classnames'

import {
  SurveyCompareMatchType,
  SurveyCompareNodeDefDiff,
  SurveyCompareResult,
  SurveyCompareStatus,
} from '@core/survey/surveyCompare/surveyCompareTypes'

import { Button } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'

import {
  ApplicabilityIcon,
  ApplicabilityMessages,
  DeletionNote,
  SelectionCheckbox,
  StatusBadge,
} from './SurveyCompareCommon'
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

export interface RenameMatchHandlers {
  onMatch: (params: { sourceUuid: string; targetUuid: string }) => void
  onUnmatch: (params: { sourceUuid: string }) => void
}

// an added node def can be matched with a node def only in this survey: it is then applied as a rename
const RenameMatch = ({
  canEdit,
  diff,
  onMatch,
  onUnmatch,
}: { canEdit: boolean; diff: SurveyCompareNodeDefDiff } & RenameMatchHandlers) => {
  const i18n = useI18n()
  if (diff.matchedBy === SurveyCompareMatchType.manual) {
    return (
      <div className="survey-compare__details-info survey-compare__rename">
        <span>{i18n.t('surveyCompareView:matchedBy.manual')}</span>
        {canEdit && (
          <Button
            label="surveyCompareView:unmatch"
            onClick={() => onUnmatch({ sourceUuid: diff.sourceUuid })}
            size="small"
            variant="outlined"
          />
        )}
      </div>
    )
  }
  const { renameCandidate } = diff
  if (!renameCandidate) return null
  return (
    <div className="survey-compare__details-info survey-compare__rename">
      <span>{i18n.t('surveyCompareView:renameCandidate', { name: renameCandidate.name })}</span>
      {canEdit && (
        <Button
          label="surveyCompareView:matchAsRename"
          onClick={() => onMatch({ sourceUuid: diff.sourceUuid, targetUuid: renameCandidate.targetUuid })}
          size="small"
          variant="outlined"
        />
      )}
    </div>
  )
}

const NodeDefDiffDetails = ({
  canEdit,
  diff,
  diffsById,
  onMatch,
  onUnmatch,
}: {
  canEdit: boolean
  diff: SurveyCompareNodeDefDiff | null
  diffsById: Record<string, any>
} & RenameMatchHandlers) => {
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
      {diff.matchedBy && diff.matchedBy !== SurveyCompareMatchType.manual && (
        <div className="survey-compare__details-info">{i18n.t(`surveyCompareView:matchedBy.${diff.matchedBy}`)}</div>
      )}
      <RenameMatch canEdit={canEdit} diff={diff} onMatch={onMatch} onUnmatch={onUnmatch} />
      {diff.status === SurveyCompareStatus.removed && (
        <div className="survey-compare__deletion-info">{i18n.t('surveyCompareView:removedNodeDefInfo')}</div>
      )}
      <ApplicabilityMessages applicability={diff.applicability} />
      {diff.dependsOn.length > 0 && (
        <div className="survey-compare__details-info">
          {i18n.t('surveyCompareView:dependsOn')}{' '}
          {diff.dependsOn
            .map((id: string) => diffsById[id]?.path ?? diffsById[id]?.name ?? diffsById[id]?.key ?? id)
            .join(', ')}
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
  onMatch,
  onUnmatch,
}: {
  result: SurveyCompareResult
  canEdit: boolean
  selectedIds: Set<string>
  onToggle: (id: string, selected: boolean) => void
  onlyDifferences: boolean
  hideLayoutOnly: boolean
  selectedItemId: string | null
  onSelectItem: (id: string) => void
} & RenameMatchHandlers) => {
  const i18n = useI18n()
  const diffs = result.nodeDefs
  const diffsById = useMemo(
    () =>
      Object.fromEntries(
        [...diffs, ...result.categories, ...result.taxonomies, ...result.surveyInfo].map((diff) => [diff.id, diff])
      ),
    [diffs, result.categories, result.taxonomies, result.surveyInfo]
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
            className={classNames('survey-compare__row', `survey-compare__row--${diff.status}`, {
              'survey-compare__row--active': diff.id === selectedItemId,
              'survey-compare__row--layout-only': diff.layoutOnly,
            })}
            style={{ paddingLeft: diff.depth * indentPx }}
          >
            <SelectionCheckbox canEdit={canEdit} diff={diff} selected={selectedIds.has(diff.id)} onToggle={onToggle} />
            <button type="button" className="survey-compare__row-button" onClick={() => onSelectItem(diff.id)}>
              <span className="survey-compare__row-name">{diff.name}</span>
              <span className="survey-compare__row-type">{diff.type}</span>
              <StatusBadge status={diff.status} />
              {diff.layoutOnly && (
                <span className="survey-compare__row-note">{i18n.t('surveyCompareView:layoutOnly')}</span>
              )}
              {diff.renameCandidate && (
                <span className="survey-compare__row-note">{i18n.t('surveyCompareView:possibleRename')}</span>
              )}
              <ApplicabilityIcon applicability={diff.applicability} />
              <DeletionNote diff={diff} selected={selectedIds.has(diff.id)} />
            </button>
          </div>
        ))}
      </div>
      <NodeDefDiffDetails
        canEdit={canEdit}
        diff={diffs.find((diff) => diff.id === selectedItemId) ?? null}
        diffsById={diffsById}
        onMatch={onMatch}
        onUnmatch={onUnmatch}
      />
    </div>
  )
}
