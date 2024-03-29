import React from 'react'
import { PieChart as ReChartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import PropTypes from 'prop-types'

const fill = '#8884d8'

export const PieChart = (props) => {
  const { data, colorKey } = props

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReChartsPieChart>
        <Pie data={data} dataKey="value" fill={fill} label>
          {data.map((item) => (
            <Cell key={item.name} fill={item[colorKey]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </ReChartsPieChart>
    </ResponsiveContainer>
  )
}

PieChart.propTypes = {
  data: PropTypes.array.isRequired,
  colorKey: PropTypes.string,
}

PieChart.defaultProps = {
  colorKey: 'color',
}
