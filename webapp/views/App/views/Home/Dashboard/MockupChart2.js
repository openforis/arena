import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const MockupChart2 = () => {
  const ref = useRef()

  useEffect(() => {
    const totalRows = 1000
    const completedRows = 900
    const cleanedRows = 700
    const data1 = [completedRows, totalRows - completedRows]
    const data2 = [cleanedRows, totalRows - cleanedRows]
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
      .on('mouseover', function (d, i) {
        d3.select('#tooltip').style('visibility', 'visible').html(`Data Entry: ${completedRows} / ${totalRows}`)
      })
      .on('mousemove', function (event, d) {
        d3.select('#tooltip')
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px')
      })
      .on('mouseout', function () {
        d3.select('#tooltip').style('visibility', 'hidden')
      })

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
      .on('mouseover', function (d, i) {
        d3.select('#tooltip').style('visibility', 'visible').html(`Data Cleansing: ${cleanedRows} / ${totalRows}`)
      })
      .on('mousemove', function (event, d) {
        d3.select('#tooltip')
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px')
      })
      .on('mouseout', function () {
        d3.select('#tooltip').style('visibility', 'hidden')
      })
  }, [])

  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h4 style={{ textAlign: 'center' }}>Sampling Datapoint Completion</h4>
      <div id="tooltip" style={{ visibility: 'hidden' }}></div>
    </div>
  )
}

export default MockupChart2
