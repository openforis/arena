import React from 'react'
import { PieChart as ReChartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import PropTypes from 'prop-types'

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
    showLegend,
    showTooltip,
    width,
  } = props

  return (
    <ResponsiveContainer width={width} height={height}>
      <ReChartsPieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          endAngle={endAngle}
          fill={fill}
          innerRadius={innerRadius}
          label={label}
          outerRadius={outerRadius}
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
    </ResponsiveContainer>
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
  label: PropTypes.bool,
  outerRadius: PropTypes.number,
  startAngle: PropTypes.number,
  showLegend: PropTypes.bool,
  showTooltip: PropTypes.bool,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

PieChart.defaultProps = {
  colorKey: 'color',
  dataKey: 'value',
  label: true,
  showLegend: true,
  showTooltip: true,
  width: '100%',
  height: '100%',
}
