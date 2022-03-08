import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as CSVReader from '@server/utils/file/csvReader'

export const createCSVDataImportReaderFromStream = async ({ stream, csvDataExportModel, onRowItem, onTotalChange }) => {
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

      await onRowItem({
        valuesByDefUuid,
      })
    },
    onTotalChange
  )
}
