import React from 'react'
import {
  LineChart as ReChartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const lineStroke = '#8884d8'
const lineFill = '#8884d8'

export const LineChart = (props) => {
  const { data, dataKey, labelDataKey } = props

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReChartsLineChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelDataKey} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={lineStroke} fill={lineFill} />
      </ReChartsLineChart>
    </ResponsiveContainer>
  )
}
