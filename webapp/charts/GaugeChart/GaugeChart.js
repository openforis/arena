import './GaugeChart.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { PieChart } from '../PieChart'

const data = [
  { name: 'A', value: 25, color: '#9bdb9b' },
  { name: 'B', value: 25, color: '#e1e182' },
  { name: 'C', value: 25, color: '#f7cd75' },
  { name: 'D', value: 25, color: '#fb7b7b' },
]

const needleColor = '#454545'

const RADIAN = Math.PI / 180

const needle = ({ value, height, width, innerRadius, outerRadius }) => {
  const centerX = width / 2
  const centerY = height / 2

  const total = data.reduce((acc, v) => acc + v.value, 0)
  const ang = 180.0 * (1 - value / total)
  const length = (innerRadius + 2 * outerRadius) / 3
  const sin = Math.sin(-RADIAN * ang)
  const cos = Math.cos(-RADIAN * ang)
  const r = 5
  const x0 = centerX
  const y0 = centerY
  const xba = x0 + r * sin
  const yba = y0 - r * cos
  const xbb = x0 - r * sin
  const ybb = y0 + r * cos
  const xp = x0 + length * cos
  const yp = y0 + length * sin

  return [
    <circle
      key="circle"
      className="gauge-chart-needle-circle"
      cx={x0}
      cy={y0}
      r={r}
      fill={needleColor}
      stroke="none"
    />,
    <path
      key="path"
      className="gauge-chart-needle-path"
      d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
      stroke="#none"
      fill={needleColor}
      style={{ animation: 'fadeInAnimation ease 3s', animationIterationCount: 1, animationFillMode: 'forwards' }}
    />,
  ]
}

export const GaugeChart = (props) => {
  const { value, height, width } = props

  const outerRadius = Math.min(height, width) / 2
  const innerRadius = outerRadius * 0.5

  return (
    <PieChart
      data={data}
      startAngle={180}
      endAngle={0}
      innerRadius={innerRadius}
      label={false}
      outerRadius={outerRadius}
      showLegend={false}
      showTooltip={false}
      width={width}
      height={height}
    >
      {needle({ value, height, width, innerRadius, outerRadius })}
    </PieChart>
  )
}

GaugeChart.propTypes = {
  height: PropTypes.number,
  value: PropTypes.number.isRequired,
  width: PropTypes.number,
}

GaugeChart.defaultProps = {
  height: 300,
  width: 300,
}
