const R = require('ramda')

const CategoryLevel = require('../../../../common/survey/categoryLevel')
const CategoryImportSummary = require('../../../../common/survey/categoryImportSummary')
const StringUtils = require('../../../../common/stringUtils')

const CSVReader = require('../../../utils/file/csvReader')

const columnSuffixes = {
  code: '_code',
  label: '_label',
  description: '_description',
}

const columnRegExpLabel = new RegExp(`^.*${columnSuffixes.label}(_[a-z]{2})?$`)
const columnRegExpDescription = new RegExp(`^.*${columnSuffixes.description}(_[a-z]{2})?$`)

const _readHeaders = filePath => new Promise((resolve, reject) => {
  try {
    const reader = CSVReader.createReader(
      filePath,
      headers => {
        reader.cancel()
        resolve(headers)
      }
    )

    reader.start()
  } catch (error) {
    reject(error)
  }
})

const createImportSummary = async (filePath) => {
  //clean category levels
  const headers = await _readHeaders(filePath)

  const levelNames = headers.reduce(
    (accLevelNames, header) => {
      if (header.endsWith(columnSuffixes.code)) {
        accLevelNames.push(header.substr(0, header.length - columnSuffixes.code.length))
      }
      return accLevelNames
    },
    []
  )

  const headersInfo = headers.reduce(
    (acc, header) => {
      if (header.endsWith(columnSuffixes.code)) {
        const levelIndex = R.pipe(
          R.filter(R.endsWith(columnSuffixes.code)),
          R.indexOf(header)
        )(headers)

        const levelName = header.substr(0, header.length - columnSuffixes.code.length)

        acc[header] = CategoryImportSummary.newHeader(CategoryImportSummary.headerTypes.itemCode, levelName, levelIndex)
      } else if (columnRegExpLabel.test(header)) {
        const levelName = header.substr(0, header.length - (columnSuffixes.label.length + 3))
        const levelIndex = levelNames.indexOf(levelName)

        acc[header] = CategoryImportSummary.newHeader(CategoryImportSummary.headerTypes.itemLabel, levelName, levelIndex)
      } else if (columnRegExpDescription.test(header)) {
        const levelName = header.substr(0, header.length - (columnSuffixes.description.length + 3))
        const levelIndex = levelNames.indexOf(levelName)

        acc[header] = CategoryImportSummary.newHeader(CategoryImportSummary.headerTypes.itemDescription, levelName, levelIndex)
      } else {
        const levelName = levelNames[0]
        acc[header] = CategoryImportSummary.newHeader(CategoryImportSummary.headerTypes.extra, levelName)
      }
      return acc
    },
    {}
  )

  return CategoryImportSummary.newSummary(headersInfo, filePath)
}

const createRowsReader = async (summary, levels, languages, onRowItem, onTotalChange) => {
  const headers = CategoryImportSummary.getHeaders(summary)

  return CSVReader.createReader(
    CategoryImportSummary.getFilePath(summary),
    null,
    async data => {
      // extract codes and extra props
      const codes = []
      const extra = {}

      Object.keys(headers).forEach(
        (headerName, index) => {
          const header = headers[headerName]
          if (CategoryImportSummary.getHeaderType(header) === CategoryImportSummary.headerTypes.itemCode) {
            codes.push(data[index])
          } else if (CategoryImportSummary.getHeaderType(header) === CategoryImportSummary.headerTypes.extra) {
            const value = data[index]
            if (StringUtils.isNotBlank(value))
              extra[headerName] = value
          }
        }
      )

      // determine level
      const levelIndexDeeper = R.findLastIndex(StringUtils.isNotBlank)(codes)

      // extract labels and descriptions

      // extracts labels and descriptions
      const labels = _extractLabels(levels, languages, headers, columnSuffixes.label, data)
      const descriptions = _extractLabels(levels, languages, headers, columnSuffixes.description, data)

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

const _extractLabels = (levels, languages, headers, columnSuffix, data) =>
  levels.reduce(
    (accLabelsByLevel, level, levelIndex) => {
      const levelName = CategoryLevel.getName(levels[levelIndex])
      const labels = languages.reduce((accLabelsByLang, lang) => {
          const headerName = `${levelName}${columnSuffix}_${lang}`
          const headerIndex = Object.keys(headers).indexOf(headerName)
          if (headerIndex >= 0) {
            const value = data[headerIndex]
            if (StringUtils.isNotBlank(value))
              accLabelsByLang[lang] = value
          }
          return accLabelsByLang
        },
        {}
      )
      accLabelsByLevel.push(labels)
      return accLabelsByLevel
    },
    []
  )

module.exports = {
  createImportSummary,
  createRowsReader
}