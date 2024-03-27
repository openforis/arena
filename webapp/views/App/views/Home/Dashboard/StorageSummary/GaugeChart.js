import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'

import { FileUtils } from '@webapp/utils/fileUtils'

const GaugeChart = ({ data }) => {
  const ref = useRef()

  const { value: usedSpace, label: usedLabel } = data.find((d) => d.name === 'usedSpace')
  const totalSpace = data.find((d) => d.name === 'totalSpace').value
  const totalLabel = FileUtils.toHumanReadableFileSize(totalSpace)

  useEffect(() => {
    const rotationAngle = (usedSpace / totalSpace) * 180 - 90

    const width = 300
    const height = 300
    const radius = Math.min(width, height) / 2

    let svg = d3.select(ref.current).select('svg')
    if (svg.empty()) {
      svg = d3.select(ref.current).append('svg').attr('width', width).attr('height', height)
    }
    // Clear the SVG
    svg.selectAll('*').remove()

    svg = svg.append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

    const color = d3.scaleOrdinal(['#75b975', '#f9ca77', '#f97878'])

    const data = [1, 1, 1]

    data.forEach((d, i) => {
      const arc = d3
        .arc()
        .innerRadius(100)
        .outerRadius(radius)
        .startAngle(-Math.PI / 2 + i * (Math.PI / data.length))
        .endAngle(-Math.PI / 2 + (i + 1) * (Math.PI / data.length))

      svg.append('path').attr('d', arc).attr('fill', color(i)).attr('stroke', 'white').attr('stroke-width', '2')
    })

    svg
      .append('path')
      .attr('d', 'M0,-10 Q0,-5 5,-5 L0,-120 Q0,-5 -5,-5 Z')
      .style('fill', 'black')
      .attr('transform', `rotate(${rotationAngle})`)
  }, [])

  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h4 style={{ textAlign: 'center' }}>Storage usage (Files)</h4>
      <div id="tooltip0" style={{ visibility: 'visible' }}>{`${usedLabel} out of ${totalLabel}`}</div>
    </div>
  )
}

GaugeChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
      label: PropTypes.string,
    })
  ).isRequired,
}

export default GaugeChart
