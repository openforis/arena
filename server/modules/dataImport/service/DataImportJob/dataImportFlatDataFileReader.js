import { FlatDataExportModel, Objects } from '@openforis/arena-core'

import SystemError from '@core/systemError'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { VALUE_PROP_DEFAULT, parseNodeValueProps } from '@core/record/nodeValueParser'

import * as FlatDataReader from '@server/utils/file/flatDataReader'

// kept for the existing time import tests
export { extractTimeValue } from '@core/record/nodeValueParser'

const checkAllHeadersAreValid =
  ({ csvDataExportModel }) =>
  (headers) => {
    const { headers: possibleHeaders } = csvDataExportModel
    const invalidHeaders = headers.filter((header) => !possibleHeaders.includes(header))
    if (invalidHeaders.length > 0) {
      throw new SystemError('validationErrors:dataImport.invalidHeaders', { invalidHeaders: invalidHeaders.join(', ') })
    }
  }

const checkRequiredHeadersNotMissing =
  ({ csvDataExportModel }) =>
  (headers) => {
    const requiredHeaders = csvDataExportModel.columns.filter((col) => col.key).map((col) => col.header)
    const missingRequiredHeaders = requiredHeaders.filter((header) => !headers.includes(header))
    if (missingRequiredHeaders.length > 0) {
      throw new SystemError('validationErrors:dataImport.missingRequiredHeaders', { missingRequiredHeaders })
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
 * @param {!object} params - The parameters object.
 * @param {!string} [params.stream] - File stream to be read.
 * @param {!string} [params.fileFormat] - Format of the input file (csv or xlsx).
 * @param {!object} [params.survey] - The survey object.
 * @param {!object} [params.categoryItemProvider] - The category item provider module.
 * @param {!object} [params.taxonProvider] - The taxon provider module.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!string} [params.nodeDefUuid] - The UUID of the node definition where data will be imported.
 * @param {!Function} [params.onRowItem] - Function invoked when a row is read.
 * @param {boolean} [params.includeAnalysis] - Whether to include analysis attributes or not.
 * @param {boolean} [params.validateHeaders] - Whether to validate input file headers or not.
 * @param {boolean} [params.includeFiles] - Whether to include file attributes or not.
 * @param {Function} [params.onTotalChange] - Function invoked when total number of rows is calculated.
 * @returns {object} - Object with start and cancel functions to control the reader.
 */
const createReaderFromStream = ({
  stream,
  fileFormat,
  survey,
  categoryItemProvider,
  taxonProvider,
  cycle,
  nodeDefUuid,
  onRowItem,
  onTotalChange,
  includeAnalysis = false,
  validateHeaders = true,
  includeFiles = false,
}) => {
  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const csvDataExportModel = new FlatDataExportModel({
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
      const valuesByDefUuidTemp = {}
      for (const column of csvDataExportModel.columns) {
        const { header, nodeDef, valueProp = VALUE_PROP_DEFAULT } = column

        if (!Object.hasOwn(row, header)) continue

        const cellValue = row[header]
        if (Objects.isEmpty(cellValue)) continue

        const nodeDefUuid = NodeDef.getUuid(nodeDef)
        const valueTemp = valuesByDefUuidTemp[nodeDefUuid] ?? {}
        let valueHeaders = valueTemp._headers
        if (!valueHeaders) {
          valueHeaders = []
          valueTemp._headers = valueHeaders
        }
        valueHeaders.push(header)
        valueTemp[valueProp] = cellValue
        valuesByDefUuidTemp[nodeDefUuid] = valueTemp
      }

      // prepare attribute values
      const errors = []
      const valuesByDefUuid = {}
      const refDataByDefUuid = {}
      for (const [nodeDefUuid, valueTemp] of Object.entries(valuesByDefUuidTemp)) {
        const headers = valueTemp._headers
        delete valueTemp._headers
        const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
        try {
          const { value: nodeValue, refData } = Objects.isEmpty(valueTemp)
            ? { value: null, refData: null }
            : await parseNodeValueProps({
                survey,
                nodeDef,
                valueProps: valueTemp,
                headers,
                categoryItemProvider,
                taxonProvider,
              })
          valuesByDefUuid[nodeDefUuid] = nodeValue
          refDataByDefUuid[nodeDefUuid] = refData
        } catch (error) {
          errors.push(error)
        }
      }
      await onRowItem({ row, valuesByDefUuid, refDataByDefUuid, errors })
    },
    onTotalChange,
  })
}

export const DataImportFlatDataFileReader = {
  createReaderFromStream,
}
