import React, { useEffect, useRef, useContext, useState } from 'react'
import * as d3 from 'd3'

import { useElementOffset } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'

import { RecordsSummaryContext } from '../RecordsSummaryContext'
import RecordsSummaryPeriodSelector from '../RecordsSummaryPeriodSelector/RecordsSummaryPeriodSelector'
import { ChartUtils } from '../chartUtils'

const padding = { top: 20, right: 20, bottom: 20, left: 20 }
const barHeight = 60
const barColor = '#b3cde3'
const barMouseOverColor = '#6baed6'

const RecordsByUser = () => {
  const i18n = useI18n()
  const wrapperRef = useRef()
  const svgContainerRef = useRef()
  const { width: wrapperWidth } = useElementOffset(wrapperRef)
  const { userCounts } = useContext(RecordsSummaryContext)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const data = userCounts.map((userCount) => parseInt(userCount.count))

    const users = userCounts.map((userCount) => userCount.owner_name ?? userCount.owner_email)

    const newTotalCount = data.reduce((acc, userCount) => acc + userCount, 0)
    setTotalCount(newTotalCount)

    const internalAreaHeight = users.length * barHeight
    const svgWidth = wrapperWidth - padding.left - padding.right
    const svgHeight = internalAreaHeight + padding.top + padding.bottom

    const d3ContainerSelection = d3.select(svgContainerRef.current)
    let svg = d3ContainerSelection.select('svg')
    if (svg.empty()) {
      svg = d3ContainerSelection.append('svg')
    }
    svg.selectAll('*').remove()
    svg.attr('width', svgWidth).attr('height', svgHeight)

    const xTicks = d3.max(data) + 3

    const xScale = d3
      .scaleLinear()
      .domain([0, xTicks])
      .range([0 + padding.left, 500 - padding.right])

    const yScale = d3
      .scaleBand()
      .domain(users)
      .range([0 + padding.top, svgHeight - padding.bottom])
      .padding(0.1)

    const xAxis = d3.axisTop(xScale).ticks(xTicks).tickFormat(d3.format('d'))

    const yAxis = d3.axisLeft(yScale).tickFormat(() => '')

    svg.append('g').attr('transform', `translate(0,${padding.top})`).call(xAxis)
    svg.append('g').attr('transform', `translate(${padding.left},${padding.top})`).call(yAxis)

    const tooltip = ChartUtils.buildTooltip({ d3ContainerSelection, backgroundColor: '#fff' })

    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', padding.left)
      .attr('y', (d, i) => yScale(users[i]) + padding.top)
      .attr('width', (d) => xScale(d) - padding.left)
      .attr('height', yScale.bandwidth())
      .attr('fill', barColor)
      .on('mouseover', function (event) {
        d3.select(this).attr('fill', barMouseOverColor)
        tooltip.text(d3.select(this).data()[0])
        ChartUtils.showTooltip({ tooltip, event })
      })
      .on('mousemove', function (event) {
        ChartUtils.showTooltip({ tooltip, event })
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', barColor)
        ChartUtils.hideTooltip({ tooltip })
      })

    svg.selectAll('.tick').attr('color', 'black')

    svg
      .selectAll('.userLabel')
      .data(users)
      .enter()
      .append('text')
      .attr('class', 'userLabel')
      .text((d) => d)
      .attr('x', padding.left + 5) // Added a space before the name
      .attr('y', (d) => yScale(d) + yScale.bandwidth() / 2 + padding.top)
      .attr('fill', 'black')
  }, [userCounts, wrapperWidth])

  return (
    <>
      <h4 className="dashboard-chart-header">
        {i18n.t('homeView.dashboard.recordsAddedPerUserWithCount', { totalCount })}
      </h4>

      <RecordsSummaryPeriodSelector />

      <div className="chart-wrapper" ref={wrapperRef}>
        <div ref={svgContainerRef}></div>
      </div>
    </>
  )
}

export default RecordsByUser
