import React, { useEffect, useRef, useContext, useState } from 'react'
import * as d3 from 'd3'

import { RecordsSummaryContext } from '../RecordsSummaryContext'
import RecordsSummaryPeriodSelector from '../RecordsSummary/RecordsSummaryPeriodSelector'

const RecordsByUser = () => {
  const ref = useRef()
  const svgRef = useRef()
  const { userCounts } = useContext(RecordsSummaryContext)
  const [totalCount, setTotalCount] = useState(0)
  const padding = { top: 20, right: 20, bottom: 20, left: 20 }

  useEffect(() => {
    const data = userCounts.map((userCount) => parseInt(userCount.count))
    const users = userCounts.map((userCount) => (userCount.owner_name ? userCount.owner_name : userCount.owner_email))
    const newTotalCount = data.reduce((a, b) => a + b, 0)
    setTotalCount(newTotalCount)

    const barHeight = 60
    const svgHeight = users.length * barHeight
    let svg = d3.select(svgRef.current).select('svg')
    if (svg.empty()) {
      svg = d3
        .select(svgRef.current)
        .append('svg')
        .attr('width', 500 + padding.left + padding.right)
        .attr('height', svgHeight + padding.top + padding.bottom)
    } else {
      svg.attr('height', svgHeight + padding.top + padding.bottom)
    }
    svg.selectAll('*').remove()

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data) + 3])
      .range([0 + padding.left, 500 - padding.right])
    const yScale = d3
      .scaleBand()
      .domain(users)
      .range([0 + padding.top, svgHeight - padding.bottom])
      .padding(0.1)

    const xAxis = d3.axisTop(xScale)
    const yAxis = d3.axisLeft(yScale).tickFormat(() => '')

    svg.append('g').attr('transform', `translate(0,${padding.top})`).call(xAxis)
    svg.append('g').attr('transform', `translate(${padding.left},${padding.top})`).call(yAxis)

    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('visibility', 'hidden')
      .style('background', '#fff')
      .style('padding', '5px')
      .style('border', '1px solid #000')

    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', padding.left)
      .attr('y', (d, i) => yScale(users[i]) + padding.top)
      .attr('width', (d) => xScale(d) - padding.left)
      .attr('height', yScale.bandwidth())
      .attr('fill', '#b3cde3')
      .on('mouseover', function () {
        d3.select(this).attr('fill', '#6baed6')

        tooltip.text(d3.select(this).data()[0])
        return tooltip.style('visibility', 'visible')
      })
      .on('mousemove', function (event) {
        return tooltip.style('top', event.pageY - 10 + 'px').style('left', event.pageX + 10 + 'px')
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#b3cde3')

        return tooltip.style('visibility', 'hidden')
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
  }, [userCounts])

  useEffect(() => {
    const handleResize = () => {
      const svg = d3.select(svgRef.current).select('svg')
      const div = d3.select(ref.current)
      const barHeight = 60
      const svgHeight = userCounts.length * barHeight
      svg.attr('height', svgHeight + padding.top + padding.bottom)
      div.style('height', Math.min(svgHeight, 300) + 'px')
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [userCounts])

  return (
    <div ref={ref} className="records-by-user container">
      <RecordsSummaryPeriodSelector />
      <h4 className="center-text">Records added per user (Total of {totalCount})</h4>
      <div ref={svgRef} style={{ height: '300px', overflowY: 'auto' }}></div>
    </div>
  )
}

export default RecordsByUser
