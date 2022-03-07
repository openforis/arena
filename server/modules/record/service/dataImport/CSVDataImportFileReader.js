import * as NodeDef from '@core/survey/nodeDef'

import * as CSVReader from '@server/utils/file/csvReader'

export const createCSVDataImportReaderFromStream = async ({ stream, csvDataExportModel, onRowItem, onTotalChange }) => {
  return CSVReader.createReaderFromStream(
    stream,
    null,
    async (row) => {
      const ancestorsKeyValuesByAncestorDefUuid = {}
      const valuesByAttributeDefUuid = {}

      csvDataExportModel.columns.forEach((column) => {
        const { header, nodeDef, parentDef } = column
        const nodeDefUuid = NodeDef.getUuid(nodeDef)
        const value = row[header]

        if (nodeDef) {
          if (NodeDef.isKey(nodeDef)) {
            // ancestor key
            const ancestorDefUuid = NodeDef.getUuid(parentDef)
            ancestorsKeyValuesByAncestorDefUuid[ancestorDefUuid] = {
              ...(ancestorsKeyValuesByAncestorDefUuid[ancestorDefUuid] || {}),
              [nodeDefUuid]: value,
            }
          } else {
            valuesByAttributeDefUuid[nodeDefUuid] = value
          }
        }
      })

      await onRowItem({
        ancestorsKeyValuesByAncestorDefUuid,
        valuesByAttributeDefUuid,
      })
    },
    onTotalChange
  )
}
