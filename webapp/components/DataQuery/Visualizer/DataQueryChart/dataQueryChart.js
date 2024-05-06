import React from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'
import { BarChart } from '@webapp/charts/BarChart'
import { DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useSurvey } from '@webapp/store/survey'

export const DataQueryChart = (props) => {
  const { data, dataEmpty, dataLoading } = props

  const query = DataExplorerSelectors.useQuery()
  const survey = useSurvey()

  if (dataEmpty || dataLoading) {
    return null
  }

  const measures = Query.getMeasures(query)
  const firstMeasureUuid = Object.keys(measures)[0]
  const firstMeasureDef = Survey.getNodeDefByUuid(firstMeasureUuid)(survey)
  const firstMeasureName = NodeDef.getName(firstMeasureDef)
  const firstMeasureAggFunctions = Query.getMeasureAggregateFunctions(firstMeasureUuid)(query)
  const firstMeasureFirstAggFunction = firstMeasureAggFunctions[0]
  const dataKey = `${firstMeasureName}_${firstMeasureFirstAggFunction}`
  const firstDimensionUuid = Query.getDimensions(query)[0]
  const firstDimensionDef = Survey.getNodeDefByUuid(firstDimensionUuid)(survey)
  const labelDataKey = NodeDef.getName(firstDimensionDef)

  const chartData = data.map((dataItem) => dataItem)

  return <BarChart data={chartData} dataKey={dataKey} labelDataKey={labelDataKey} />
}
