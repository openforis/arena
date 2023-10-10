import './pieChart.scss'

import React, { useMemo, useRef } from 'react'
import PropTypes from 'prop-types'

import * as d3 from 'd3'

const MARGIN_X = 150
const MARGIN_Y = 50
const INFLEXION_PADDING = 20 // space between donut and label inflexion point

export const PieChart = ({ width, height, data }) => {
  const ref = useRef(null)

  const radius = Math.min(width - 2 * MARGIN_X, height - 2 * MARGIN_Y) / 2

  const pie = useMemo(() => {
    const pieGenerator = d3.pie().value((d) => d.value)
    return pieGenerator(data)
  }, [data])

  const arcGenerator = d3.arc()

  const shapes = pie.map((grp, i) => {
    // First arc is for the Pie
    const sliceInfo = {
      innerRadius: 0,
      outerRadius: radius,
      startAngle: grp.startAngle,
      endAngle: grp.endAngle,
    }
    const centroid = arcGenerator.centroid(sliceInfo)
    const slicePath = arcGenerator(sliceInfo)

    // Second arc is for the legend inflexion point
    const inflexionInfo = {
      innerRadius: radius + INFLEXION_PADDING,
      outerRadius: radius + INFLEXION_PADDING,
      startAngle: grp.startAngle,
      endAngle: grp.endAngle,
    }
    const inflexionPoint = arcGenerator.centroid(inflexionInfo)

    const isRightLabel = inflexionPoint[0] > 0
    const labelPosX = inflexionPoint[0] + 50 * (isRightLabel ? 1 : -1)
    const textAnchor = isRightLabel ? 'start' : 'end'
    const label = grp.data.label

    return (
      <g
        key={`slice-${i}`}
        className="slice"
        onMouseEnter={() => {
          if (ref.current) {
            ref.current.classList.add('hasHighlight')
          }
        }}
        onMouseLeave={() => {
          if (ref.current) {
            ref.current.classList.remove('hasHighlight')
          }
        }}
      >
        <path d={slicePath} fill={grp.data.color} />
        <circle cx={centroid[0]} cy={centroid[1]} r={2} />
        <line
          x1={centroid[0]}
          y1={centroid[1]}
          x2={inflexionPoint[0]}
          y2={inflexionPoint[1]}
          stroke={'black'}
          fill={'black'}
        />
        <line
          x1={inflexionPoint[0]}
          y1={inflexionPoint[1]}
          x2={labelPosX}
          y2={inflexionPoint[1]}
          stroke={'black'}
          fill={'black'}
        />
        <text
          x={labelPosX + (isRightLabel ? 2 : -2)}
          y={inflexionPoint[1]}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          fontSize={14}
        >
          {label}
        </text>
      </g>
    )
  })

  return (
    <svg width={width} height={height} style={{ display: 'inline-block' }}>
      <g transform={`translate(${width / 2}, ${height / 2})`} className="pie-chart__container" ref={ref}>
        {shapes}
      </g>
    </svg>
  )
}

PieChart.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number,
      label: PropTypes.string,
      color: PropTypes.string,
    })
  ).isRequired,
}
