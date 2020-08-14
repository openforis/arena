import * as fs from 'fs'
import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'
import SystemError from '@core/systemError'

import * as CSVReader from '@server/utils/file/csvReader'

const columnProps = {
  [CategoryImportSummary.columnTypes.code]: { suffix: '_code', lang: false },
  [CategoryImportSummary.columnTypes.label]: { suffix: '_label', lang: true },
  [CategoryImportSummary.columnTypes.description]: {
    suffix: '_description',
    lang: true,
  },
}

const columnCodeSuffix = columnProps[CategoryImportSummary.columnTypes.code].suffix
const columnLabelSuffix = columnProps[CategoryImportSummary.columnTypes.label].suffix
const columnDescriptionSuffix = columnProps[CategoryImportSummary.columnTypes.description].suffix

const columnRegExpLabel = new RegExp(`^.*${columnLabelSuffix}(_[a-z]{2})?$`)
const columnRegExpDescription = new RegExp(`^.*${columnDescriptionSuffix}(_[a-z]{2})?$`)

export const createImportSummaryFromStream = async (stream) => {
  const columnNames = await CSVReader.readHeadersFromStream(stream)

  if (R.find(StringUtils.isBlank)(columnNames)) {
    throw new SystemError(Validation.messageKeys.categoryImport.emptyHeaderFound)
  }

  const levelsByName = {}

  const getOrCreateLevel = (columnName, columnType) => {
    const columnProp = columnProps[columnType]
    if (columnProp) {
      const name = columnName.slice(0, columnName.length - columnProp.suffix.length - (columnProp.lang ? 3 : 0))

      let level = levelsByName[name]
      if (!level) {
        level = {
          name,
          index: Object.keys(levelsByName).length,
        }
        levelsByName[name] = level
      }

      return level
    }

    return { name: null, index: -1 }
  }

  const getColumnTypeByName = (columnName) => {
    if (columnName.endsWith(columnCodeSuffix)) return CategoryImportSummary.columnTypes.code
    if (columnRegExpLabel.test(columnName)) return CategoryImportSummary.columnTypes.label
    if (columnRegExpDescription.test(columnName)) return CategoryImportSummary.columnTypes.description
    return CategoryImportSummary.columnTypes.extra
  }

  const columns = columnNames.reduce((acc, columnName) => {
    const columnType = getColumnTypeByName(columnName)

    const level = getOrCreateLevel(columnName, columnType)

    const extraDataType =
      columnType === CategoryImportSummary.columnTypes.extra ? Category.itemExtraDefDataTypes.text : null

    const columnProp = columnProps[columnType]
    const language = columnProp && columnProp.lang ? columnName.slice(columnName.lastIndexOf('_') + 1) : null

    acc[columnName] = CategoryImportSummary.newColumn(columnType, level.name, level.index, language, extraDataType)

    return acc
  }, {})

  const summary = CategoryImportSummary.newSummary(columns)

  _validateSummary(summary)

  return summary
}

export const createImportSummary = async (filePath) => ({
  ...(await createImportSummaryFromStream(fs.createReadStream(filePath))),
  [CategoryImportSummary.keys.filePath]: filePath,
})

const _validateSummary = (summary) => {
  const columns = CategoryImportSummary.getColumns(summary)

  let atLeastOneCodeColumn = false

  for (const column of Object.values(columns)) {
    if (CategoryImportSummary.isColumnCode(column)) {
      atLeastOneCodeColumn = true
    } else if (CategoryImportSummary.isColumnLabel(column) || CategoryImportSummary.isColumnDescription(column)) {
      // If column is label or description, a code in the same level must be defined

      if (
        !CategoryImportSummary.hasColumn(
          CategoryImportSummary.columnTypes.code,
          CategoryImportSummary.getColumnLevelIndex(column)
        )(summary)
      ) {
        const levelName = CategoryImportSummary.getColumnLevelName(column)
        const columnNameMissing = `${levelName}${columnCodeSuffix}`
        throw new SystemError(Validation.messageKeys.categoryImport.columnMissing, { columnNameMissing })
      }
    }
  }

  if (!atLeastOneCodeColumn) {
    throw new SystemError(Validation.messageKeys.categoryImport.codeColumnMissing)
  }
}
