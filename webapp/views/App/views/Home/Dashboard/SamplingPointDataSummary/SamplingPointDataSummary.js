import './SamplingPointDataSummary.scss'

import React, { useEffect, useContext, useState, useMemo } from 'react'

import * as Survey from '@core/survey/survey'
import * as RecordStep from '@core/record/recordStep'

import { countSamplingPointData } from '@webapp/service/api/categories'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { PieChart } from '@webapp/charts/PieChart'

import { RecordsSummaryContext } from '../RecordsSummaryContext'

const dataEntryColor = '#f13838'
const dataCleansingColor = '#e99614'
const dataAnalysisColor = '#35af6b'
const remainingItemsColor = '#c1b7b7'

const SamplingPointDataSummary = () => {
  const { dataEntry, dataCleansing, dataAnalysis } = useContext(RecordsSummaryContext)
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)
  const [totalItems, setTotalItems] = useState(0)

  const data = useMemo(
    () => [
      {
        name: i18n.t(`homeView.dashboard.step.${RecordStep.stepNames.entry}`),
        value: dataEntry,
        color: dataEntryColor,
      },
      {
        name: i18n.t(`homeView.dashboard.step.${RecordStep.stepNames.cleansing}`),
        value: dataCleansing,
        color: dataCleansingColor,
      },
      {
        name: i18n.t(`homeView.dashboard.step.${RecordStep.stepNames.analysis}`),
        value: dataAnalysis,
        color: dataAnalysisColor,
      },
      {
        name: i18n.t('homeView.dashboard.samplingPointDataCompletion.remainingItems'),
        value: totalItems - dataEntry - dataCleansing - dataAnalysis,
        color: remainingItemsColor,
      },
    ],
    [dataAnalysis, dataCleansing, dataEntry, i18n, totalItems]
  )

  useEffect(() => {
    const fetchTotalItems = async () => {
      const countData = countSamplingPointData({ surveyId })
      const response = await countData.request
      setTotalItems(response.data.count)
    }
    fetchTotalItems()
  }, [surveyId])

  if (!totalItems) return null

  return (
    <div className="dashboard-sampling-point-data-summary">
      <h4 className="dashboard-chart-header">{i18n.t('homeView.dashboard.samplingPointDataCompletion.title')}</h4>
      <div className="internal-container">
        <PieChart data={data} />
      </div>
    </div>
  )
}

export default SamplingPointDataSummary
