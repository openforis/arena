import React from 'react'
import classNames from 'classnames'

import {
  SurveyCompareApplicability,
  SurveyCompareApplicabilityStatus,
  SurveyCompareStatus,
} from '@core/survey/surveyCompare/surveyCompareTypes'

import { Checkbox } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import { isSelectable } from './surveyCompareSelection'

export const StatusBadge = ({ status }: { status: string }) => {
  const i18n = useI18n()
  if (status === SurveyCompareStatus.identical) return null
  return (
    <span className={classNames('survey-compare__badge', `survey-compare__badge--${status}`)}>
      {i18n.t(`surveyCompareView.status.${status}`)}
    </span>
  )
}

export const ApplicabilityMessages = ({ applicability }: { applicability?: SurveyCompareApplicability }) => {
  const i18n = useI18n()
  if (!applicability || applicability.reasons.length === 0) return null
  const notApplicable = applicability.status === SurveyCompareApplicabilityStatus.notApplicable
  return (
    <ul
      className={classNames('survey-compare__reasons', {
        'survey-compare__reasons--error': notApplicable,
        'survey-compare__reasons--warning': !notApplicable,
      })}
    >
      {applicability.reasons.map((reason) => (
        <li key={reason}>{i18n.t(`surveyCompareView.reasons.${reason}`)}</li>
      ))}
    </ul>
  )
}

export const ApplicabilityIcon = ({ applicability }: { applicability?: SurveyCompareApplicability }) => {
  const i18n = useI18n()
  if (!applicability || applicability.status === SurveyCompareApplicabilityStatus.applicable) return null
  const notApplicable = applicability.status === SurveyCompareApplicabilityStatus.notApplicable
  const title = applicability.reasons.map((reason) => i18n.t(`surveyCompareView.reasons.${reason}`)).join('\n')
  return (
    <span className={classNames('icon icon-12px', notApplicable ? 'icon-blocked' : 'icon-warning')} title={title} />
  )
}

export const SelectionCheckbox = ({
  canEdit,
  diff,
  selected,
  onToggle,
}: {
  canEdit: boolean
  diff: any
  selected: boolean
  onToggle: (id: string, selected: boolean) => void
}) => {
  if (!canEdit || !isSelectable(diff)) {
    return <span className="survey-compare__checkbox-placeholder" />
  }
  return <Checkbox checked={selected} onChange={(value: boolean) => onToggle(diff.id, value)} size="small" />
}
