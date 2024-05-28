import React from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import * as NumberUtils from '@core/numberUtils'

import { PieChart } from '@webapp/charts/PieChart'
import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { useI18n } from '@webapp/store/system'

import { useDataQueryChartData } from './useDataQueryChartData'

const maxItems = 20

export const DataQueryPieChart = (props) => {
  const { data, nodeDefLabelType } = props

  const i18n = useI18n()

  const { dataColumnByDimensionNodeDefUuid, dataColumnsByMeasureNodeDefUuid, maxDecimalDigitsByMeasureNodeDefUuid } =
    useDataQueryChartData({
      data,
      nodeDefLabelType,
    })

  const colors = useRandomColors(data.length, { onlyDarkColors: true })

  const firstDimensionNodeDefUuid = Object.keys(dataColumnByDimensionNodeDefUuid)[0]
  const firstMeasureNodeDefUuid = Object.keys(dataColumnsByMeasureNodeDefUuid)[0]
  const maxDecimalDigits = maxDecimalDigitsByMeasureNodeDefUuid[firstMeasureNodeDefUuid]

  if (data.length > maxItems) {
    return i18n.t('dataView.charts.warning.tooManyItemsToShowChart', { maxItems })
  }

  const firstDimensionDataColumn = dataColumnByDimensionNodeDefUuid[firstDimensionNodeDefUuid]
  const firstMeasureDataColumn = dataColumnsByMeasureNodeDefUuid[firstMeasureNodeDefUuid][0]

  const chartData = data.reduce((acc, dataItem, index) => {
    const name = dataItem[firstDimensionDataColumn]
    const val = dataItem[firstMeasureDataColumn]
    const value = NumberUtils.roundToPrecision(val, maxDecimalDigits)
    if (!Objects.isEmpty(name) && !Number.isNaN(value)) {
      acc.push({ name, value, color: colors[index] })
    }
    return acc
  }, [])

  return <PieChart data={chartData} />
}

DataQueryPieChart.propTypes = {
  data: PropTypes.array.isRequired,
  nodeDefLabelType: PropTypes.string,
}
