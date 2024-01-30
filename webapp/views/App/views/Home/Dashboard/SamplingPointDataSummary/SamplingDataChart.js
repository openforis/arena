import React, { useEffect, useRef, useContext } from 'react'
import * as d3 from 'd3'

import * as Survey from '@core/survey/survey'

import { countSamplingPointData } from '@webapp/service/api/categories'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { RecordsSummaryContext } from '../RecordsSummaryContext'

const width = 300
const height = 300
const innerRadius1 = 120
const innerRadius2 = 90
const innerRadius3 = 60
const outerRadius1 = Math.min(width, height) / 2
const outerRadius2 = innerRadius1
const outerRadius3 = innerRadius2
const dataEntryColor = '#fdcdac'
const dataCleansingColor = '#fde8aa'
const dataAnalysisColor = '#b3e2cd'
// const notCompletedColor = '#eeeeee'

const SamplingDataChart = () => {
  const chartContainerRef = useRef()
  const { dataEntry, dataCleansing, dataAnalysis } = useContext(RecordsSummaryContext)
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)

  useEffect(() => {
    const svg = d3
      .select(chartContainerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)

    const fetchData = async () => {
      const countData = countSamplingPointData({ surveyId })
      const response = await countData.request
      const totalItems = response.data.count

      const dataEntryCompletionPerc = Math.floor((dataEntry * 100) / totalItems)
      const dataCleansingCompletionPerc = Math.floor((dataCleansing * 100) / totalItems)
      const dataAnalysisCompletionPerc = Math.floor((dataAnalysis * 100) / totalItems)
      const data1 = [dataEntry, totalItems - dataEntry]
      const data2 = [dataCleansing, totalItems - dataCleansing]
      const data3 = [dataAnalysis, totalItems - dataAnalysis]

      const generatePie = ({ id, innerRadius, outerRadius, data, color, legendId, legendText }) => {
        const colorFn = d3.scaleOrdinal([color, `${color}60`])
        const arcGenerator = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius)
        svg
          .selectAll(id)
          .data(d3.pie()(data))
          .enter()
          .append('path')
          .attr('d', arcGenerator)
          .attr('fill', (_d, i) => colorFn(i))

        d3.select(`#${legendId}`).style('visibility', 'visible').html(legendText)
      }

      // Create data entry records pie
      generatePie({
        id: 'pie1',
        innerRadius: innerRadius1,
        outerRadius: outerRadius1,
        data: data1,
        color: dataEntryColor,
        legendId: 'dataEntryLegend',
        legendText: `${i18n.t(
          'homeView.dashboard.step.entry'
        )}: ${dataEntryCompletionPerc}% (${dataEntry} / ${totalItems})`,
      })

      // Create data cleansing records pie
      generatePie({
        id: 'pie2',
        innerRadius: innerRadius2,
        outerRadius: outerRadius2,
        data: data2,
        color: dataCleansingColor,
        legendId: 'dataCleansingLegend',
        legendText: `${i18n.t(
          'homeView.dashboard.step.cleansing'
        )}: ${dataCleansingCompletionPerc}% (${dataCleansing} / ${totalItems})`,
      })

      // Create data analyisis records pie
      generatePie({
        id: 'pie3',
        innerRadius: innerRadius3,
        outerRadius: outerRadius3,
        data: data3,
        color: dataAnalysisColor,
        legendId: 'dataAnalysisLegend',
        legendText: `${i18n.t(
          'homeView.dashboard.step.analysis'
        )}: ${dataAnalysisCompletionPerc}% (${dataAnalysis} / ${totalItems})`,
      })
    }
    fetchData()
  }, [dataAnalysis, dataCleansing, dataEntry, i18n, surveyId])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h4 style={{ textAlign: 'center' }}>{i18n.t('homeView.dashboard.samplingPointDataCompletion')}</h4>
      <div id="dataEntryLegend" />
      <div id="dataCleansingLegend" />
      <div id="dataAnalysisLegend" />
      <div ref={chartContainerRef}></div>
    </div>
  )
}

export default SamplingDataChart
