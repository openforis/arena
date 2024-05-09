import React from 'react'
import PropTypes from 'prop-types'
import {
  ScatterChart as ReChartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts'

const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
}
const fill = '#8884d8'

const defaultXAxisProps = { dataKey: 'x', name: 'x', type: 'number' }
const defaultYAxisProps = { dataKey: 'y', name: 'y', type: 'number' }

export const ScatterChart = (props) => {
  const { data, xAxisProps, yAxisProps } = props
  const { name: xAxisName, dataKey: xAxisDataKey } = { ...defaultXAxisProps, ...xAxisProps }
  const { name: yAxisName, dataKey: yAxisDataKey } = { ...defaultYAxisProps, ...yAxisProps }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReChartsScatterChart margin={margin}>
        <CartesianGrid />
        <XAxis dataKey={xAxisDataKey} name={xAxisName}>
          <Label dy={20} value={xAxisName} />
        </XAxis>
        <YAxis dataKey={yAxisDataKey} name={yAxisName}>
          <Label dx={-20} value={yAxisName} angle={-90} />
        </YAxis>
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} fill={fill} />
      </ReChartsScatterChart>
    </ResponsiveContainer>
  )
}

const AxisProps = PropTypes.shape({
  name: PropTypes.string.isRequired,
  dataKey: PropTypes.string,
  type: PropTypes.string,
})

ScatterChart.propTypes = {
  data: PropTypes.array.isRequired,
  xAxisProps: AxisProps,
  yAxisProps: AxisProps,
}
