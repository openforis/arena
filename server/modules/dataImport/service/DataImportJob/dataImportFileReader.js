import { Objects } from '@openforis/arena-core'

import { CsvDataExportModel } from '@common/model/csvExport'

import SystemError from '@core/systemError'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Node from '@core/record/node'
import * as DateUtils from '@core/dateUtils'
import * as CSVReader from '@server/utils/file/csvReader'
import * as FileUtils from '@server/utils/file/fileUtils'

const VALUE_PROP_DEFAULT = 'value'

const allowedDateFormats = [
  DateUtils.formats.dateISO,
  'yyyy.MM.dd',
  'yyyy/MM/dd',
  DateUtils.formats.dateDefault,
  'dd-MM-yyyy',
  'dd.MM.yyyy',
]
const allowedBooleanValues = ['true', 'false', '1', '0']

const singlePropValueConverter = ({ value }) => value[VALUE_PROP_DEFAULT]

const numericValueConverter = ({ value, headers }) => {
  const val = singlePropValueConverter({ value })
  const numericVal = Number(val)
  if (Number.isNaN(numericVal)) {
    throw new SystemError('validationErrors.dataImport.invalidNumber', { value: val, headers })
  }
  return numericVal
}

const valueConverterByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: ({ value, headers }) => {
    const val = singlePropValueConverter({ value })
    if (!allowedBooleanValues.includes(String(val).toLocaleLowerCase())) {
      throw new SystemError('validationErrors.dataImport.invalidBoolean', { value: val, headers })
    }
    return String(['true', '1'].includes(String(val).toLocaleLowerCase()))
  },
  [NodeDef.nodeDefType.code]: ({ survey, nodeDef, value }) => {
    const code = value[Node.valuePropsCode.code]

    const category = Survey.getCategoryItemByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
    if (Category.isFlat(category) || !NodeDef.getParentCodeDefUuid(nodeDef)) {
      const { itemUuid } = Survey.getCategoryItemUuidAndCodeHierarchy({ nodeDef, code })(survey)
      if (!itemUuid) {
        const attributeName = NodeDef.getName(nodeDef)
        throw new SystemError('validationErrors.dataImport.invalidCode', { code, attributeName })
      }
      return Node.newNodeValueCode({ itemUuid })
    }
    // cannot determine itemUuid for hiearachical category items at this stage; item can depend on selected parent item;
    return { [Node.valuePropsCode.code]: code }
  },
  [NodeDef.nodeDefType.coordinate]: ({ value }) => {
    const srsId = value[Node.valuePropsCoordinate.srs]
    const x = value[Node.valuePropsCoordinate.x]
    const y = value[Node.valuePropsCoordinate.y]
    return Node.newNodeValueCoordinate({ x, y, srsId })
  },
  [NodeDef.nodeDefType.date]: ({ value, headers }) => {
    const val = singlePropValueConverter({ value })
    let dateParsed = null
    allowedDateFormats.some((format) => {
      dateParsed = DateUtils.parse(val, format)
      return DateUtils.isValidDateObject(dateParsed)
    })
    if (!DateUtils.isValidDateObject(dateParsed)) {
      throw new SystemError('validationErrors.dataImport.invalidDate', { headers, value: val })
    }
    return DateUtils.formatDateISO(dateParsed)
  },
  [NodeDef.nodeDefType.decimal]: numericValueConverter,
  [NodeDef.nodeDefType.integer]: numericValueConverter,
  [NodeDef.nodeDefType.taxon]: ({ survey, nodeDef, value, headers }) => {
    const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
    const taxonCode = value[Node.valuePropsTaxon.code]
    const taxon = Survey.getTaxonByCode({ taxonomyUuid, taxonCode })(survey)
    if (taxon) {
      return Node.newNodeValueTaxon({ taxonUuid: taxon.uuid })
    }
    throw new SystemError('validationErrors.dataImport.invalidTaxonCode', { value, headers })
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
      throw new SystemError('validationErrors.dataImport.invalidHeaders', { invalidHeaders: invalidHeaders.join(', ') })
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

const _validateHeaders =
  ({ csvDataExportModel }) =>
  async (headers) => {
    checkAllHeadersAreValid({ csvDataExportModel })(headers)
    checkRequiredHeadersNotMissing({ csvDataExportModel })(headers)
  }

/**
 * Creates a CSV reader that transforms every row extracting a node value for each column associated to a node definition.
 *
 * @param {!object} params - The parameters object.
 * @param {!string} [params.filePath] - File path to be read.
 * @param {!object} [params.survey] - The survey object.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!string} [params.nodeDefUuid] - The UUID of the node definition where data will be imported.
 * @param {!Function} [params.onRowItem] - Function invoked when a row is read.
 * @param {Function} [params.onTotalChange] - Function invoked when total number of rows is calculated.
 * @returns {Promise} - Result promise. It resolves when the file is fully read.
 */
const createReader = ({ filePath, survey, cycle, nodeDefUuid, onRowItem, onTotalChange }) =>
  createReaderFromStream({
    stream: FileUtils.createReadStream(filePath),
    survey,
    cycle,
    nodeDefUuid,
    onRowItem,
    onTotalChange,
  })

const createReaderFromStream = ({
  stream,
  survey,
  cycle,
  nodeDefUuid,
  onRowItem,
  onTotalChange,
  includeAnalysis = false,
  validateHeaders = true,
}) => {
  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const csvDataExportModel = new CsvDataExportModel({
    survey,
    cycle,
    nodeDefContext,
    options: {
      includeCategoryItemsLabels: false,
      includeTaxonScientificName: false,
      includeFiles: false,
      includeAnalysis,
    },
  })

  return CSVReader.createReaderFromStream(
    stream,
    (headers) => {
      if (validateHeaders) _validateHeaders({ csvDataExportModel })(headers)
    },
    async (row) => {
      // combine several columns into single values for every attribute definition
      const valuesByDefUuidTemp = csvDataExportModel.columns.reduce((valuesByDefUuidAcc, column) => {
        const { header, nodeDef, valueProp = VALUE_PROP_DEFAULT } = column

        if (!Object.prototype.hasOwnProperty.call(row, header)) return valuesByDefUuidAcc

        const cellValue = row[header]
        if (Objects.isEmpty(cellValue)) return valuesByDefUuidAcc

        const nodeDefUuid = NodeDef.getUuid(nodeDef)
        const valueTemp = valuesByDefUuidAcc[nodeDefUuid] || {}
        const valueHeaders = valueTemp.headers || []
        valueHeaders.push(header)
        valueTemp._headers = valueHeaders
        valueTemp[valueProp] = cellValue
        valuesByDefUuidAcc[nodeDefUuid] = valueTemp
        return valuesByDefUuidAcc
      }, {})

      // prepare attribute values
      const errors = []
      const valuesByDefUuid = Object.entries(valuesByDefUuidTemp).reduce((acc, [nodeDefUuid, valueTemp]) => {
        const headers = valueTemp._headers
        delete valueTemp._headers
        const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
        const valueConverter = valueConverterByNodeDefType[NodeDef.getType(nodeDef)]
        try {
          const nodeValue = valueConverter({ survey, nodeDef, value: valueTemp, headers })
          acc[nodeDefUuid] = nodeValue
        } catch (error) {
          errors.push(error)
        }
        return acc
      }, {})

      await onRowItem({ row, valuesByDefUuid, errors })
    },
    onTotalChange
  )
}

export const DataImportFileReader = {
  createReader,
  createReaderFromStream,
}
