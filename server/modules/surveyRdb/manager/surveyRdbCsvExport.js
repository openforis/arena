import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'

import { ArrayUtils } from '@core/arrayUtils'
import { Query } from '@common/model/query'
import { CsvDataExportModel } from '@common/model/csvExport'
import { ColumnNodeDef, ViewDataNodeDef } from '@common/model/db'

import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'

const maxExpandedCategoryItems = 20

const visitCategoryItems = ({ survey, nodeDef, itemVisitor }) => {
  const items = Survey.getNodeDefCategoryItems(nodeDef)(survey)
  if (items.length <= maxExpandedCategoryItems) {
    items.forEach(itemVisitor)
  }
}

const fieldsExtractorByNodeDefType = {
  [NodeDef.nodeDefType.code]: ({ survey, columnNodeDef, includeCategoryItemsLabels, expandCategoryItems }) => {
    const { name: mainColumnName, names: columnNames, nodeDef } = columnNodeDef

    if (!includeCategoryItemsLabels && !expandCategoryItems) {
      // keep only code column
      return [mainColumnName]
    } else {
      const result = []
      if (
        includeCategoryItemsLabels &&
        (NodeDef.isSingle(nodeDef) || NodeDef.isMultipleAttribute(columnNodeDef.table.nodeDef))
      ) {
        // label column included only for single attributes or multiple attributes in their own table
        result.push(...columnNames)
      } else {
        result.push(mainColumnName)
      }
      if (expandCategoryItems) {
        // add expanded category items columns
        visitCategoryItems({
          survey,
          nodeDef,
          itemVisitor: (item) => {
            result.push(
              CsvDataExportModel.getExpandedCategoryItemColumnHeader({
                nodeDef,
                code: CategoryItem.getCode(item),
              })
            )
          },
        })
      }
      return result
    }
  },
  [NodeDef.nodeDefType.coordinate]: ({ columnNodeDef }) => {
    // exclude geometry column
    return columnNodeDef.names.filter((name) => name !== columnNodeDef.name)
  },
}

const getCsvExportFields = ({
  survey,
  query,
  addCycle = false,
  includeCategoryItemsLabels = true,
  expandCategoryItems = false,
  includeInternalUuids = false,
}) => {
  const entityDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const viewDataNodeDef = new ViewDataNodeDef(survey, entityDef)

  // Consider only user selected fields (from column node defs)
  const nodeDefUuidCols = Query.getAttributeDefUuids(query)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const fields = []
  if (includeInternalUuids) {
    ArrayUtils.addIfNotEmpty(viewDataNodeDef.columnParentUuidName)(fields)
    fields.push(viewDataNodeDef.columnUuidName)
  }
  if (addCycle) {
    // Cycle is 0-based
    fields.push(DataTable.columnNameRecordCycle)
  }
  fields.push(
    ...nodeDefCols.flatMap((nodeDefCol) => {
      const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDefCol)
      const fieldsExtractor = fieldsExtractorByNodeDefType[NodeDef.getType(nodeDefCol)]
      if (fieldsExtractor) {
        return fieldsExtractor({
          survey,
          columnNodeDef,
          includeCategoryItemsLabels,
          expandCategoryItems,
        })
      } else {
        return columnNodeDef.names
      }
    })
  )
  return fields
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
  Object.entries(Query.getMeasures(query)).forEach(([nodeDefUuid, aggFunctions]) => {
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
    nodeDefCodeCols.forEach((nodeDef) => {
      const values = obj[NodeDef.getName(nodeDef)]
      visitCategoryItems({
        survey,
        nodeDef,
        itemVisitor: (item) => {
          const code = CategoryItem.getCode(item)
          const colName = CsvDataExportModel.getExpandedCategoryItemColumnHeader({
            nodeDef,
            code,
          })
          obj[colName] = values?.includes(code)
        },
      })
    })
    return obj
  }
}

const getCsvObjectTransformerNullsToEmpty = () => {
  return (obj) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (A.isNull(value)) {
        obj[key] = ''
      }
    })
    return obj
  }
}

const getCsvObjectTransformer = ({ survey, query, expandCategoryItems, nullsToEmpty = false }) => {
  const transformers = []
  if (expandCategoryItems) {
    transformers.push(getCsvObjectTransformerExpandCategoryItems({ survey, query }))
  }
  if (nullsToEmpty) {
    transformers.push(getCsvObjectTransformerNullsToEmpty())
  }
  return transformers.length === 0 ? null : A.pipe(...transformers)
}

export const SurveyRdbCsvExport = {
  getCsvExportFields,
  getCsvExportFieldsAgg,
  getCsvObjectTransformer,
}
