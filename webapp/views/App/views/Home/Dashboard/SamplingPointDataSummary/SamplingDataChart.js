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
const outerRadius1 = Math.min(width, height) / 2
const outerRadius2 = innerRadius1
const dataEntryColor = '#b3e2cd'
const dataCleansingColor = '#fdcdac'
const notCompletedColor = '#eeeeee'

const SamplingDataChart = () => {
  const chartContainerRef = useRef()
  const { dataEntry, dataCleansing } = useContext(RecordsSummaryContext)
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)

  const svg = d3
    .select(chartContainerRef.current)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  useEffect(() => {
    const fetchData = async () => {
      const countData = countSamplingPointData({ surveyId })
      const response = await countData.request
      const totalItems = response.data.count

      const totalDataEntryItems = dataEntry + dataCleansing
      const data1 = [totalDataEntryItems, totalItems - totalDataEntryItems]
      const data2 = [dataCleansing, totalItems - dataCleansing]
      const dataEntryCompletionPerc = Math.floor((totalDataEntryItems * 100) / totalItems)
      const dataCleansingCompletionPerc = Math.floor((dataCleansing * 100) / totalItems)

      const generatePie = ({ id, innerRadius, outerRadius, data, color, legendId, legendText }) => {
        const colorFn = d3.scaleOrdinal([color, notCompletedColor])
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

      // Create first pie
      generatePie({
        id: 'pie1',
        innerRadius: innerRadius1,
        outerRadius: outerRadius1,
        data: data1,
        color: dataEntryColor,
        legendId: 'dataEntryLegend',
        legendText: `${i18n.t(
          'homeView.dashboard.step.entry'
        )}: ${dataEntryCompletionPerc}% (${totalDataEntryItems} / ${totalItems})`,
      })

      // Create second pie
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
    }
    fetchData()
  }, [dataCleansing, dataEntry, i18n, surveyId, svg])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h4 style={{ textAlign: 'center' }}>{i18n.t('homeView.dashboard.samplingPointDataCompletion')}</h4>
      <div id="dataEntryLegend" />
      <div id="dataCleansingLegend" />
      <div ref={chartContainerRef}></div>
    </div>
  )
}

export default SamplingDataChart
