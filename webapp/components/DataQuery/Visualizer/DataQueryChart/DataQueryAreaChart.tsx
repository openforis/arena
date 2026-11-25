import type { NodeDefLabelType } from '@core/survey/nodeDef'
import { AreaChart } from '@webapp/charts/AreaChart'

import { useDataQueryChartData } from './useDataQueryChartData'

type DataQueryAreaChartProps = {
  data: any[]
  nodeDefLabelType?: NodeDefLabelType
}

export const DataQueryAreaChart = (props: DataQueryAreaChartProps) => {
  const { data, nodeDefLabelType } = props

  const { chartData, dataColors, dataKeys, labelDataKey } = useDataQueryChartData({ data, nodeDefLabelType })

  return (
    <AreaChart data={chartData} dataColors={dataColors} dataKeys={dataKeys} labelDataKey={labelDataKey} showLegend />
  )
}
