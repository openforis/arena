import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as ObjectUtils from '@core/objectUtils'

import { ScatterChart } from '@webapp/charts/ScatterChart'
import { useNodeDefsByUuids, useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { useDataQueryChartData } from '../useDataQueryChartData'
import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { DataQueryScatterChartTooltip } from './DataQueryScatterChartTooltip'

const maxItems = 5000

export const DataQueryScatterChart = (props) => {
  const { data, nodeDefLabelType } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const { dataColumnByAttributeDefUuid, dataKeyByAttributeDefUuid } = useDataQueryChartData({
    data,
    nodeDefLabelType,
  })

  const attributeDefUuids = Object.keys(dataColumnByAttributeDefUuid)
  const attributeDefs = useNodeDefsByUuids(attributeDefUuids)

  const codeAttributeDef = attributeDefs.find(NodeDef.isCode)
  const category = codeAttributeDef ? Survey.getCategoryByUuid(NodeDef.getCategoryUuid(codeAttributeDef))(survey) : null
  const categoryItemsSize = category ? Category.getItemsCount(category) : 0
  const colors = useRandomColors(categoryItemsSize, { onlyDarkColors: true })

  if (data.length > maxItems) {
    return i18n.t('dataView.charts.warning.tooManyItemsToShowChart', { maxItems })
  }

  const numericAttributeDefs = attributeDefs.filter(
    (nodeDef) => NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)
  )

  // consider only first 2 numeric attribute defs as X and Y
  const [xAxisAttributeDefUuid, yAxisAttributeDefUuid] = numericAttributeDefs.map(NodeDef.getUuid)

  if (!xAxisAttributeDefUuid || !yAxisAttributeDefUuid) {
    return i18n.t('dataView.charts.warning.selectAtLeast2NumericAttributes')
  }
  const codeAttributeDefField = codeAttributeDef
    ? nodeDefLabelType === NodeDef.NodeDefLabelTypes.name
      ? NodeDef.getName(codeAttributeDef)
      : `${NodeDef.getName(codeAttributeDef)}_label`
    : null
  const codeAttributeDefName = codeAttributeDef
    ? NodeDef.getLabelWithType({ nodeDef: codeAttributeDef, lang, type: nodeDefLabelType })
    : null

  const xAxisDataKey = dataColumnByAttributeDefUuid[xAxisAttributeDefUuid]
  const xAxisName = dataKeyByAttributeDefUuid[xAxisAttributeDefUuid]
  const yAxisDataKey = dataColumnByAttributeDefUuid[yAxisAttributeDefUuid]
  const yAxisName = dataKeyByAttributeDefUuid[yAxisAttributeDefUuid]

  const chartData = data.reduce((acc, dataItem) => {
    acc.push({
      ...dataItem,
      [xAxisDataKey]: Number(dataItem[xAxisDataKey]),
      [yAxisDataKey]: Number(dataItem[yAxisDataKey]),
    })
    return acc
  }, [])

  const chartDataGrouped = codeAttributeDefField
    ? ObjectUtils.groupByProp(codeAttributeDefField)(chartData)
    : { chartData }

  const dataSet = Object.entries(chartDataGrouped).map(([name, data], index) => ({ name, data, fill: colors[index] }))

  return (
    <ScatterChart
      dataSet={dataSet}
      renderTooltip={
        <DataQueryScatterChartTooltip
          codeAttributeDefField={codeAttributeDefField}
          codeAttributeDefName={codeAttributeDefName}
          xAxisDataKey={xAxisDataKey}
          xAxisName={xAxisName}
          yAxisDataKey={yAxisDataKey}
          yAxisName={yAxisName}
        />
      }
      xAxisProps={{ name: xAxisName, dataKey: xAxisDataKey }}
      yAxisProps={{ name: yAxisName, dataKey: yAxisDataKey }}
    />
  )
}

DataQueryScatterChart.propTypes = {
  data: PropTypes.array.isRequired,
  nodeDefLabelType: PropTypes.string,
}
