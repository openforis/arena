import React from 'react'

import { SurveyComparePropDiff } from '@core/survey/surveyCompare/surveyCompareTypes'

import { useI18n } from '@webapp/store/system'

import { formatValue, getPropLabel } from './surveyCompareValueFormatter'

const PropValue = ({ propKey, value }: { propKey: string; value: unknown }) => {
  const i18n = useI18n()
  const lines = formatValue({ t: i18n.t, key: propKey, value })
  if (lines.length === 0) {
    return <span className="survey-compare__value-empty">{i18n.t('surveyCompareView.emptyValue')}</span>
  }
  return (
    <div className="survey-compare__value">
      {lines.map(({ label, value: lineValue, indent, separator, code }, index) =>
        separator ? (
          <hr key={index} className="survey-compare__value-separator" />
        ) : (
          <div key={index} className="survey-compare__value-line" style={{ paddingLeft: `${indent}rem` }}>
            {label && <span className="survey-compare__value-label">{label}</span>}
            {label && lineValue !== undefined && ': '}
            {lineValue !== undefined && (
              <span className={code ? 'survey-compare__value-code' : undefined}>{lineValue}</span>
            )}
          </div>
        )
      )}
    </div>
  )
}

const PropLabel = ({ propDiff }: { propDiff: SurveyComparePropDiff }) => {
  const i18n = useI18n()
  const { key, cycle } = propDiff
  return (
    <>
      <span className="survey-compare__prop-key">{getPropLabel({ t: i18n.t, key })}</span>
      {cycle !== undefined && (
        <span className="survey-compare__prop-group">
          {i18n.t('surveyCompareView.cycle', { cycle: Number(cycle) + 1 })}
        </span>
      )}
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
              <PropValue propKey={propDiff.key} value={propDiff.source} />
            </td>
            <td className="survey-compare__target">
              <PropValue propKey={propDiff.key} value={propDiff.target} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
