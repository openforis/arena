import React from 'react'

import { SurveyComparePropDiff, SurveyComparePropGroup } from '@core/survey/surveyCompare/surveyCompareTypes'

import { useI18n } from '@webapp/store/system'

const isEmpty = (value: unknown): boolean => value === undefined || value === null

const PropValue = ({ value }: { value: unknown }) => {
  const i18n = useI18n()
  if (isEmpty(value)) {
    return <span className="survey-compare__value-empty">{i18n.t('surveyCompareView.emptyValue')}</span>
  }
  if (typeof value === 'object') {
    return <pre className="survey-compare__value">{JSON.stringify(value, null, 2)}</pre>
  }
  return <span className="survey-compare__value">{String(value)}</span>
}

const PropLabel = ({ propDiff }: { propDiff: SurveyComparePropDiff }) => {
  const i18n = useI18n()
  const { key, group, cycle } = propDiff
  const groupLabel = group === SurveyComparePropGroup.props ? null : i18n.t(`surveyCompareView.propGroups.${group}`)
  const cycleLabel = cycle === undefined ? null : i18n.t('surveyCompareView.cycle', { cycle: Number(cycle) + 1 })
  return (
    <>
      <span className="survey-compare__prop-key">{key}</span>
      {[groupLabel, cycleLabel].filter(Boolean).map((label) => (
        <span key={label} className="survey-compare__prop-group">
          {label}
        </span>
      ))}
    </>
  )
}

export const SurveyComparePropDiffs = ({ propDiffs }: { propDiffs: SurveyComparePropDiff[] }) => {
  const i18n = useI18n()
  if (propDiffs.length === 0) return null
  return (
    <table className="survey-compare__prop-diffs">
      <thead>
        <tr>
          <th>{i18n.t('surveyCompareView.property')}</th>
          <th>{i18n.t('surveyCompareView.sourceValue')}</th>
          <th>{i18n.t('surveyCompareView.targetValue')}</th>
        </tr>
      </thead>
      <tbody>
        {propDiffs.map((propDiff) => (
          <tr key={`${propDiff.group}-${propDiff.key}-${propDiff.cycle ?? ''}`}>
            <td>
              <PropLabel propDiff={propDiff} />
            </td>
            <td className="survey-compare__source">
              <PropValue value={propDiff.source} />
            </td>
            <td className="survey-compare__target">
              <PropValue value={propDiff.target} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
