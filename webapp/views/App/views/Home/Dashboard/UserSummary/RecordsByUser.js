import React, { useEffect, useRef, useContext, useState } from 'react'
import * as d3 from 'd3'

import { RecordsSummaryContext } from '../RecordsSummaryContext'

const RecordsByUser = () => {
  const ref = useRef()
  const { userCounts } = useContext(RecordsSummaryContext)

  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const data = userCounts.map((userCount) => parseInt(userCount.count))
    const users = userCounts.map((userCount) => (userCount.owner_name ? userCount.owner_name : userCount.owner_email))
    const newTotalCount = data.reduce((a, b) => a + b, 0)
    setTotalCount(newTotalCount)

    const padding = { top: 20, right: 20, bottom: 20, left: 20 }

    let svg = d3.select(ref.current).select('svg')
    if (svg.empty()) {
      svg = d3
        .select(ref.current)
        .append('svg')
        .attr('width', 500 + padding.left + padding.right)
        .attr('height', 350 + padding.top + padding.bottom)
    }
    svg.selectAll('*').remove()

    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(20, parseInt(d3.max(data)) + parseInt(d3.max(data)) * 0.1)])
      .range([0 + padding.left, 500 - padding.right])
    const yScale = d3
      .scaleBand()
      .domain(users)
      .range([0 + padding.top, 300 - padding.bottom])
      .padding(0.1)

    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale).tickFormat(() => '')

    svg.append('g').attr('transform', `translate(0,300)`).call(xAxis)
    svg.append('g').attr('transform', `translate(${padding.left},${padding.bottom})`).call(yAxis)

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
      .attr('width', (d) => xScale(d))
      .attr('height', yScale.bandwidth())
      .attr('fill', '#b3cde3')
      .on('mouseover', function (d) {
        d3.select(this).attr('fill', '#6baed6')

        tooltip.text(d)
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
      .attr('x', padding.left)
      .attr('y', (d) => yScale(d) + yScale.bandwidth() / 2 + padding.top)
      .attr('fill', 'black')
  }, [userCounts])

  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h4 style={{ textAlign: 'center' }}>Records added per user (Total of {totalCount})</h4>
    </div>
  )
}

export default RecordsByUser
