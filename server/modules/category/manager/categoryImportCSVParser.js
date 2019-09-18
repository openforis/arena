const fs = require('fs')
const R = require('ramda')

const Category = require('../../../../common/survey/category')
const CategoryImportSummary = require('../../../../common/survey/categoryImportSummary')
const Validator = require('../../../../common/validation/validator')
const ObjectUtils = require('../../../../common/objectUtils')
const StringUtils = require('../../../../common/stringUtils')
const SystemError = require('../../../utils/systemError')

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

const createImportSummaryFromStream = async stream => {
  const columnNames = await _readHeaders(stream)

  if (R.find(StringUtils.isBlank)(columnNames)) {
    throw new SystemError(Validator.messageKeys.categoryImport.emptyHeaderFound)
  }

  const levelsByName = {}

  const getOrCreateLevel = (columnName, columnType) => {
    const columnProp = columnProps[columnType]
    if (columnProp) {
      const name = columnName.substr(0, columnName.length - columnProp.suffix.length - (columnProp.lang ? 3 : 0))

      let level = levelsByName[name]
      if (!level) {
        level = {
          name,
          index: Object.keys(levelsByName).length
        }
        levelsByName[name] = level
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

      const extraDataType = columnType === CategoryImportSummary.columnTypes.extra
        ? Category.itemExtraDefDataTypes.text
        : null

      const columnProp = columnProps[columnType]
      const language = columnProp && columnProp.lang
        ? columnName.substring(columnName.lastIndexOf('_') + 1)
        : null

      acc[columnName] = CategoryImportSummary.newColumn(columnType, level.name, level.index, language, extraDataType)

      return acc
    },
    {}
  )

  const summary = CategoryImportSummary.newSummary(columns)

  _validateSummary(summary)

  return summary
}

const createImportSummary = async filePath => ({
  ...await createImportSummaryFromStream(fs.createReadStream(filePath)),
  [CategoryImportSummary.keys.filePath]: filePath
})

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
        ([columnName, column], index) => {
          const columnValue = row[index]

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

const createRowsReader = async (summary, onRowItem, onTotalChange) =>
  await createRowsReaderFromStream(fs.createReadStream(CategoryImportSummary.getFilePath(summary)), summary, onRowItem, onTotalChange)

const _readHeaders = async stream => {
  let result = []

  const reader = CSVReader.createReaderFromStream(
    stream,
    headers => {
      reader.cancel()
      result = headers
    }
  )
  await reader.start()

  return result
}

const _validateSummary = summary => {
  const columns = CategoryImportSummary.getColumns(summary)

  let atLeastOneCodeColumn = false

  Object.entries(columns).forEach(([columnName, column]) => {
    if (CategoryImportSummary.isColumnCode(column)) {
      atLeastOneCodeColumn = true
    } else if (CategoryImportSummary.isColumnLabel(column) ||
      CategoryImportSummary.isColumnDescription(column)) {
      //if column is label or description, a code in the same level must be defined

      if (!CategoryImportSummary.hasColumn(CategoryImportSummary.columnTypes.code, CategoryImportSummary.getColumnLevelIndex(column))(summary)) {
        const levelName = CategoryImportSummary.getColumnLevelName(column)
        const columnNameMissing = `${levelName}${columnCodeSuffix}`
        throw new SystemError(Validator.messageKeys.categoryImport.columnMissing, { columnNameMissing })
      }
    }
  })

  if (!atLeastOneCodeColumn) {
    throw new SystemError(Validator.messageKeys.categoryImport.codeColumnMissing)
  }
}

module.exports = {
  createImportSummaryFromStream,
  createImportSummary,
  createRowsReaderFromStream,
  createRowsReader,
}