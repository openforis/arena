import React from 'react'
import { PieChart as ReChartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import PropTypes from 'prop-types'

import { ChartWrapper } from '../common'

const fill = '#8884d8'

export const PieChart = (props) => {
  const {
    data,
    dataKey,
    colorKey,
    children,
    endAngle,
    height,
    innerRadius,
    label,
    outerRadius,
    startAngle,
    showLabelLine,
    showLegend,
    showTooltip,
    width,
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

PieChart.defaultProps = {
  colorKey: 'color',
  dataKey: 'value',
  endAngle: -270,
  label: true,
  showLabelLine: true,
  showLegend: true,
  showTooltip: true,
  startAngle: 90,
  width: '100%',
  height: '100%',
}
