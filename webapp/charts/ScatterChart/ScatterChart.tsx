import type { ReactElement } from 'react'
import { Label, Legend, Scatter, ScatterChart as ReChartsScatterChart, Tooltip, XAxis, YAxis } from 'recharts'

import { Objects } from '@openforis/arena-core'

import { CartesianGrid, ChartWrapper } from '../common'

const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
}
const defaultFill = '#8884d8'

type ScatterChartAxisProps = {
  dataKey?: string
  name?: string
  type?: 'number' | 'category'
}

const defaultXAxisProps: ScatterChartAxisProps = { dataKey: 'x', name: 'x', type: 'number' }
const defaultYAxisProps: ScatterChartAxisProps = { dataKey: 'y', name: 'y', type: 'number' }

type ScatterChartProps = {
  dataSet: { name?: string; data: any[]; fill?: string }[]
  onClick?: (...args: any[]) => any
  renderTooltip?: ReactElement | ((...args: any[]) => any)
  xAxisProps?: ScatterChartAxisProps
  yAxisProps?: ScatterChartAxisProps
}

export const ScatterChart = (props: ScatterChartProps) => {
  const { dataSet, onClick, renderTooltip, xAxisProps, yAxisProps } = props
  const { name: xAxisName, dataKey: xAxisDataKey, type: xAxisType } = { ...defaultXAxisProps, ...xAxisProps }
  const { name: yAxisName, dataKey: yAxisDataKey, type: yAxisType } = { ...defaultYAxisProps, ...yAxisProps }

  if (Objects.isEmpty(dataSet)) return null

  return (
    <ChartWrapper>
      <ReChartsScatterChart margin={margin}>
        <CartesianGrid />
        <XAxis dataKey={xAxisDataKey} name={xAxisName} type={xAxisType}>
          <Label dy={18} value={xAxisName} />
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
    </ChartWrapper>
  )
}
