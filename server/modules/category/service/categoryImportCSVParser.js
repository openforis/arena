const Category = require('../../../../common/survey/category')
const CategoryLevel = require('../../../../common/survey/categoryLevel')
const CategoryImport = require('../../../../common/survey/categoryImport')

const CSVReader = require('../../../utils/file/csvReader')

const columnSuffixes = {
  code: '_code',
  label: '_label',
  description: '_description',
}

const headerTypes = {
  itemCode: 'itemCode',
  itemLabel: 'itemLabel',
  itemDescription: 'itemDescription',
  extra: 'extra'
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
      },
      null,
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
        accLevelNames.push(header.substr(0, header.length - columnSuffixes.length))
      }
      return accLevelNames
    },
    []
  )

  const headersInfo = headers.reduce((acc, header) => {
    if (header.endsWith(columnSuffixes.code)) {
      const levelIndex = R.pipe(
        R.filter(R.endsWith(columnSuffixes.code)),
        R.indexOf(header)
      )(headers)

      acc[header] = CategoryImport.newHeaderInfo(type, levelIndex)
    } else if (columnRegExpLabel.test(header)) {
      const levelName = header.substr(0, columnSuffixes.label + 3)
      const levelIndex = levelNames.indexOf(levelName)

      acc[header] = CategoryImport.newHeaderInfo(headerTypes.itemLabel, levelIndex)
    } else if (columnRegExpDescription.test(header)) {
      const levelName = header.substr(0, columnSuffixes.description + 3)
      const levelIndex = levelNames.indexOf(levelName)

      acc[header] = CategoryImport.newHeaderInfo(headerTypes.itemDescription, levelIndex)
    } else {
      acc[header] = CategoryImport.newHeaderInfo(headerTypes.extra)
    }
    return acc
  })

  return {
    headersInfo,
    filePath
  }
}

module.exports = {
  createImportSummary
}