import './SamplingPointDataSummary.scss'

import React, { useEffect, useContext, useState, useMemo } from 'react'

import * as Survey from '@core/survey/survey'
import * as RecordStep from '@core/record/recordStep'

import { countSamplingPointData } from '@webapp/service/api/categories'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { PieChart } from '@webapp/charts/PieChart'

import { RecordsSummaryContext } from '../RecordsSummaryContext'

const colorByStep = {
  [RecordStep.stepNames.entry]: '#f13838',
  [RecordStep.stepNames.cleansing]: '#e99614',
  [RecordStep.stepNames.analysis]: '#35af6b',
}
const remainingItemsColor = '#c1b7b7'

const SamplingPointDataSummary = () => {
  const { dataEntry, dataCleansing, dataAnalysis } = useContext(RecordsSummaryContext)
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)
  const [totalItems, setTotalItems] = useState(0)

  const data = useMemo(() => {
    const valueByStep = {
      [RecordStep.stepNames.entry]: dataEntry,
      [RecordStep.stepNames.cleansing]: dataCleansing,
      [RecordStep.stepNames.analysis]: dataAnalysis,
    }
    const dataItems = []
    Object.values(RecordStep.stepNames).forEach((step) => {
      const value = valueByStep[step]
      if (value > 0) {
        dataItems.push({
          name: i18n.t(`homeView.dashboard.step.${step}`),
          value,
          color: colorByStep[step],
        })
      }
    })
    dataItems.push({
      name: i18n.t('homeView.dashboard.samplingPointDataCompletion.remainingItems'),
      value: totalItems - dataEntry - dataCleansing - dataAnalysis,
      color: remainingItemsColor,
    })
    return dataItems
  }, [dataAnalysis, dataCleansing, dataEntry, i18n, totalItems])

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
