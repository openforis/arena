const fs = require('fs')
const R = require('ramda')

const Category = require('@core/survey/category')
const CategoryImportSummary = require('@core/survey/categoryImportSummary')
const Validation = require('@core/validation/validation')
const StringUtils = require('@core/stringUtils')
const SystemError = require('@server/utils/systemError')

const CSVReader = require('@server/utils/file/csvReader')

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
  const columnNames = await CSVReader.readHeadersFromStream(stream)

  if (R.find(StringUtils.isBlank)(columnNames)) {
    throw new SystemError(Validation.messageKeys.categoryImport.emptyHeaderFound)
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
        throw new SystemError(Validation.messageKeys.categoryImport.columnMissing, { columnNameMissing })
      }
    }
  })

  if (!atLeastOneCodeColumn) {
    throw new SystemError(Validation.messageKeys.categoryImport.codeColumnMissing)
  }
}

module.exports = {
  createImportSummaryFromStream,
  createImportSummary,
}