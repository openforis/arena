import type { NodeDefLabelType } from '@core/survey/nodeDef'
import { LineChart } from '@webapp/charts/LineChart'

import { useDataQueryChartData } from './useDataQueryChartData'

type DataQueryLineChartProps = {
  data: any[]
  nodeDefLabelType?: NodeDefLabelType
}

export const DataQueryLineChart = (props: DataQueryLineChartProps) => {
  const { data, nodeDefLabelType } = props

  const { chartData, dataColors, dataKeys, labelDataKey } = useDataQueryChartData({ data, nodeDefLabelType })

  return (
    <LineChart data={chartData} dataColors={dataColors} dataKeys={dataKeys} labelDataKey={labelDataKey} showLegend />
  )
}
