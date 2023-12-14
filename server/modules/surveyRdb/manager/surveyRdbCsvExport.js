import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'

import { Query } from '@common/model/query'
import { CsvDataExportModel } from '@common/model/csvExport'
import { ColumnNodeDef, ViewDataNodeDef } from '@common/model/db'

import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'

const getCsvExportFields = ({
  survey,
  query,
  addCycle = false,
  includeCategoryItemsLabels = true,
  expandCategoryItems = false,
}) => {
  const entityDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const viewDataNodeDef = new ViewDataNodeDef(survey, entityDef)

  // Consider only user selected fields (from column node defs)
  const nodeDefUuidCols = Query.getAttributeDefUuids(query)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const fields = nodeDefCols.flatMap((nodeDefCol) => {
    const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDefCol)
    const columnNames = columnNodeDef.names
    const mainColumnName = columnNodeDef.name
    if (NodeDef.isCode(nodeDefCol)) {
      if (!includeCategoryItemsLabels && !expandCategoryItems) {
        // keep only code column
        return [mainColumnName]
      } else {
        const result = []
        if (includeCategoryItemsLabels && NodeDef.isSingle(nodeDefCol)) {
          result.push(...columnNames)
        } else {
          result.push(mainColumnName)
        }
        if (expandCategoryItems) {
          // add expanded category items columns
          const items = Survey.getNodeDefCategoryItems(nodeDefCol)(survey)
          result.push(
            ...items.map((item) =>
              CsvDataExportModel.getExpandedCategoryItemColumnHeader({
                nodeDef: nodeDefCol,
                code: CategoryItem.getCode(item),
              })
            )
          )
        }
        return result
      }
    } else if (NodeDef.isCoordinate(nodeDefCol)) {
      // exclude geometry column
      return columnNames.filter((name) => name !== columnNodeDef.name)
    } else {
      return columnNames
    }
  })
  // Cycle is 0-based
  return [...(addCycle ? [DataTable.columnNameRecordCycle] : []), ...fields]
}

const getCsvExportFieldsAgg = ({ survey, query }) => {
  const nodeDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)

  const fields = []
  // dimensions
  Query.getDimensions(query).forEach((dimension) => {
    const nodeDefDimension = Survey.getNodeDefByUuid(dimension)(viewDataNodeDef.survey)
    fields.push(new ColumnNodeDef(viewDataNodeDef, nodeDefDimension).name)
  })
  // measures
  Array.from(Query.getMeasures(query).entries()).forEach(([nodeDefUuid, aggFunctions]) => {
    const nodeDefMeasure = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    aggFunctions.forEach((aggregateFnOrUuid) => {
      const fieldAlias = ColumnNodeDef.getColumnNameAggregateFunction({
        nodeDef: nodeDefMeasure,
        aggregateFn: aggregateFnOrUuid,
      })
      fields.push(fieldAlias)
    })
  })
  return fields
}

const getCsvObjectTransformerExpandCategoryItems = ({ survey, query }) => {
  const nodeDefUuidCols = Query.getAttributeDefUuids(query)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const nodeDefCodeCols = nodeDefCols.filter(NodeDef.isCode)
  return (obj) => {
    nodeDefCodeCols.forEach((nodeDefCode) => {
      const items = Survey.getNodeDefCategoryItems(nodeDefCode)(survey)
      const values = obj[NodeDef.getName(nodeDefCode)]
      items.forEach((item) => {
        const code = CategoryItem.getCode(item)
        const colName = CsvDataExportModel.getExpandedCategoryItemColumnHeader({
          nodeDef: nodeDefCode,
          code,
        })
        obj[colName] = values.includes(code)
      })
    })
    return obj
  }
}

const getCsvObjectTransformer = ({ survey, query, expandCategoryItems }) =>
  expandCategoryItems ? getCsvObjectTransformerExpandCategoryItems({ survey, query }) : null

export const SurveyRdbCsvExport = {
  getCsvExportFields,
  getCsvExportFieldsAgg,
  getCsvObjectTransformer,
}
