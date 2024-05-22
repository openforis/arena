import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as ObjectUtils from '@core/objectUtils'

import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { ScatterChart } from '@webapp/charts/ScatterChart'
import { DataExplorerActions } from '@webapp/store/dataExplorer'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { useDataQueryChartData } from '../useDataQueryChartData'
import { DataQueryScatterChartTooltip } from './DataQueryScatterChartTooltip'

const maxItems = 5000

const categoricalAttributeDefTypes = [NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon]

const getCategoricalVariableColumnName = ({ categoricalAttributeDef, nodeDefLabelType }) => {
  if (!categoricalAttributeDef) return null
  const nodeDefName = NodeDef.getName(categoricalAttributeDef)
  if (nodeDefLabelType === NodeDef.NodeDefLabelTypes.name) return nodeDefName
  if (NodeDef.isCode(categoricalAttributeDef)) return `${nodeDefName}_label`
  if (NodeDef.isTaxon(categoricalAttributeDef)) return `${nodeDefName}_scientific_name`
  return null
}

const countDistinctValues = ({ data, columnName }) => {
  if (!columnName) return 0
  const valuesFound = {}
  data.forEach((item) => {
    const value = item[columnName]
    if (!Objects.isEmpty(value)) {
      valuesFound[value] = true
    }
  })
  return Object.keys(valuesFound).length
}

export const DataQueryScatterChart = (props) => {
  const { data, nodeDefLabelType } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const { dataColumnByAttributeDefUuid, dataKeyByAttributeDefUuid, query } = useDataQueryChartData({
    data,
    nodeDefLabelType,
  })

  const queryEntityDefUuid = Query.getEntityDefUuid(query)
  const queryEntityDef = Survey.getNodeDefByUuid(queryEntityDefUuid)(survey)
  const queryEntityDefName = NodeDef.getName(queryEntityDef)
  const attributeDefUuids = Object.keys(dataColumnByAttributeDefUuid)
  const attributeDefs = Survey.getNodeDefsByUuids(attributeDefUuids)(survey)

  const onClick = useCallback(
    (e) => {
      const { payload } = e
      const { record_uuid: recordUuid } = payload
      const queryParentEntityField = `${queryEntityDefName}_uuid`
      const parentNodeUuid = payload[queryParentEntityField]
      if (recordUuid && parentNodeUuid) {
        dispatch(DataExplorerActions.openRecordEditModal({ recordUuid, parentNodeUuid }))
      }
    },
    [dispatch, queryEntityDefName]
  )

  const categoricalAttributeDef = attributeDefs.find((nodeDef) =>
    categoricalAttributeDefTypes.includes(NodeDef.getType(nodeDef))
  )
  const categoricalAttributeDefColumnName = getCategoricalVariableColumnName({
    categoricalAttributeDef,
    nodeDefLabelType,
  })
  const categoricalAttributeDistinctValuesCount = countDistinctValues({
    data,
    columnName: categoricalAttributeDefColumnName,
  })

  const colors = useRandomColors(categoricalAttributeDistinctValuesCount, { onlyDarkColors: true })

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

  const categoricalAttributeDefLabel = categoricalAttributeDef
    ? NodeDef.getLabelWithType({ nodeDef: categoricalAttributeDef, lang, type: nodeDefLabelType })
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

  const chartDataGrouped = categoricalAttributeDefColumnName
    ? ObjectUtils.groupByProp(categoricalAttributeDefColumnName)(chartData)
    : { chartData }

  const dataSet = Object.entries(chartDataGrouped).map(([name, data], index) => ({ name, data, fill: colors[index] }))

  return (
    <ScatterChart
      dataSet={dataSet}
      onClick={onClick}
      renderTooltip={
        <DataQueryScatterChartTooltip
          categoricalAttributeDefField={categoricalAttributeDefColumnName}
          categoricalAttributeDefName={categoricalAttributeDefLabel}
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
