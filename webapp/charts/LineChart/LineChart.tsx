import { Legend, Line, LineChart as ReChartsLineChart, Tooltip, XAxis, YAxis } from 'recharts'

import { CartesianGrid, ChartWrapper, RotatedCustomAxisTick } from '../common'

const margin = {
  top: 0,
  right: 20,
  bottom: 60,
  left: 0,
}

const defaultLineFill = '#8884d8'

type LineChartProps = {
  allowDecimals?: boolean
  data: any[]
  dataColors?: any[]
  dataKeys: any[]
  labelDataKey: string
  showLegend?: boolean
}

export const LineChart = (props: LineChartProps) => {
  const { allowDecimals = true, data, dataColors, dataKeys, labelDataKey, showLegend = false } = props

  return (
    <ChartWrapper>
      <ReChartsLineChart data={data} margin={margin}>
        <CartesianGrid />
        <XAxis dataKey={labelDataKey} tick={RotatedCustomAxisTick} />
        <YAxis allowDecimals={allowDecimals} />
        {showLegend && <Legend verticalAlign="top" />}
        <Tooltip />
        {dataKeys.map((dataKey, index) => {
          const color = dataColors?.[index] ?? defaultLineFill
          return <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={color} fill={color} />
        })}
      </ReChartsLineChart>
    </ChartWrapper>
  )
}
