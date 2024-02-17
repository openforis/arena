import './SamplingPointDataSummary.scss'

import React, { useEffect, useRef, useContext, useState, useMemo } from 'react'
import * as d3 from 'd3'

import * as Survey from '@core/survey/survey'

import * as RecordStep from '@core/record/recordStep'

import { countSamplingPointData } from '@webapp/service/api/categories'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { RecordsSummaryContext } from '../RecordsSummaryContext'

const width = 300
const height = 300
const innerRadius = 0
const outerRadius = Math.min(width, height) / 2 - 2
const dataEntryColor = '#fdcdac'
const dataCleansingColor = '#fde8aa'
const dataAnalysisColor = '#b3e2cd'
const remainingItemsColor = '#eeeeee'

const SamplingPointDataSummary = () => {
  const chartContainerRef = useRef()
  const { dataEntry, dataCleansing, dataAnalysis } = useContext(RecordsSummaryContext)
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)
  const [totalItems, setTotalItems] = useState(0)

  const data = useMemo(
    () => ({
      [RecordStep.stepNames.entry]: dataEntry,
      [RecordStep.stepNames.cleansing]: dataCleansing,
      [RecordStep.stepNames.analysis]: dataAnalysis,
      remainingItems: totalItems - dataEntry - dataCleansing - dataAnalysis,
    }),
    [dataAnalysis, dataCleansing, dataEntry, totalItems]
  )

  useEffect(() => {
    const fetchTotalItems = async () => {
      const countData = countSamplingPointData({ surveyId })
      const response = await countData.request
      setTotalItems(response.data.count)
    }
    fetchTotalItems()
  }, [surveyId])

  useEffect(() => {
    if (!totalItems) return

    const svg = d3
      .select(chartContainerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)

    const colorScale = d3
      .scaleOrdinal()
      .domain(Object.entries(data))
      .range([dataEntryColor, dataCleansingColor, dataAnalysisColor, remainingItemsColor])

    const pie = d3.pie().value((d) => d[1])
    const dataReady = pie(Object.entries(data))

    svg
      .selectAll('sampling_point_data_pie')
      .data(dataReady)
      .enter()
      .append('path')
      .attr('d', d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
      .attr('fill', (d) => colorScale(d.data[0]))
      .attr('stroke', 'black')
      .style('stroke-width', '1px')
  }, [data, dataAnalysis, dataCleansing, dataEntry, i18n, surveyId, totalItems])

  if (!totalItems) return null

  return (
    <div className="dashboard-sampling-point-data-summary">
      <h4 className="dashboard-chart-header">{i18n.t('homeView.dashboard.samplingPointDataCompletion.title')}</h4>
      <div className="internal-container">
        <div ref={chartContainerRef}></div>
        <div className="legend">
          <div>{i18n.t('homeView.dashboard.samplingPointDataCompletion.totalItems', { totalItems })}</div>
          {Object.values(RecordStep.stepNames).map((stepName) => {
            const recordsInStep = data[stepName]
            const percent = Math.floor((recordsInStep * 100) / totalItems)
            return (
              <div key={stepName}>
                {i18n.t(`homeView.dashboard.step.${stepName}`)}: {recordsInStep} ({percent}%)
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SamplingPointDataSummary
