import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { timeDay } from 'd3-time'
import { timeFormat } from 'd3-time-format'

const MockupChart3 = () => {
  const ref = useRef()

  useEffect(() => {
    const data = [
      { user: 'User 1', records: Array.from({ length: 56 }, () => Math.floor(Math.random() * 100)) },
      { user: 'User 2', records: Array.from({ length: 56 }, () => Math.floor(Math.random() * 100)) },
      { user: 'User 3', records: Array.from({ length: 56 }, () => Math.floor(Math.random() * 100)) },
      { user: 'User 4', records: Array.from({ length: 56 }, () => Math.floor(Math.random() * 100)) },
    ] // Mock data

    const margin = { top: 20, right: 80, bottom: 70, left: 50 } // Adjusted margins
    const width = window.innerWidth * 0.8 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const x = d3.scaleTime().range([0, width])
    const y = d3.scaleLinear().range([height, 0])

    const color = d3.scaleOrdinal(d3.schemeCategory10)

    const area = d3
      .area()
      .x((d, i) => x(timeDay.offset(new Date(), -i)))
      .y0(height)
      .y1((d) => y(d))

    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    color.domain(data.map((d) => d.user))

    x.domain([timeDay.offset(new Date(), -56), new Date()])
    y.domain([0, d3.max(data, (d) => d3.max(d.records))])

    const user = svg.selectAll('.user').data(data).enter().append('g').attr('class', 'user')

    user
      .append('path')
      .attr('class', 'area')
      .attr('d', (d) => area(d.records))
      .style('fill', (d) => color(d.user))
      .style('opacity', 0.2)
      .style('stroke', (d) => color(d.user))
      .style('stroke-opacity', 0.8) // Adjusted stroke opacity

    // Add line to chart
    const line = d3
      .line()
      .x((d, i) => x(timeDay.offset(new Date(), -i)))
      .y((d) => y(d))

    user
      .append('path')
      .attr('class', 'line')
      .attr('d', (d) => line(d.records))
      .style('stroke', (d) => color(d.user))
      .style('stroke-width', 0.75)
      .style('fill', 'none')

    const legend = svg.selectAll('.legend').data(data).enter().append('g').attr('class', 'legend')

    legend
      .append('rect')
      .attr('x', width + 10) // Adjusted x position
      .attr('y', (d, i) => i * 20)
      .attr('width', 12)
      .attr('height', 12)
      .style('fill', (d) => color(d.user))

    legend
      .append('text')
      .attr('x', width + 81)
      .attr('y', (d, i) => i * 20 + 9)
      .attr('dy', '.15em')
      .style('text-anchor', 'end')
      .text((d) => d.user)

    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(timeFormat('%Y-%m-%d')))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')

    svg
      .append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'start')
      .text('Records added')

    svg
      .append('text')
      .attr('transform', 'translate(' + width / 2 + ' ,' + (height + margin.bottom) + ')')
      .style('text-anchor', 'middle')
      .text('Date')
  }, [])

  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h4 style={{ textAlign: 'center' }}>Daily records added by user</h4>
    </div>
  )
}

export default MockupChart3
