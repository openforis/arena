import * as NodeDef from '@core/survey/nodeDef'

import * as CSVReader from '@server/utils/file/csvReader'

const createReader = async ({ stream, csvDataExportModel, onRowItem, onTotalChange }) => {
  return CSVReader.createReaderFromStream(
    stream,
    null,
    async (row) => {
      const valuesByDefUuid = {}

      csvDataExportModel.columns.forEach((column) => {
        const { header, nodeDef } = column
        const nodeDefUuid = NodeDef.getUuid(nodeDef)
        const value = row[header]

        valuesByDefUuid[nodeDefUuid] = value
      })

      await onRowItem({ valuesByDefUuid })
    },
    onTotalChange
  )
}

export const DataImportFileReader = {
  createReader,
}
