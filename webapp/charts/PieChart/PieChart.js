import React from 'react'
import { PieChart as ReChartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import PropTypes from 'prop-types'

import { ChartWrapper } from '../common'

const fill = '#8884d8'

export const PieChart = (props) => {
  const {
    data,
    colorKey = 'color',
    children,
    dataKey = 'value',
    endAngle = -270,
    height = '100%',
    innerRadius,
    label = true,
    outerRadius,
    startAngle = 90,
    showLabelLine = true,
    showLegend = true,
    showTooltip = true,
    width = '100%',
  } = props

  return (
    <ChartWrapper width={width} height={height}>
      <ReChartsPieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          endAngle={endAngle}
          fill={fill}
          innerRadius={innerRadius}
          label={label}
          outerRadius={outerRadius}
          labelLine={showLabelLine}
          startAngle={startAngle}
        >
          {data.map((item) => (
            <Cell key={item.name} fill={item[colorKey]} />
          ))}
        </Pie>
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        {children}
      </ReChartsPieChart>
    </ChartWrapper>
  )
}

PieChart.propTypes = {
  children: PropTypes.node,
  colorKey: PropTypes.string,
  data: PropTypes.array.isRequired,
  dataKey: PropTypes.string,
  endAngle: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  innerRadius: PropTypes.number,
  label: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  outerRadius: PropTypes.number,
  showLabelLine: PropTypes.bool,
  showLegend: PropTypes.bool,
  showTooltip: PropTypes.bool,
  startAngle: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}
