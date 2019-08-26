const R = require('ramda')
const path = require('path')

const Job = require('../../../job/job')
const CSVParser = require('../../../utils/file/csvParser')

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
    super('CategoryImportJob', params)

    const { filePath } = params

    this.csvParser = new CSVParser(filePath)

    this.itemExtraDef = {} // category item extra props def
    this.itemUuidByAncestorCodes = [] // cache of category items by ancestor codes
  }

  async execute () {
    const { filePath } = this.params

    this.total = await this.csvParser.calculateSize()

    const surveyId = this.getSurveyId()

    const categoryName = path.basename(filePath, path.extname(filePath))

    const categoryToCreate = Category.newCategory({
      [Category.props.name]: categoryName
    })

    this.category = await CategoryManager.insertCategory(this.getUser(), surveyId, categoryToCreate, this.tx)

    await this._insertLevelsAndExtraPropsDef()

    await this._insertItems()
  }

  async _insertLevelsAndExtraPropsDef () {
    const headers = await this.csvParser.next()

    const itemExtraDef = {}

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]

      if (header.endsWith(columnSuffixes.code)) {
        // identify level names
        const levelName = header.substr(0, header.length - 5)
        if (i === 0) {
          // update first level
          const firstLevel = Category.getLevelByIndex(0)(this.category)
          await CategoryManager.updateLevelProp(this.getUser(), this.getSurveyId(), Category.getUuid(firstLevel), CategoryLevel.props.name, levelName, this.tx)
        } else {
          // insert new level
          const level = Category.newLevel(this.category)
          const levelUpdated = Category.assocLevelName(levelName)(level)
          await CategoryManager.insertLevel(this.getUser(), this.getSurveyId(), Category.getUuid(this.category), levelUpdated, this.tx)
        }
      } else if (
        !columnRegExpLabel.test(header) ||
        !columnRegExpDescription.test(header)
      ) {
        //do not ends with _label_LANGCODE
        itemExtraDef[header] = { type: 'text' }
      }
    }

    this.itemExtraDef = itemExtraDef

    if (!R.isEmpty(itemExtraDef)) {
      await CategoryManager.updateCategoryProp(this.getUser(), this.getSurveyId(), Category.getUuid(this.category),
        Category.props.itemExtraDef, itemExtraDef, this.tx)
    }
  }

  async _insertItems () {
    const survey = await SurveyManager.fetchSurveyById(this.getSurveyId(), true, false, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const languages = Survey.getLanguages(surveyInfo)

    const levels = Category.getLevelsArray(category)

    let row = this.csvParser.next()
    while (row !== null) {
      await this._insertItem(levels, languages, row)
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
      } else {
        lastLevelCodeValue = codeValue
        lastLevel = level
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

    await CategoryManager.insertItem(this.getUser(), this.getSurveyId(), item, this.tx)

    this.itemUuidByAncestorCodes[ancestorCodes] = CategoryItem.getUuid(item)
  }
}

module.exports = CategoryImportJob

