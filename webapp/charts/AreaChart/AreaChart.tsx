import { Area, AreaChart as ReChartsAreaChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'

import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { ChartWrapper, RotatedCustomAxisTick } from '../common'

const fillOpacity = '70'

const margin = {
  top: 0,
  right: 20,
  bottom: 60,
  left: 0,
}

type AreaChartProps = {
  allowDecimals?: boolean
  dataColors?: any[]
  data: any[]
  dataKeys: any[]
  labelDataKey?: string
  showLegend?: boolean
}

export const AreaChart = (props: AreaChartProps) => {
  const { allowDecimals = true, dataColors, data, dataKeys, labelDataKey = 'name', showLegend = false } = props

  const randomColors = useRandomColors(dataKeys.length, { onlyDarkColors: true })
  const colors = dataColors ?? randomColors

  return (
    <ChartWrapper>
      <ReChartsAreaChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey={labelDataKey} tick={RotatedCustomAxisTick} />
        <YAxis allowDecimals={allowDecimals} />

        <Tooltip />

        {showLegend && <Legend verticalAlign="top" />}

        {dataKeys.map((dataKey, index) => {
          const color = `${colors[index]}${fillOpacity}`
          return <Area key={dataKey} dataKey={dataKey} fill={color} stackId="1" stroke={color} type="monotone" />
        })}
      </ReChartsAreaChart>
    </ChartWrapper>
  )
}
