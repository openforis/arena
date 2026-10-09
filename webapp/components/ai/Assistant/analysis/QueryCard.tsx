import './QueryCard.scss'

import React, { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import type { AnalysisQueryEntry } from '@webapp/ai/tools/analysis/queryStore'
import { Button } from '@webapp/components/buttons'
import { DataExplorerActions, DataExplorerState } from '@webapp/store/dataExplorer'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { buildQueryCardModel } from './queryCardModel'

type Props = { entry: AnalysisQueryEntry | null }

type RowProps = { label: string; values: string[] }

/**
 * One labelled line of the card; nothing when there is no value.
 * @param {RowProps} props - Props.
 * @returns {React.ReactElement|null} The line.
 */
const QueryCardRow = ({ label, values }: RowProps) => {
  if (values.length === 0) return null
  return (
    <div className="ai-query-card__row">
      <span className="ai-query-card__label">{label}</span>
      <span className="ai-query-card__value">{values.join(', ')}</span>
    </div>
  )
}

/**
 * Card of a query proposed by the assistant, with the buttons that show it in the Explorer.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The card.
 */
export const QueryCard = ({ entry }: Props) => {
  const dispatch = useDispatch<any>()
  const navigate = useNavigate()
  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const model = useMemo(() => (entry ? buildQueryCardModel({ entry, survey, lang }) : null), [entry, survey, lang])

  const show = useCallback(
    (displayType: string, chartType: string | null = null) =>
      dispatch(DataExplorerActions.showQuery({ query: entry.query, displayType, chartType, navigate })),
    [dispatch, entry, navigate]
  )

  if (!model) {
    return <div className="ai-query-card ai-query-card--missing">{i18n.t('aiAnalysis.queryCard.missing')}</div>
  }
  const { queryId } = model
  const measures = model.measures.map(
    ({ attribute, functions }) => `${attribute} (${functions.map((fn) => i18n.t(`common.${fn}`)).join(', ')})`
  )
  const sort = model.sort.map(
    ({ attribute, order }) => `${attribute} (${i18n.t(order === 'desc' ? 'common.descending' : 'common.ascending')})`
  )

  return (
    <div className="ai-query-card" data-testid={TestId.aiQueryCard.root(queryId)}>
      <div className="ai-query-card__title">{i18n.t('aiAnalysis.queryCard.title', { queryId })}</div>
      <p className="ai-query-card__explanation">{model.explanation}</p>
      <QueryCardRow label={i18n.t('common.entity')} values={[model.entity]} />
      <QueryCardRow label={i18n.t('aiAnalysis.queryCard.columns')} values={model.columns} />
      <QueryCardRow label={i18n.t('common.dimension_other')} values={model.dimensions} />
      <QueryCardRow label={i18n.t('common.measure_other')} values={measures} />
      <QueryCardRow label={i18n.t('aiAnalysis.queryCard.filter')} values={model.filter ? [model.filter] : []} />
      <QueryCardRow label={i18n.t('common.sort')} values={sort} />
      <div className="ai-query-card__buttons">
        <Button
          className="btn-s"
          iconClassName="icon-table2 icon-12px"
          label="aiAnalysis.queryCard.openInExplorer"
          onClick={() => show(DataExplorerState.displayTypes.table)}
          testId={TestId.aiQueryCard.openInExplorer(queryId)}
          variant="outlined"
        />
        {model.chartType && (
          <Button
            className="btn-s"
            iconClassName="icon-stats-bars icon-12px"
            label="aiAnalysis.queryCard.showAsChart"
            onClick={() => show(DataExplorerState.displayTypes.chart, model.chartType)}
            testId={TestId.aiQueryCard.showAsChart(queryId)}
            variant="outlined"
          />
        )}
      </div>
    </div>
  )
}
