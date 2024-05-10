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
  Legend,
} from 'recharts'
import { Objects } from '@openforis/arena-core'

const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
}
const defaultFill = '#8884d8'

const defaultXAxisProps = { dataKey: 'x', name: 'x', type: 'number' }
const defaultYAxisProps = { dataKey: 'y', name: 'y', type: 'number' }

export const ScatterChart = (props) => {
  const { dataSet, onClick, renderTooltip, xAxisProps, yAxisProps } = props
  const { name: xAxisName, dataKey: xAxisDataKey, type: xAxisType } = { ...defaultXAxisProps, ...xAxisProps }
  const { name: yAxisName, dataKey: yAxisDataKey, type: yAxisType } = { ...defaultYAxisProps, ...yAxisProps }

  if (Objects.isEmpty(dataSet)) return null

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReChartsScatterChart margin={margin}>
        <CartesianGrid />
        <XAxis dataKey={xAxisDataKey} name={xAxisName} type={xAxisType}>
          <Label dy={14} value={xAxisName} />
        </XAxis>
        <YAxis dataKey={yAxisDataKey} name={yAxisName} type={yAxisType}>
          <Label dx={-20} value={yAxisName} angle={-90} />
        </YAxis>
        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={renderTooltip} />
        {dataSet.length > 1 && <Legend />}
        {dataSet.map(({ name, data, fill = defaultFill }) => (
          <Scatter key={name} name={name} data={data} fill={fill} onClick={onClick} />
        ))}
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
  dataSet: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      data: PropTypes.array.isRequired,
    })
  ).isRequired,
  onClick: PropTypes.func,
  renderTooltip: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  xAxisProps: AxisProps,
  yAxisProps: AxisProps,
}
