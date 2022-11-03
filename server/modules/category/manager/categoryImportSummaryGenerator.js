import * as fs from 'fs'
import * as R from 'ramda'

import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'
import SystemError from '@core/systemError'

import * as CSVReader from '@server/utils/file/csvReader'

const columnProps = {
  [CategoryImportSummary.columnTypes.code]: { suffix: '_code', lang: false },
  [CategoryImportSummary.columnTypes.label]: { preffix: 'label', lang: true },
  [CategoryImportSummary.columnTypes.description]: { preffix: 'description', lang: true },
}

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

const _extractColumnTypeByName = ({ columnName, columnPatterns, ignoreLabelsAndDescriptions = false }) => {
  // try to find column type by matching one of the column patterns
  const columnType = Object.keys(columnPatterns).find((type) => columnPatterns[type].test(columnName))

  // columns not matching any of the predefined patterns will be considered of type extra
  return columnType && (!ignoreLabelsAndDescriptions || columnType === CategoryImportSummary.columnTypes.code)
    ? columnType
    : CategoryImportSummary.columnTypes.extra
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
  const columns = CategoryImportSummary.getColumns(summary)
  const atLeastOneCodeColumn = Object.values(columns).some((column) => CategoryImportSummary.isColumnCode(column))
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
    columnPatterns[CategoryImportSummary.columnTypes.code] = codeColumnPattern
  }

  const levelsByName = {}

  const getOrCreateLevel = ({ columnName, columnType }) => {
    const columnProp = columnProps[columnType]
    if (columnProp && columnType === CategoryImportSummary.columnTypes.code) {
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

  let someExtraWasCreated = false
  const columns = columnNames.reduce((acc, columnName) => {
    const columnType = someExtraWasCreated
      ? CategoryImportSummary.columnTypes.extra
      : _extractColumnTypeByName({ columnName, columnPatterns, ignoreLabelsAndDescriptions })
    const extra = columnType === CategoryImportSummary.columnTypes.extra
    if (extra && !someExtraWasCreated) someExtraWasCreated = true

    const level = getOrCreateLevel({ columnName, columnType })
    const { name: levelName, index: levelIndex } = level

    const dataType = extra ? ExtraPropDef.dataTypes.text : null

    const lang = extra ? null : _extractLang({ columnPatterns, columnName, columnType })

    const column = CategoryImportSummary.newColumn({ type: columnType, levelName, levelIndex, lang, dataType })
    return { ...acc, [columnName]: column }
  }, {})

  const summary = CategoryImportSummary.newSummary({ columns })

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
