import * as fs from 'fs'
import * as R from 'ramda'

import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'
import SystemError from '@core/systemError'

import * as CSVReader from '@server/utils/file/csvReader'

const columnProps = {
  [CategoryImportSummary.itemTypes.code]: { suffix: '_code', lang: false },
  [CategoryImportSummary.itemTypes.label]: { preffix: 'label', lang: true },
  [CategoryImportSummary.itemTypes.description]: { preffix: 'description', lang: true },
}

const locationColumnsSuffixes = ['_x', '_y', '_srs']

// TODO remove code from here if needed // categories export

const columnPatternsDefault = Object.entries(columnProps).reduce((columnPatterns, [columnType, columnProp]) => {
  // columns will be like level_name_code, level_name_label, level_name_label_en, level_name_description, level_name_description_en
  // the language suffix is optional
  const langSuffixPattern = columnProp.lang ? `(_([a-z]{2}))?` : ''
  const pattern = new RegExp(
    `${columnProp.preffix ? columnProp.preffix : `^(.*)${columnProp.suffix}`}${langSuffixPattern}$`
  )
  return {
    ...columnPatterns,
    [columnType]: pattern,
  }
}, {})

// column name ends with x, y or srs and there are other columns with the other prefixes
const _getGeometryPointTypeItemName = ({ columnName }) => {
  const locationColSuffix = locationColumnsSuffixes.find((suffix) => columnName.endsWith(suffix))
  if (locationColSuffix) {
    return columnName.substring(0, columnName.length - locationColSuffix.length)
  }
  return null
}

const _getGeometryPointTypeColumnNames = ({ itemName }) => locationColumnsSuffixes.map((suffix) => itemName + suffix)

const _isGeometryPointType = ({ columnName, columnNames }) => {
  const locationColSuffix = locationColumnsSuffixes.find((suffix) => columnName.endsWith(suffix))
  if (locationColSuffix) {
    const itemName = _getGeometryPointTypeItemName({ columnName })
    const locationColumnNames = _getGeometryPointTypeColumnNames({ itemName })
    return locationColumnNames.every((colName) => columnNames.includes(colName))
  }
  return false
}

const _extractColumnTypeByName = ({ columnName, columnPatterns, ignoreLabelsAndDescriptions = false }) => {
  // try to find column type by matching one of the column patterns
  const columnType = Object.keys(columnPatterns).find((type) => columnPatterns[type].test(columnName))

  // columns not matching any of the predefined patterns will be considered of type extra
  return columnType && (!ignoreLabelsAndDescriptions || columnType === CategoryImportSummary.itemTypes.code)
    ? columnType
    : CategoryImportSummary.itemTypes.extra
}

const _extractLevelName = ({ columnPatterns, columnName, columnType }) => {
  const pattern = columnPatterns[columnType]
  const match = columnName.match(pattern)
  return match[1]
}

const _extractLang = ({ columnPatterns, columnName, columnType }) => {
  const pattern = columnPatterns[columnType]
  const match = columnName.match(pattern)
  return match[2]
}

const _validateSummary = (summary) => {
  const items = CategoryImportSummary.getItems(summary)
  const atLeastOneCodeColumn = items.some(CategoryImportSummary.isItemCode)
  if (!atLeastOneCodeColumn) {
    throw new SystemError(Validation.messageKeys.categoryImport.codeColumnMissing)
  }
}

export const createImportSummaryFromColumnNames = ({
  columnNames,
  codeColumnPattern = null,
  ignoreLabelsAndDescriptions = false,
}) => {
  if (R.find(StringUtils.isBlank)(columnNames)) {
    throw new SystemError(Validation.messageKeys.categoryImport.emptyHeaderFound)
  }

  // if a codeColumnPattern is specified, use it to test if a column is of type code
  const columnPatterns = { ...columnPatternsDefault }
  if (codeColumnPattern) {
    columnPatterns[CategoryImportSummary.itemTypes.code] = codeColumnPattern
  }

  const levelsByName = {}

  const getOrCreateLevel = ({ columnName, columnType }) => {
    const columnProp = columnProps[columnType]
    if (columnProp && columnType === CategoryImportSummary.itemTypes.code) {
      const levelName = _extractLevelName({ columnPatterns, columnName, columnType })
      let level = levelsByName[levelName]
      if (!level) {
        level = { name: levelName, index: Object.keys(levelsByName).length }
        levelsByName[levelName] = level
      }
      return level
    }

    return { name: null, index: -1 }
  }

  let someExtraWasCreated = false // once an 'extra' info column is found, all other columns will be considered as extra

  const items = columnNames.reduce((acc, columnName) => {
    const isGeometryPointType = _isGeometryPointType({ columnName, columnNames })

    const columnType =
      someExtraWasCreated || isGeometryPointType
        ? CategoryImportSummary.itemTypes.extra
        : _extractColumnTypeByName({ columnName, columnPatterns, ignoreLabelsAndDescriptions })

    const extra = columnType === CategoryImportSummary.itemTypes.extra

    if (extra && !someExtraWasCreated) someExtraWasCreated = true

    const level = getOrCreateLevel({ columnName, columnType })
    const { name: levelName, index: levelIndex } = level

    const dataType = extra
      ? isGeometryPointType
        ? ExtraPropDef.dataTypes.geometryPoint
        : ExtraPropDef.dataTypes.text
      : null

    const key = isGeometryPointType ? _getGeometryPointTypeItemName({ columnName }) : columnName

    if (acc.find((itm) => CategoryImportSummary.getItemKey(itm) === key)) {
      // item already generated (e.g. geometry point)
      return acc
    }

    const itemColumnNames = isGeometryPointType ? _getGeometryPointTypeColumnNames({ itemName: key }) : [columnName]
    const lang = extra ? null : _extractLang({ columnPatterns, columnName, columnType })

    const item = CategoryImportSummary.newItem({
      key,
      columns: itemColumnNames,
      type: columnType,
      levelName,
      levelIndex,
      lang,
      dataType,
      dataTypeReadOnly: isGeometryPointType,
    })

    acc.push(item)
    return acc
  }, [])

  const summary = CategoryImportSummary.newSummary({ items })

  _validateSummary(summary)

  return summary
}

export const createImportSummaryFromStream = async ({
  stream,
  codeColumnPattern = null,
  ignoreLabelsAndDescriptions = false,
}) => {
  const columnNames = await CSVReader.readHeadersFromStream(stream)
  return createImportSummaryFromColumnNames({ columnNames, codeColumnPattern, ignoreLabelsAndDescriptions })
}

export const createImportSummary = async (filePath) => ({
  ...(await createImportSummaryFromStream({ stream: fs.createReadStream(filePath) })),
  [CategoryImportSummary.keys.filePath]: filePath,
})
