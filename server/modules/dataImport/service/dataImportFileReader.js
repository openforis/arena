import { Points } from '@openforis/arena-core'

import { CsvDataExportModel } from '@common/model/csvExport'

import SystemError from '@core/systemError'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Node from '@core/record/node'

import * as CSVReader from '@server/utils/file/csvReader'

const VALUE_PROP_DEFAULT = 'value'

const singlePropValueConverter = ({ value }) => value[VALUE_PROP_DEFAULT]

const valueConverterByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: singlePropValueConverter,
  [NodeDef.nodeDefType.code]: ({ survey, nodeDef, value }) => {
    const code = value[Node.valuePropsCode.code]

    const category = Survey.getCategoryItemByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
    if (Category.isFlat(category) || !NodeDef.getParentCodeDefUuid(nodeDef)) {
      const { itemUuid } = Survey.getCategoryItemUuidAndCodeHierarchy({ nodeDef, code })(survey)
      return Node.newNodeValueCode({ itemUuid })
    }
    // cannot determine itemUuid for hiearachical category items at this stage; item can depend on selected parent item;
    return { [Node.valuePropsCode.code]: code }
  },
  [NodeDef.nodeDefType.coordinate]: ({ value }) => {
    const point = Points.parse(value)
    if (!point) return null
    const { x, y, srs: srsId } = point
    return Node.newNodeValueCoordinate({ x, y, srsId })
  },
  [NodeDef.nodeDefType.date]: singlePropValueConverter,
  [NodeDef.nodeDefType.decimal]: singlePropValueConverter,
  [NodeDef.nodeDefType.integer]: singlePropValueConverter,
  [NodeDef.nodeDefType.taxon]: ({ survey, nodeDef, value }) => {
    const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
    const taxonCode = value[Node.valuePropsTaxon.code]
    const taxon = Survey.getTaxonByCode({ taxonomyUuid, taxonCode })(survey)
    return taxon ? Node.newNodeValueTaxon({ taxonUuid: taxon.uuid }) : null
  },
  [NodeDef.nodeDefType.text]: singlePropValueConverter,
  [NodeDef.nodeDefType.time]: singlePropValueConverter,
}

const checkAllHeadersAreValid =
  ({ csvDataExportModel }) =>
  (headers) => {
    const dataExportModelHeaders = csvDataExportModel.columns.map((col) => col.header)
    const invalidHeaders = headers.filter((header) => !dataExportModelHeaders.includes(header))
    if (invalidHeaders.length > 0) {
      throw new SystemError('validationErrors.dataImport.invalidHeaders', { invalidHeaders })
    }
  }

const checkRequiredHeadersNotMissing =
  ({ csvDataExportModel }) =>
  (headers) => {
    const requiredHeaders = csvDataExportModel.columns.filter((col) => col.key).map((col) => col.header)
    const missingRequiredHeaders = requiredHeaders.filter((header) => !headers.includes(header))
    if (missingRequiredHeaders.length > 0) {
      throw new SystemError('validationErrors.dataImport.missingRequiredHeaders', { missingRequiredHeaders })
    }
  }

const validateHeaders =
  ({ csvDataExportModel }) =>
  async (headers) => {
    checkAllHeadersAreValid({ csvDataExportModel })(headers)
    checkRequiredHeadersNotMissing({ csvDataExportModel })(headers)
  }

/**
 * Creates a CSV reader that transforms every row extracting a node value for each column associated to a node definition.
 */
const createReader = async ({ filePath, survey, entityDefUuid, onRowItem, onTotalChange }) => {
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)

  const csvDataExportModel = new CsvDataExportModel({
    survey,
    nodeDefContext: entityDef,
    options: {
      includeCategoryItemsLabels: false,
      includeTaxonScientificName: false,
      includeFiles: false,
      includeAnalysis: false,
    },
  })

  return CSVReader.createReaderFromFile(
    filePath,
    validateHeaders({ csvDataExportModel }),
    async (row) => {
      const valuesByDefUuidTemp = csvDataExportModel.columns.reduce((valuesByDefUuidAcc, column) => {
        const { header, nodeDef, valueProp = VALUE_PROP_DEFAULT } = column
        if (!row.hasOwnProperty(header)) return valuesByDefUuidAcc

        const cellValue = row[header]
        const nodeDefUuid = NodeDef.getUuid(nodeDef)
        const value = valuesByDefUuidAcc[nodeDefUuid] || {}
        value[valueProp] = cellValue
        valuesByDefUuidAcc[nodeDefUuid] = value
        return valuesByDefUuidAcc
      }, {})

      const valuesByDefUuid = Object.entries(valuesByDefUuidTemp).reduce((acc, [nodeDefUuid, value]) => {
        const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
        const valueConverter = valueConverterByNodeDefType[NodeDef.getType(nodeDef)]
        const nodeValue = valueConverter({ survey, nodeDef, value })
        acc[nodeDefUuid] = nodeValue
        return acc
      }, {})

      await onRowItem({ valuesByDefUuid })
    },
    onTotalChange
  )
}

export const DataImportFileReader = {
  createReader,
}
