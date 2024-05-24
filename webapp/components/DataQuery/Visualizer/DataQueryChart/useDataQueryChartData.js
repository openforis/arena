import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'
import { DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useNodeDefsByUuids, useSurveyPreferredLang } from '@webapp/store/survey'
import { useRandomColors } from '@webapp/components/hooks/useRandomColors'

export const emptyValueLabel = '--- NA ---'

export const useDataQueryChartData = ({ data, nodeDefLabelType }) => {
  const query = DataExplorerSelectors.useQuery()
  const lang = useSurveyPreferredLang()

  const attributeDefUuids = Query.getAttributeDefUuids(query)
  const dimensions = Query.getDimensions(query)
  const firstDimension = dimensions[0]
  const measures = Query.getMeasures(query)
  const contextEntityDefUuid = Query.getEntityDefUuid(query)
  const measureNodeDefUuids = Object.keys(measures)
  const dataColors = useRandomColors(measureNodeDefUuids.length, { onlyDarkColors: true })

  const attributeDefs = useNodeDefsByUuids(attributeDefUuids)
  const dimensionNodeDefs = useNodeDefsByUuids(dimensions)
  const measuresNodeDefs = useNodeDefsByUuids(measureNodeDefUuids)

  const getDataKeysIndexedByNodeDefUuids = (nodeDefs) =>
    nodeDefs.reduce((acc, nodeDef) => {
      const key = NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })
      acc[NodeDef.getUuid(nodeDef)] = key
      return acc
    }, {})

  const dataKeyByAttributeDefUuid = getDataKeysIndexedByNodeDefUuids(attributeDefs)
  const dataKeyByDimensionNodeDefUuid = getDataKeysIndexedByNodeDefUuids(dimensionNodeDefs)

  const getDataColumnsIndexedByNodeDefUuids = (nodeDefs) =>
    nodeDefs.reduce((acc, nodeDef) => {
      const nodeDefName = NodeDef.getName(nodeDef)
      const colName =
        NodeDef.isCode(nodeDef) && nodeDefLabelType === NodeDef.NodeDefLabelTypes.label
          ? `${nodeDefName}_label`
          : nodeDefName
      acc[NodeDef.getUuid(nodeDef)] = colName
      return acc
    }, {})

  const dataColumnByAttributeDefUuid = getDataColumnsIndexedByNodeDefUuids(attributeDefs)
  const dataColumnByDimensionNodeDefUuid = getDataColumnsIndexedByNodeDefUuids(dimensionNodeDefs)

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
    const labelValue = dataItem[labelCol]
    return {
      [labelDataKey]: labelValue ?? emptyValueLabel,
      ...measureNodeDefUuids.reduce((acc, measureNodeDefUuid) => {
        const valueColumns = dataColumnsByMeasureNodeDefUuid[measureNodeDefUuid]
        const dataKeys = dataKeysByMeasureNodeDefUuid[measureNodeDefUuid]
        dataKeys.forEach((dataKey, index) => {
          const valueColumn = valueColumns[index]
          const value = dataItem[valueColumn]
          acc[dataKey] = Number(value)
        }, {})
        return acc
      }, {}),
    }
  })

  return {
    chartData,
    dataColors,
    dataColumnByAttributeDefUuid,
    dataColumnByDimensionNodeDefUuid,
    dataColumnsByMeasureNodeDefUuid,
    dataKeyByAttributeDefUuid,
    dataKeyByDimensionNodeDefUuid,
    dataKeysByMeasureNodeDefUuid,
    dataKeys,
    labelDataKey,
    query,
  }
}
