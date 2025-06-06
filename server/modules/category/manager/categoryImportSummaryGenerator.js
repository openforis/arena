import * as fs from 'fs'
import * as R from 'ramda'

import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'
import SystemError from '@core/systemError'

import * as FlatDataReader from '@server/utils/file/flatDataReader'
import { Strings } from '@openforis/arena-core'

const defaultLevelName = 'level_1'

const columnProps = {
  [CategoryImportSummary.itemTypes.code]: { pattern: '(?:code|(.*)_code)', lang: false },
  [CategoryImportSummary.itemTypes.label]: { prefix: 'label', lang: true },
  [CategoryImportSummary.itemTypes.description]: { prefix: 'description', lang: true },
}

const locationColumnsSuffixes = ['_x', '_y', '_srs']

// TODO remove code from here if needed // categories export

const columnPatternsDefault = Object.entries(columnProps).reduce((columnPatterns, [columnType, columnProp]) => {
  // columns will be like code (or level_name_code in case of hierarchical categories), label, label_en, description, description_en
  // the language suffix is optional
  const langSuffixPattern = columnProp.lang ? `(_([a-z]{2}))?` : ''
  const prefix = Strings.defaultIfEmpty('')(columnProp.prefix)
  const internalPattern = Strings.defaultIfEmpty('')(columnProp.pattern)
  const pattern = new RegExp(`^${prefix}${internalPattern}${langSuffixPattern}$`)
  return {
    ...columnPatterns,
    [columnType]: pattern,
  }
}, {})

// column name ends with x, y or srs and there are other columns with the other prefixes
const _getGeometryPointTypeItemName = ({ columnName }) => {
  const locationColSuffix = locationColumnsSuffixes.find((suffix) => columnName.endsWith(suffix))
  if (locationColSuffix) {
    return StringUtils.removeSuffix(locationColSuffix)(columnName)
  }
  return null
}

const _getGeometryPointTypeColumnNames = ({ itemName }) => locationColumnsSuffixes.map((suffix) => itemName + suffix)

const _isGeometryPointType = ({ columnName, columnNames }) => {
  const locationColSuffix = locationColumnsSuffixes.find((suffix) => columnName.endsWith(suffix))
  if (!locationColSuffix) {
    return false
  }
  const itemName = _getGeometryPointTypeItemName({ columnName })
  const locationColumnNames = _getGeometryPointTypeColumnNames({ itemName })
  return locationColumnNames.every((colName) => columnNames.includes(colName))
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
  return match[1] || defaultLevelName
}

const _extractLang = ({ columnPatterns, columnName, columnType, defaultLang }) => {
  const pattern = columnPatterns[columnType]
  const match = columnName.match(pattern)
  const lang = match[2]
  return lang || defaultLang
}

const _validateSummary = (summary) => {
  const items = CategoryImportSummary.getItems(summary)
  const atLeastOneCodeColumn = items.some(CategoryImportSummary.isItemCode)
  if (!atLeastOneCodeColumn) {
    throw new SystemError(Validation.messageKeys.categoryImport.codeColumnMissing)
  }
}

const _determineDataType = ({ isExtra, isGeometryPointType }) => {
  if (!isExtra) return null

  return isGeometryPointType ? ExtraPropDef.dataTypes.geometryPoint : ExtraPropDef.dataTypes.text
}

export const createImportSummaryFromColumnNames = ({
  columnNames,
  defaultLang,
  rowsCount = 0,
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

    const isExtra = columnType === CategoryImportSummary.itemTypes.extra

    if (isExtra && !someExtraWasCreated) someExtraWasCreated = true

    const level = getOrCreateLevel({ columnName, columnType })
    const { name: levelName, index: levelIndex } = level

    const dataType = _determineDataType({ isExtra, isGeometryPointType })

    const key = StringUtils.normalizeName(
      isGeometryPointType ? _getGeometryPointTypeItemName({ columnName }) : columnName
    )

    if (acc.find((itm) => CategoryImportSummary.getItemKey(itm) === key)) {
      // item already generated (e.g. geometry point)
      return acc
    }

    const itemColumnNames = isGeometryPointType ? _getGeometryPointTypeColumnNames({ itemName: key }) : [columnName]
    const lang = isExtra ? null : _extractLang({ columnPatterns, columnName, columnType, defaultLang })

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

  const summary = CategoryImportSummary.newSummary({ items, rowsCount })

  _validateSummary(summary)

  return summary
}

export const createImportSummaryFromStream = async ({
  stream,
  fileFormat,
  defaultLang,
  codeColumnPattern = null,
  ignoreLabelsAndDescriptions = false,
}) => {
  let columnNames = []
  let rowsCount = 0
  const reader = FlatDataReader.createReaderFromStream({
    stream,
    fileFormat,
    onHeaders: (headers) => (columnNames = headers),
    onTotalChange: (total) => (rowsCount = total),
  })
  await reader.start()
  const summary = createImportSummaryFromColumnNames({
    columnNames,
    defaultLang,
    rowsCount,
    codeColumnPattern,
    ignoreLabelsAndDescriptions,
  })
  return CategoryImportSummary.assocFileFormat(fileFormat)(summary)
}

export const createImportSummary = async ({ filePath, fileFormat, defaultLang }) => {
  const summary = await createImportSummaryFromStream({
    stream: fs.createReadStream(filePath),
    fileFormat,
    defaultLang,
  })
  return {
    ...summary,
    [CategoryImportSummary.keys.filePath]: filePath,
  }
}
