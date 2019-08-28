const R = require('ramda')

const Job = require('../../../job/job')
const CSVParser = require('../../../utils/file/csvParser')
const CSVReader = require('../../../utils/file/csvReader')

const Survey = require('../../../../common/survey/survey')
const Category = require('../../../../common/survey/category')
const CategoryLevel = require('../../../../common/survey/categoryLevel')
const CategoryItem = require('../../../../common/survey/categoryItem')
const StringUtils = require('../../../../common/stringUtils')

const CategoryManager = require('../manager/categoryManager')
const SurveyManager = require('../../survey/manager/surveyManager')

const columnSuffixes = {
  code: '_code',
  label: '_label',
  description: '_description',
}

const columnRegExpLabel = new RegExp(`^.*${columnSuffixes.label}(_[a-z]{2})?$`)
const columnRegExpDescription = new RegExp(`^.*${columnSuffixes.description}(_[a-z]{2})?$`)

class CategoryImportJob extends Job {

  constructor (params) {
    super(CategoryImportJob.type, params)

    const { filePath } = params

    this.csvParser = new CSVParser(filePath)

    this.itemExtraDef = {} // category item extra props def
    this.itemUuidByAncestorCodes = [] // cache of category items by ancestor codes
  }

  async execute () {
    const reader = CSVReader.createReader(
      this.params.filePath,
      (headers) => {},
      (data) => {
        return new Promise(resolve => {
          if (this.isCanceled()) {
            reader.cancel()
            return
          }
          setTimeout(() => {
            this.incrementProcessedItems()
            return resolve()
          }, 100)
        })
      },
      (total) => {
        this.total = total
      })

    await reader.start()

    /*    const { categoryUuid } = this.params

        await this.csvParser.init()

        this.total = await this.csvParser.calculateSize()
        this.logDebug(`total size: ${this.total}`)

        const surveyId = this.getSurveyId()

        await CategoryManager.deleteLevelsByCategory(this.getUser(), surveyId, categoryUuid, this.tx)

        this.category = await CategoryManager.fetchCategoryByUuid(surveyId, categoryUuid, true, false, this.tx)

        await this._insertLevelsAndExtraPropsDef()

        await this._insertItems()*/
  }

  async _insertLevelsAndExtraPropsDef () {
    const headers = this.csvParser.headers

    const itemExtraDef = {}

    for (const header of headers) {
      this.logDebug(`reading header '${header}'`)
      if (header.endsWith(columnSuffixes.code)) {
        // identify level name
        const levelName = header.substr(0, header.length - 5)
        // insert new level
        const level = Category.newLevel(this.category, { [CategoryLevel.props.name]: levelName })
        const levelInserted = await CategoryManager.insertLevel(this.getUser(), this.getSurveyId(), Category.getUuid(this.category), level, this.tx)
        this.category = Category.assocLevel(levelInserted)(this.category)
        this.logDebug(`inserted level ${levelName}`)
      } else if (!(
        columnRegExpLabel.test(header) || // label
        columnRegExpDescription.test(header) // description
      )) {
        this.logDebug(`extra prop: ${header}`)
        // column header is not related to a label or description, it will be considered as an "extra" prop
        itemExtraDef[header] = { type: 'text' }
      }
    }

    this.itemExtraDef = itemExtraDef

    if (!R.isEmpty(itemExtraDef)) {
      this.logDebug(`updating item extra def: ${JSON.stringify(itemExtraDef)}`)
      await CategoryManager.updateCategoryProp(this.getUser(), this.getSurveyId(), Category.getUuid(this.category),
        Category.props.itemExtraDef, itemExtraDef, this.tx)
    }
  }

  async _insertItems () {
    const survey = await SurveyManager.fetchSurveyById(this.getSurveyId(), true, false, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const languages = Survey.getLanguages(surveyInfo)

    const levels = Category.getLevelsArray(this.category)

    let row = await this.csvParser.next()
    while (row !== null) {
      await this._insertItem(levels, languages, row)
      this.incrementProcessedItems()
      row = await this.csvParser.next()
    }
  }

  async _insertItem (levels, languages, row) {
    // determine ancestor codes and last level
    const ancestorCodes = []
    let lastLevel,
      lastLevelCodeValue

    for (const level of levels) {
      const levelName = CategoryLevel.getName(level)
      const codeValue = row[`${levelName}${columnSuffixes.code}`]

      if (StringUtils.isNotBlank(codeValue)) {
        ancestorCodes.push(codeValue)
        lastLevelCodeValue = codeValue
        lastLevel = level
      } else {
        break
      }
    }

    // check if duplicate
    if (this.itemUuidByAncestorCodes[ancestorCodes]) {
      // TODO duplicate code, add error
    }

    // get parent item uuid
    const parentItemUuid = CategoryLevel.getIndex(lastLevel) === 0
      ? null
      : this.itemUuidByAncestorCodes[ancestorCodes.slice(0, ancestorCodes.length - 1)]

    const extractLabels = columnSuffix => {
      const labelsReducer = (acc, lang) => {
        const value = row[`${CategoryLevel.getName(lastLevel)}${columnSuffix}_${lang}`]
        if (StringUtils.isNotBlank(value))
          acc[lang] = value
        return acc
      }
      return languages.reduce(labelsReducer, {})
    }

    // extracts labels and descriptions
    const labels = extractLabels(columnSuffixes.label)
    const descriptions = extractLabels(columnSuffixes.description)

    // extract extra props
    const extraProps = R.pipe(
      R.keys,
      R.reduce((acc, extraPropName) => {
        const value = row[extraPropName]
        if (StringUtils.isNotBlank(value))
          acc[extraPropName] = value

        return acc
      })
    )(this.itemExtraDef)

    // insert item
    const item = CategoryItem.newItem(CategoryLevel.getUuid(lastLevel), parentItemUuid, {
      [CategoryItem.props.code]: lastLevelCodeValue,
      [CategoryItem.props.labels]: labels,
      [CategoryItem.props.descriptions]: descriptions,
      ...extraProps
    })

    //TODO do it in batch
    await CategoryManager.insertItem(this.getUser(), this.getSurveyId(), item, this.tx)

    this.itemUuidByAncestorCodes[ancestorCodes] = CategoryItem.getUuid(item)
  }
}

CategoryImportJob.type = 'CategoryImportJob'

module.exports = CategoryImportJob

