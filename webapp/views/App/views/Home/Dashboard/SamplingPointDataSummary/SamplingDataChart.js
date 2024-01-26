import React, { useEffect, useRef, useContext } from 'react'
import * as d3 from 'd3'

import * as Survey from '@core/survey/survey'

import { countSamplingPointData } from '@webapp/service/api/categories'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { RecordsSummaryContext } from '../RecordsSummaryContext'

const SamplingDataChart = () => {
  const ref = useRef()
  const { dataEntry, dataCleansing } = useContext(RecordsSummaryContext)
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)

  useEffect(() => {
    const fetchData = async () => {
      const countData = countSamplingPointData({ surveyId })
      const response = await countData.request
      const totalRows = response.data.count

      const data1 = [dataEntry, totalRows - dataEntry]
      const data2 = [dataCleansing, totalRows - dataCleansing]
      const width = 300
      const height = 300
      const radius = Math.min(width, height) / 2

      const color = d3.scaleOrdinal(['#b3e2cd', 'transparent'])
      const color2 = d3.scaleOrdinal(['#fdcdac', 'transparent'])

      const svg = d3
        .select(ref.current)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

      const pie = d3.pie()

      // Create first pie
      const data_ready1 = pie(data1)
      const arcGenerator1 = d3.arc().innerRadius(120).outerRadius(radius)
      svg
        .selectAll('path')
        .data(data_ready1)
        .enter()
        .append('path')
        .attr('d', arcGenerator1)
        .attr('fill', (d, i) => color(i))

      d3.select('#tooltip1')
        .style('visibility', 'visible')
        .html(`${i18n.t('homeView.dashboard.step.entry')}: ${dataEntry} / ${totalRows}`)

      // Create second pie
      const data_ready2 = pie(data2)
      const arcGenerator2 = d3.arc().innerRadius(90).outerRadius(120)
      svg
        .selectAll('path2')
        .data(data_ready2)
        .enter()
        .append('path')
        .attr('d', arcGenerator2)
        .attr('fill', (d, i) => color2(i))

      d3.select('#tooltip2')
        .style('visibility', 'visible')
        .html(`${i18n.t('homeView.dashboard.step.cleansing')}: ${dataCleansing} / ${totalRows}`)
    }
    fetchData()
  }, [dataCleansing, dataEntry, i18n, surveyId])

  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h4 style={{ textAlign: 'center' }}>{i18n.t('homeView.dashboard.samplingPointDataCompletion')}</h4>
      <div id="tooltip1" style={{ visibility: 'visible' }}></div>
      <div id="tooltip2" style={{ visibility: 'visible' }}></div>
    </div>
  )
}

export default SamplingDataChart
