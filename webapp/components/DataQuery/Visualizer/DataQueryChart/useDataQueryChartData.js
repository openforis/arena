import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'
import { DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useNodeDefsByUuids, useSurveyPreferredLang } from '@webapp/store/survey'
import { useRandomColors } from '@webapp/components/hooks/useRandomColors'

export const emptyValueLabel = '--- NA ---'

export const useDataQueryChartData = ({ data, nodeDefLabelType }) => {
  const query = DataExplorerSelectors.useQuery()
  const lang = useSurveyPreferredLang()

  const dimensions = Query.getDimensions(query)
  const firstDimension = dimensions[0]
  const measures = Query.getMeasures(query)
  const contextEntityDefUuid = Query.getEntityDefUuid(query)
  const measureNodeDefUuids = Object.keys(measures)
  const dataColors = useRandomColors(measureNodeDefUuids.length, { onlyDarkColors: true })

  const dimensionNodeDefs = useNodeDefsByUuids(dimensions)
  const measuresNodeDefs = useNodeDefsByUuids(measureNodeDefUuids)

  const dataKeyByDimensionNodeDefUuid = dimensionNodeDefs.reduce((acc, nodeDef) => {
    const key = NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })
    acc[NodeDef.getUuid(nodeDef)] = key
    return acc
  }, {})

  const dataColumnByDimensionNodeDefUuid = dimensionNodeDefs.reduce((acc, nodeDef) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    const colName =
      NodeDef.isCode(nodeDef) && nodeDefLabelType === NodeDef.NodeDefLabelTypes.label
        ? `${nodeDefName}_label`
        : nodeDefName
    acc[NodeDef.getUuid(nodeDef)] = colName
    return acc
  }, {})

  const dataKeysByMeasureNodeDefUuid = measuresNodeDefs.reduce((acc, nodeDef) => {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const aggFunctions = Query.getMeasureAggregateFunctions(nodeDefUuid)(query)
    const keys = aggFunctions.map((aggFunction) => {
      const nodeDefLabel = NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })
      return `${nodeDefLabel} (${aggFunction})`
    })
    acc[nodeDefUuid] = keys
    return acc
  }, {})

  const dataColumnsByMeasureNodeDefUuid = measuresNodeDefs.reduce((acc, nodeDef) => {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const nodeDefName = NodeDef.getName(nodeDef)
    const aggFunctions = Query.getMeasureAggregateFunctions(nodeDefUuid)(query)
    const colNames = aggFunctions.map((aggFunction) =>
      nodeDefUuid === contextEntityDefUuid ? `${nodeDefName}_uuid_${aggFunction}` : `${nodeDefName}_${aggFunction}`
    )
    acc[nodeDefUuid] = colNames
    return acc
  }, {})

  const labelDataKey = dataKeyByDimensionNodeDefUuid[firstDimension]

  const dataKeys = measureNodeDefUuids.flatMap((measureNodeDefUuid) => dataKeysByMeasureNodeDefUuid[measureNodeDefUuid])

  const chartData = data.map((dataItem) => {
    const labelCol = dataColumnByDimensionNodeDefUuid[firstDimension]
    return {
      [labelDataKey]: dataItem[labelCol] ?? emptyValueLabel,
      ...measureNodeDefUuids.reduce((acc, measureNodeDefUuid) => {
        const valueColumns = dataColumnsByMeasureNodeDefUuid[measureNodeDefUuid]
        const dataKeys = dataKeysByMeasureNodeDefUuid[measureNodeDefUuid]
        dataKeys.forEach((dataKey, index) => {
          const valueColumn = valueColumns[index]
          acc[dataKey] = dataItem[valueColumn]
        }, {})
        return acc
      }, {}),
    }
  })

  return {
    chartData,
    dataColors,
    dataColumnByDimensionNodeDefUuid,
    dataColumnsByMeasureNodeDefUuid,
    dataKeyByDimensionNodeDefUuid,
    dataKeysByMeasureNodeDefUuid,
    dataKeys,
    labelDataKey,
  }
}
