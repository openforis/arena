import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const MockupChart1 = () => {
  const ref = useRef()

  useEffect(() => {
    const data = [150, 132, 110, 93, 88]
    const users = ['User1', 'User2', 'User3', 'User4', 'User5']

    const svg = d3.select(ref.current).append('svg').attr('width', 500).attr('height', 350)

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data) + 20])
      .range([0, 500])
    const yScale = d3.scaleBand().domain(users).range([0, 300]).padding(0.1)

    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    svg.append('g').attr('transform', 'translate(0,300)').call(xAxis)
    svg.append('g').call(yAxis)

    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d, i) => yScale(users[i]))
      .attr('width', (d) => xScale(d))
      .attr('height', yScale.bandwidth())
      .attr('fill', '#b3cde3') // Changed the color of the bars to "#b3cde3"

    svg
      .selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .text((d) => d)
      .attr('x', (d) => xScale(d) + 10)
      .attr('y', (d, i) => yScale(users[i]) + yScale.bandwidth() / 2 + 10)
      .attr('fill', 'black')

    svg.selectAll('.tick').attr('color', 'black')

    svg
      .selectAll('.userLabel')
      .data(users)
      .enter()
      .append('text')
      .attr('class', 'userLabel')
      .text((d) => d)
      .attr('x', 0)
      .attr('y', (d, i) => yScale(d) + yScale.bandwidth() / 2)
      .attr('fill', 'black')
  }, [])

  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h4 style={{ textAlign: 'center' }}>Records added per user</h4>
    </div>
  )
}

export default MockupChart1
