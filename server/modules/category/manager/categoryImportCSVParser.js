import * as R from 'ramda'

import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as StringUtils from '@core/stringUtils'

import * as CSVReader from '@server/utils/file/csvReader'

export const createRowsReaderFromStream = async (stream, summary, onRowItem, onTotalChange) => {
  const columns = CategoryImportSummary.getColumns(summary)

  return CSVReader.createReaderFromStream(
    stream,
    null,
    async (row) => {
      const codes = []
      const extra = {}
      const labelsByLang = {}
      const descriptionsByLang = {}

      Object.entries(columns).forEach(([columnName, column]) => {
        const columnValue = row[columnName]

        if (CategoryImportSummary.isItemCode(column)) {
          codes.push(columnValue)
        } else if (StringUtils.isNotBlank(columnValue)) {
          if (CategoryImportSummary.isItemExtra(column)) {
            extra[columnName] = columnValue
          } else {
            // Label or description
            const lang = CategoryImportSummary.getItemLang(column)

            if (CategoryImportSummary.isItemLabel(column)) {
              labelsByLang[lang] = columnValue
            } else if (CategoryImportSummary.isItemDescription(column)) {
              descriptionsByLang[lang] = columnValue
            }
          }
        }
      })

      // Determine level
      const levelIndex = R.findLastIndex(StringUtils.isNotBlank)(codes)

      await onRowItem({
        levelIndex,
        codes: codes.slice(0, levelIndex + 1),
        labelsByLang,
        descriptionsByLang,
        extra,
      })
    },
    onTotalChange
  )
}
