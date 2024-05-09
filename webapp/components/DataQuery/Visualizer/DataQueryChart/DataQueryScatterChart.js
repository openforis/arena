import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { ScatterChart } from '@webapp/charts/ScatterChart'
import { useI18n } from '@webapp/store/system'

import { useDataQueryChartData } from './useDataQueryChartData'
import { useNodeDefsByUuids } from '@webapp/store/survey'

const maxItems = 5000

export const DataQueryScatterChart = (props) => {
  const { data, nodeDefLabelType } = props

  const i18n = useI18n()

  const { dataColumnByAttributeDefUuid, dataKeyByAttributeDefUuid } = useDataQueryChartData({
    data,
    nodeDefLabelType,
  })

  const attributeDefUuids = Object.keys(dataColumnByAttributeDefUuid)
  const attributeDefs = useNodeDefsByUuids(attributeDefUuids).filter(
    (nodeDef) => NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)
  )

  if (data.length > maxItems) {
    return i18n.t('dataView.charts.warning.tooManyItemsToShowChart', { maxItems })
  }

  // consider only first 2 numeric attribute defs as X and Y
  const [xAxisAttributeDefUuid, yAxisAttributeDefUuid] = attributeDefs.map(NodeDef.getUuid)

  if (!xAxisAttributeDefUuid || !yAxisAttributeDefUuid) {
    return i18n.t('dataView.charts.warning.selectAtLeast2NumericAttributes')
  }

  const xAxisDataColumn = dataColumnByAttributeDefUuid[xAxisAttributeDefUuid]
  const xAxisName = dataKeyByAttributeDefUuid[xAxisAttributeDefUuid]
  const yAxisDataColumn = dataColumnByAttributeDefUuid[yAxisAttributeDefUuid]
  const yAxisName = dataKeyByAttributeDefUuid[yAxisAttributeDefUuid]

  const chartData = data.reduce((acc, dataItem) => {
    acc.push({
      x: Number(dataItem[xAxisDataColumn]),
      y: Number(dataItem[yAxisDataColumn]),
    })
    return acc
  }, [])

  return <ScatterChart data={chartData} xAxisProps={{ name: xAxisName }} yAxisProps={{ name: yAxisName }} />
}

DataQueryScatterChart.propTypes = {
  data: PropTypes.array.isRequired,
  nodeDefLabelType: PropTypes.string,
}
