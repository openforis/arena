const R = require('ramda')

const CategoryImportSummary = require('../../../../common/survey/categoryImportSummary')
const ValidatorErrorKeys = require('../../../../common/validation/validatorErrorKeys')
const StringUtils = require('../../../../common/stringUtils')

const CSVReader = require('../../../utils/file/csvReader')

const columnProps = {
  [CategoryImportSummary.columnTypes.code]: { suffix: '_code', lang: false },
  [CategoryImportSummary.columnTypes.label]: { suffix: '_label', lang: true },
  [CategoryImportSummary.columnTypes.description]: { suffix: '_description', lang: true },
}

const columnCodeSuffix = columnProps[CategoryImportSummary.columnTypes.code].suffix
const columnLabelSuffix = columnProps[CategoryImportSummary.columnTypes.label].suffix
const columnDescriptionSuffix = columnProps[CategoryImportSummary.columnTypes.description].suffix

const columnRegExpLabel = new RegExp(`^.*${columnLabelSuffix}(_[a-z]{2})?$`)
const columnRegExpDescription = new RegExp(`^.*${columnDescriptionSuffix}(_[a-z]{2})?$`)

const _readHeaders = filePath => new Promise((resolve, reject) => {
  try {
    const reader = CSVReader.createReader(
      filePath,
      headers => {
        reader.cancel()
        resolve(headers)
      },
    )

    reader.start()
  } catch (error) {
    reject(error)
  }
})

const createImportSummary = async (filePath) => {
  //clean category levels
  const columnNames = await _readHeaders(filePath)

  if (R.find(StringUtils.isBlank)(columnNames)) {
    throw new Error(ValidatorErrorKeys.categoryImport.emptyHeaderFound)
  }

  const levelByNames = {}

  const getOrCreateLevel = (columnName, columnType) => {
    const columnProp = columnProps[columnType]
    if (columnProp) {
      const name = columnName.substr(0, columnName.length - columnProp.suffix.length - columnProp.lang ? 3 : 0)

      let level = levelByNames[name]
      if (!level) {
        level = { name, index: Object.keys(levelByNames).length }
        levelByNames[name] = level
      }
      return level
    } else {
      return { name: null, index: -1 }
    }
  }

  const columns = columnNames.reduce(
    (acc, columnName) => {

      const columnType = columnName.endsWith(columnCodeSuffix)
        ? CategoryImportSummary.columnTypes.code
        : columnRegExpLabel.test(columnName)
          ? CategoryImportSummary.columnTypes.label
          : columnRegExpDescription.test(columnName)
            ? CategoryImportSummary.columnTypes.description
            : CategoryImportSummary.columnTypes.extra

      const level = getOrCreateLevel(columnName, columnType)

      acc[columnName] = CategoryImportSummary.newColumn(columnType, level.name, level.index)

      return acc
    },
    {}
  )

  return CategoryImportSummary.newSummary(columns, filePath)
}

const createRowsReader = async (summary, onRowItem, onTotalChange) => {
  const columns = CategoryImportSummary.getColumns(summary)

  return CSVReader.createReader(
    CategoryImportSummary.getFilePath(summary),
    null,
    async row => {

      const codes = []
      const extra = {}
      const labels = {}
      const descriptions = {}

      Object.entries(columns).forEach(
        ([columnName, column], index) => {
          const columnValue = row[index]

          if (CategoryImportSummary.isColumnCode(column)) {
            codes.push(columnValue)
          } else if (CategoryImportSummary.isColumnExtra(column)) {
            if (StringUtils.isNotBlank(columnValue))
              extra[columnName] = columnValue
          } else {
            // label or description
            const lang = columnName.substring(columnName.lastIndexOf('_') + 1)
            if (CategoryImportSummary.isColumnLabel(column))
              labels[lang] = columnValue
            else if (CategoryImportSummary.isColumnDescription(column))
              descriptions[lang] = columnValue
          }
        }
      )

      // determine level
      const levelIndexDeeper = R.findLastIndex(StringUtils.isNotBlank)(codes)

      await onRowItem({
        levelIndexDeeper,
        codes: codes.slice(0, levelIndexDeeper + 1),
        labels,
        descriptions,
        extra
      })
    },
    onTotalChange
  )
}

module.exports = {
  createImportSummary,
  createRowsReader
}