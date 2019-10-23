const R = require('ramda')

const CategoryImportSummary = require('../../../../core/survey/categoryImportSummary')
const ObjectUtils = require('../../../../core/objectUtils')
const StringUtils = require('../../../../core/stringUtils')

const CSVReader = require('../../../utils/file/csvReader')

const createRowsReaderFromStream = async (stream, summary, onRowItem, onTotalChange) => {
  const columns = CategoryImportSummary.getColumns(summary)

  return CSVReader.createReaderFromStream(
    stream,
    null,
    async row => {

      const codes = []
      const extra = {}
      const labelsByLevel = {}
      const descriptionsByLevel = {}

      Object.entries(columns).forEach(
        ([columnName, column]) => {
          const columnValue = row[columnName]

          if (CategoryImportSummary.isColumnCode(column)) {
            codes.push(columnValue)
          } else if (StringUtils.isNotBlank(columnValue)) {
            if (CategoryImportSummary.isColumnExtra(column)) {
              extra[columnName] = columnValue
            } else {
              // label or description
              const lang = CategoryImportSummary.getColumnLang(column)
              const levelName = CategoryImportSummary.getColumnLevelName(column)

              if (CategoryImportSummary.isColumnLabel(column))
                ObjectUtils.setInPath([levelName, lang], columnValue)(labelsByLevel)
              else if (CategoryImportSummary.isColumnDescription(column))
                ObjectUtils.setInPath([levelName, lang], columnValue)(descriptionsByLevel)
            }
          }
        }
      )

      // determine level
      const levelIndex = R.findLastIndex(StringUtils.isNotBlank)(codes)

      await onRowItem({
        levelIndex,
        codes: codes.slice(0, levelIndex + 1),
        labelsByLevel,
        descriptionsByLevel,
        extra
      })
    },
    onTotalChange
  )
}

module.exports = {
  createRowsReaderFromStream,
}