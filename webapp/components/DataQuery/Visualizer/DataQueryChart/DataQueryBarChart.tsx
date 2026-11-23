import { BarChart } from '@webapp/charts/BarChart'
import { useDataQueryChartData } from './useDataQueryChartData'
import type { NodeDefLabelType } from '@core/survey/nodeDef'

type DataQueryBarChartProps = {
  data: any[]
  nodeDefLabelType?: NodeDefLabelType
}

export const DataQueryBarChart = (props: DataQueryBarChartProps) => {
  const { data, nodeDefLabelType } = props

  const { chartData, dataColors, dataKeys, labelDataKey } = useDataQueryChartData({ data, nodeDefLabelType })

  return <BarChart data={chartData} dataColors={dataColors} dataKeys={dataKeys} labelDataKey={labelDataKey} />
}
