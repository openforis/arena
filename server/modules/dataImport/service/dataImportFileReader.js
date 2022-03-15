import { Points } from '@openforis/arena-core'

import { CsvDataExportModel } from '@common/model/csvExport'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import * as CSVReader from '@server/utils/file/csvReader'

const VALUE_PROP_DEFAULT = 'value'

const singlePropValueConverter = ({ value }) => value[VALUE_PROP_DEFAULT]

const valueConverterByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: singlePropValueConverter,
  [NodeDef.nodeDefType.code]: ({ survey, nodeDef, value }) => {
    const code = value[Node.valuePropsCode.code]
    const { itemUuid } = Survey.getCategoryItemUuidAndCodeHierarchy({ nodeDef, code })(survey)
    const nodeValue = Node.newNodeValueCode({ itemUuid })
    return { ...nodeValue, [Node.valuePropsCode.code]: code }
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
    null,
    async (row) => {
      const valuesByDefUuidTemp = csvDataExportModel.columns.reduce((valuesByDefUuidAcc, column) => {
        const { header, nodeDef, valueProp = VALUE_PROP_DEFAULT } = column
        if (!row.hasOwnProperty(header)) return valuesByDefUuidAcc

        const cellValue = row[header]
        const nodeDefUuid = NodeDef.getUuid(nodeDef)
        const value = valuesByDefUuidAcc[nodeDefUuid] || {}
        value[valueProp] = cellValue
        return { ...valuesByDefUuidAcc, [nodeDefUuid]: value }
      }, {})

      const valuesByDefUuid = Object.entries(valuesByDefUuidTemp).reduce((acc, [nodeDefUuid, value]) => {
        const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
        const valueConverter = valueConverterByNodeDefType[NodeDef.getType(nodeDef)]
        const nodeValue = valueConverter({ survey, nodeDef, value })
        return { ...acc, [nodeDefUuid]: nodeValue }
      }, {})

      await onRowItem({ valuesByDefUuid })
    },
    onTotalChange
  )
}

export const DataImportFileReader = {
  createReader,
}
