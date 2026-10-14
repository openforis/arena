import React from 'react'
import classNames from 'classnames'

import { SurveyCompareChange, SurveyComparePropDiff } from '@core/survey/surveyCompare/surveyCompareTypes'

import { useI18n } from '@webapp/store/system'

import {
  ApplicabilityIcon,
  ApplicabilityMessages,
  DeletionNote,
  SelectionCheckbox,
  StatusBadge,
} from './SurveyCompareCommon'
import { SurveyComparePropDiffs } from './SurveyComparePropDiffs'

type ChangeWithProps = SurveyCompareChange & { propDiffs: SurveyComparePropDiff[] }

/**
 * Flat list of changes (survey info props, survey files), each one with its differences.
 * @returns {React.ReactElement} - The component.
 */
export const SurveyCompareChangesList = <T extends ChangeWithProps>({
  diffs,
  getLabel,
  getNote = undefined,
  canEdit,
  selectedIds,
  onToggle,
}: {
  diffs: T[]
  getLabel: (diff: T) => string
  getNote?: (diff: T) => string
  canEdit: boolean
  selectedIds: Set<string>
  onToggle: (id: string, selected: boolean) => void
}) => {
  const i18n = useI18n()
  if (diffs.length === 0) {
    return <div className="survey-compare__details-empty">{i18n.t('surveyCompareView:noDifferences')}</div>
  }
  return (
    <div className="survey-compare__simple-list">
      {diffs.map((diff) => (
        <div key={diff.id} className="survey-compare__simple-item">
          <div className={classNames('survey-compare__row', `survey-compare__row--${diff.status}`)}>
            <SelectionCheckbox canEdit={canEdit} diff={diff} selected={selectedIds.has(diff.id)} onToggle={onToggle} />
            <span className="survey-compare__row-name">{getLabel(diff)}</span>
            {getNote && <span className="survey-compare__row-type">{getNote(diff)}</span>}
            <StatusBadge status={diff.status} />
            <ApplicabilityIcon applicability={diff.applicability} />
            <DeletionNote diff={diff} selected={selectedIds.has(diff.id)} />
          </div>
          <ApplicabilityMessages applicability={diff.applicability} />
          <SurveyComparePropDiffs propDiffs={diff.propDiffs} />
        </div>
      ))}
    </div>
  )
}
