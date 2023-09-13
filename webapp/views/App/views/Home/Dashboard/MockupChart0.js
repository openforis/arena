import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const MockupChart0 = () => {
  const ref = useRef()

  const usedSpace = 2 // GB
  const availableSpace = 8 // GB
  const totalSpace = availableSpace + usedSpace

  useEffect(() => {
    // Calculate rotation angle based on used storage
    const rotationAngle = (usedSpace / totalSpace) * 180 - 90

    const width = 300
    const height = 300
    const radius = Math.min(width, height) / 2

    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

    const color = d3.scaleOrdinal(['#75b975', '#f9ca77', '#f97878'])

    const data = [1, 1, 1]

    data.forEach((d, i) => {
      const arc = d3
        .arc()
        .innerRadius(100)
        .outerRadius(radius)
        .startAngle(-Math.PI / 2 + i * (Math.PI / data.length))
        .endAngle(-Math.PI / 2 + (i + 1) * (Math.PI / data.length))

      svg
        .append('path')
        .attr('d', arc)
        .attr('fill', color(i))
        .attr('stroke', 'white') // Add stroke to create separation between colors
        .attr('stroke-width', '2') // Adjust stroke width as needed
        .on('mouseover', function () {
          d3.select('#tooltip0').style('visibility', 'visible').html(`Used ${usedSpace} GB out of ${totalSpace} GB`)
        })
        .on('mousemove', function (event) {
          d3.select('#tooltip0')
            .style('top', event.pageY - 10 + 'px')
            .style('left', event.pageX + 10 + 'px')
        })
        .on('mouseout', function () {
          d3.select('#tooltip0').style('visibility', 'hidden')
        })
    })

    const needle = svg
      .append('path')
      .attr('d', 'M0,-10 Q0,-5 5,-5 L0,-120 Q0,-5 -5,-5 Z') // Create a path for the needle
      .style('fill', 'black')
      .attr('transform', `rotate(${rotationAngle})`)
  }, [])

  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h4 style={{ textAlign: 'center' }}>Storage Usage</h4>
      <div id="tooltip0" style={{ visibility: 'hidden' }}></div>
    </div>
  )
}

export default MockupChart0
