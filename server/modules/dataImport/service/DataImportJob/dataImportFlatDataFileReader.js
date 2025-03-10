import { Objects } from '@openforis/arena-core'

import { CsvDataExportModel } from '@common/model/csvExport'

import SystemError from '@core/systemError'
import * as Srs from '@core/geo/srs'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Node from '@core/record/node'
import * as DateUtils from '@core/dateUtils'
import * as StringUtils from '@core/stringUtils'
import { uuidv4 } from '@core/uuid'

import * as FlatDataReader from '@server/utils/file/flatDataReader'

const VALUE_PROP_DEFAULT = 'value'

const allowedBooleanValues = ['true', 'false', '1', '0']
const allowedDateFormats = [
  DateUtils.formats.dateDefault,
  'DD-MM-YYYY',
  'DD.MM.YYYY',
  'YYYY.MM.DD',
  'YYYY/MM/DD',
  DateUtils.formats.dateISO,
]
const allowedTimeFormats = [DateUtils.formats.timeStorage]

const singlePropValueConverter = ({ value }) => value[VALUE_PROP_DEFAULT]

const numericValueConverter = ({ value, headers }) => {
  const val = singlePropValueConverter({ value })
  const numericVal = Number(val)
  if (Number.isNaN(numericVal)) {
    throw new SystemError('validationErrors.dataImport.invalidNumber', { value: val, headers })
  }
  return numericVal
}

const extractDateOrTime = ({ value, allowedFormats, formatTo, headers, errorKey }) => {
  const val = singlePropValueConverter({ value })
  let dateObj = null
  const valueIsInValidFormat = allowedFormats.some((format) => {
    // date and time values are without timezone
    // use strict parsing to check if date is in the specified format
    dateObj = DateUtils.parse(val, format, { keepTimeZone: false, strict: true })
    return DateUtils.isValidDateObject(dateObj)
  })
  if (!valueIsInValidFormat) {
    throw new SystemError(errorKey, { headers, value: val })
  }
  return DateUtils.format(dateObj, formatTo)
}

const extractVernacularNameUuid = ({ survey, nodeDef, taxonCode, vernacularName }) => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  const taxon = Survey.getTaxonByCode({ taxonomyUuid, taxonCode })(survey)
  if (!taxon || Objects.isEmpty(vernacularName)) return null

  // match vernacular names with language specified (e.g. "Mahogany (eng)") or simple ones, like "Mahogany"
  const regExp = /^([^(]+)(\s\(([^)]+)\))?$/
  const vernacularNameParts = regExp.exec(vernacularName)
  const vernacularNameText = vernacularNameParts[1]
  const vernacularNameLang = vernacularNameParts[3]
  const vernacularNames = vernacularNameLang
    ? Taxon.getVernacularNamesByLang(vernacularNameLang)(taxon)
    : Taxon.getVernacularNamesArray(taxon)
  const vernacularNameObj = vernacularNames.find((vn) => TaxonVernacularName.getName(vn) === vernacularNameText)
  return TaxonVernacularName.getUuid(vernacularNameObj)
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

    const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
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
    const srsId = StringUtils.removePrefix(Srs.idPrefix)(value[Node.valuePropsCoordinate.srs])
    const x = value[Node.valuePropsCoordinate.x]
    const y = value[Node.valuePropsCoordinate.y]
    return Node.newNodeValueCoordinate({ x, y, srsId })
  },
  [NodeDef.nodeDefType.date]: ({ value, headers }) =>
    extractDateOrTime({
      value,
      allowedFormats: allowedDateFormats,
      formatTo: DateUtils.formats.dateISO,
      headers,
      errorKey: 'validationErrors.dataImport.invalidDate',
    }),
  [NodeDef.nodeDefType.decimal]: numericValueConverter,
  [NodeDef.nodeDefType.file]: ({ value, headers }) => {
    const { fileName, fileUuid: fileUuidInValue } = value
    if (Objects.isEmpty(fileName)) {
      throw new SystemError('validationErrors.dataImport.emptyFileName', { headers, fileName })
    }
    const fileUuid = fileUuidInValue ?? uuidv4()
    return {
      [Node.valuePropsFile.fileUuid]: fileUuid,
      [Node.valuePropsFile.fileName]: fileName,
    }
  },
  [NodeDef.nodeDefType.integer]: numericValueConverter,
  [NodeDef.nodeDefType.taxon]: ({ survey, nodeDef, value, headers }) => {
    const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
    const taxonCode = value[Node.valuePropsTaxon.code]
    const taxon = Survey.getTaxonByCode({ taxonomyUuid, taxonCode })(survey)
    if (!taxon) {
      throw new SystemError('validationErrors.dataImport.invalidTaxonCode', { value, headers })
    }
    const { uuid: taxonUuid } = taxon
    const vernacularName = value[Node.valuePropsTaxon.vernacularName]
    const scientificName = value[Node.valuePropsTaxon.scientificName]

    if (taxonCode === Taxon.unlistedCode) {
      return {
        [Node.valuePropsTaxon.taxonUuid]: taxonUuid,
        [Node.valuePropsTaxon.scientificName]: scientificName,
        [Node.valuePropsTaxon.vernacularName]: vernacularName,
      }
    }
    const vernacularNameUuid = extractVernacularNameUuid({ vernacularName, nodeDef, taxonCode, survey })
    const nodeValue = Node.newNodeValueTaxon({ taxonUuid })
    if (vernacularNameUuid) {
      nodeValue[Node.valuePropsTaxon.vernacularNameUuid] = vernacularNameUuid
    }
    return nodeValue
  },
  [NodeDef.nodeDefType.text]: ({ value }) => {
    const val = singlePropValueConverter({ value })
    return val === null || val === undefined ? null : String(val)
  },
  [NodeDef.nodeDefType.time]: ({ value, headers }) =>
    extractDateOrTime({
      value,
      allowedFormats: allowedTimeFormats,
      formatTo: DateUtils.formats.timeStorage,
      headers,
      errorKey: 'validationErrors.dataImport.invalidTime',
    }),
}

const checkAllHeadersAreValid =
  ({ csvDataExportModel }) =>
  (headers) => {
    const { headers: possibleHeaders } = csvDataExportModel
    const invalidHeaders = headers.filter((header) => !possibleHeaders.includes(header))
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
 * Creates a reader that transforms every row extracting a node value for each column associated to a node definition.
 *
 * @param {!object} params - The parameters object.
 * @param {!string} [params.stream] - File stream to be read.
 * @param {!string} [params.fileFormat] - Format of the input file (csv or xlsx).
 * @param {!object} [params.survey] - The survey object.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!string} [params.nodeDefUuid] - The UUID of the node definition where data will be imported.
 * @param {!Function} [params.onRowItem] - Function invoked when a row is read.
 * @param {boolean} [params.includeAnalysis = false] - Whether to include analysis attributes or not.
 * @param {boolean} [params.validateHeaders = true] - Whether to validate input file headers or not.
 * @param {boolean} [params.includeFiles = false] - Whether to include file attributes or not.
 * @param {Function} [params.onTotalChange = null] - Function invoked when total number of rows is calculated.
 * @returns {object} - Object with start and cancel functions to control the reader.
 */
const createReaderFromStream = ({
  stream,
  fileFormat,
  survey,
  cycle,
  nodeDefUuid,
  onRowItem,
  onTotalChange,
  includeAnalysis = false,
  validateHeaders = true,
  includeFiles = false,
}) => {
  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const csvDataExportModel = new CsvDataExportModel({
    survey,
    cycle,
    nodeDefContext,
    options: {
      includeCategoryItemsLabels: false,
      includeFiles,
      includeAnalysis,
    },
  })

  return FlatDataReader.createReaderFromStream({
    stream,
    fileFormat,
    onHeaders: async (headers) => {
      if (validateHeaders) {
        await _validateHeaders({ csvDataExportModel })(headers)
      }
    },
    onRow: async (row) => {
      // combine several columns into single values for every attribute definition
      const valuesByDefUuidTemp = csvDataExportModel.columns.reduce((valuesByDefUuidAcc, column) => {
        const { header, nodeDef, valueProp = VALUE_PROP_DEFAULT } = column

        if (!Object.hasOwn(row, header)) return valuesByDefUuidAcc

        const cellValue = row[header]
        if (Objects.isEmpty(cellValue)) return valuesByDefUuidAcc

        const nodeDefUuid = NodeDef.getUuid(nodeDef)
        const valueTemp = valuesByDefUuidAcc[nodeDefUuid] ?? {}
        let valueHeaders = valueTemp._headers
        if (!valueHeaders) {
          valueHeaders = []
          valueTemp._headers = valueHeaders
        }
        valueHeaders.push(header)
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
          const nodeValue = Objects.isEmpty(valueTemp)
            ? null
            : valueConverter({ survey, nodeDef, value: valueTemp, headers })
          acc[nodeDefUuid] = nodeValue
        } catch (error) {
          errors.push(error)
        }
        return acc
      }, {})

      await onRowItem({ row, valuesByDefUuid, errors })
    },
    onTotalChange,
  })
}

export const DataImportFlatDataFileReader = {
  createReaderFromStream,
}
