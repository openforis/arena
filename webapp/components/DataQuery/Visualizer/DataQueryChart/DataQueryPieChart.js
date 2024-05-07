import React from 'react'
import PropTypes from 'prop-types'

import { PieChart } from '@webapp/charts/PieChart'
import { useDataQueryChartData } from './useDataQueryChartData'
import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { Objects } from '@openforis/arena-core'

export const DataQueryPieChart = (props) => {
  const { data, nodeDefLabelType } = props

  const { dataColumnByDimensionNodeDefUuid, dataColumnsByMeasureNodeDefUuid } = useDataQueryChartData({
    data,
    nodeDefLabelType,
  })

  const colors = useRandomColors(data.length, { onlyDarkColors: true })

  const firstDimensionNodeDefUuid = Object.keys(dataColumnByDimensionNodeDefUuid)[0]
  const firstDimensionDataColumn = dataColumnByDimensionNodeDefUuid[firstDimensionNodeDefUuid]

  const firstMeasureNodeDefUuid = Object.keys(dataColumnsByMeasureNodeDefUuid)[0]
  const firstMeasureDataColumn = dataColumnsByMeasureNodeDefUuid[firstMeasureNodeDefUuid][0]

  const chartData = data.reduce((acc, dataItem, index) => {
    const name = dataItem[firstDimensionDataColumn]
    if (!Objects.isEmpty(name)) {
      acc.push({
        name,
        value: Number(dataItem[firstMeasureDataColumn]),
        color: colors[index],
      })
    }
    return acc
  }, [])

  return <PieChart data={chartData} />
}

DataQueryPieChart.propTypes = {
  data: PropTypes.array.isRequired,
  nodeDefLabelType: PropTypes.string,
}
