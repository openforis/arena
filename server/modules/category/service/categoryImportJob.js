const fs = require('fs')
const R = require('ramda')

const Job = require('../../../job/job')

const Category = require('../../../../common/survey/category')
const CategoryImportSummary = require('../../../../common/survey/categoryImportSummary')
const CategoryLevel = require('../../../../common/survey/categoryLevel')
const CategoryItem = require('../../../../common/survey/categoryItem')
const Validator = require('../../../../common/validation/validator')
const ValidatorErrorKeys = require('../../../../common/validation/validatorErrorKeys')
const StringUtils = require('../../../../common/stringUtils')
const ObjectUtils = require('../../../../common/objectUtils')

const CategoryManager = require('../manager/categoryManager')
const CategoryImportCSVParser = require('./categoryImportCSVParser')
const CategoryImportJobParams = require('./categoryImportJobParams')

class CategoryImportJob extends Job {

  constructor (params, type = CategoryImportJob.type) {
    super(type, params)

    this.itemsByCodes = {} // cache of category items by ancestor codes
    this.summary = null
    this.category = null
    this.levelIndexDeepest = 0 // used to remove unused levels
  }

  async execute () {
    //initialize summary (get it from params by default)
    this.summary = await this.getOrCreateSummary()

    this.logDebug('summary', this.summary)

    //skip import if summary is not specified
    if (!this.summary)
      return

    this.category = await this._getOrCreateCategory()

    // levels
    await this._importLevels()

    // item extra def
    await this._importItemExtraDef()

    // items
    await this._readItems()

    // delete unused levels
    await this._deleteUnusedLevels()

    if (this.hasErrors()) {
      // errors found
      this.logDebug(`${Object.keys(this.errors).length} errors found`)
      await this.setStatusFailed()
    } else {
      // no errors found
      await this._insertItems()
    }
  }

  // start of methods that can be overridden by subclasses
  async createReadStream () {
    return fs.createReadStream(CategoryImportSummary.getFilePath(this.summary))
  }

  async getOrCreateSummary () {
    return CategoryImportJobParams.getSummary(this.params)
  }

  extractItemExtraDef () {
    return Object.entries(CategoryImportSummary.getColumns(this.summary)).reduce((accExtraDef, [columnName, column]) => {
        if (CategoryImportSummary.isColumnExtra(column)) {
          accExtraDef[columnName] = {
            [CategoryItem.keysExtraDef.dataType]: CategoryImportSummary.getColumnDataType(column)
          }
        }
        return accExtraDef
      },
      {}
    )
  }

  extractItemExtraProps (extra) {
    return extra
  }
  // end of methods that can be overridden by subclasses

  async _deleteUnusedLevels () {
    let levels = Category.getLevelsArray(this.category)
    let lastLevelIndex = levels.length - 1

    while (lastLevelIndex > this.levelIndexDeepest) {
      const level = levels.pop()
      await CategoryManager.deleteLevel(this.getUser(), this.getSurveyId(), CategoryLevel.getUuid(level), this.tx)
      this.category = Category.assocLevelsArray(levels)(this.category)
      lastLevelIndex--
    }
  }

  async _getOrCreateCategory () {
    const categoryUuid = CategoryImportJobParams.getCategoryUuid(this.params)

    if (categoryUuid) {
      return await CategoryManager.fetchCategoryByUuid(this.getSurveyId(), categoryUuid, true, false, this.tx)
    } else {
      const categoryName = CategoryImportJobParams.getCategoryName(this.params)

      const category = Category.newCategory({
        [Category.props.name]: categoryName
      })

      return await CategoryManager.insertCategory(this.getUser(), this.getSurveyId(), category, this.tx)
    }
  }

  async _importLevels () {
    this.logDebug('importing levels')

    const surveyId = this.getSurveyId()
    const user = this.getUser()

    this.category = await CategoryManager.deleteLevelsByCategory(user, surveyId, Category.getUuid(this.category), this.tx)

    const levelNames = CategoryImportSummary.getLevelNames(this.summary)

    for (const levelName of levelNames) {
      const levelToInsert = Category.newLevel(this.category, {
        [CategoryLevel.props.name]: levelName
      })
      const level = await CategoryManager.insertLevel(user, surveyId, levelToInsert, this.tx)
      this.category = Category.assocLevel(level)(this.category)
    }

    this.logDebug(`levels imported: ${levelNames}`)
  }

  async _importItemExtraDef () {
    this.logDebug('importing item extra def')

    const itemExtraDef = this.extractItemExtraDef()

    if (!R.isEmpty(itemExtraDef)) {
      await CategoryManager.updateCategoryProp(this.getUser(), this.getSurveyId(), Category.getUuid(this.category), Category.props.itemExtraDef, itemExtraDef, this.tx)
      this.category = Category.assocItemExtraDef(itemExtraDef)(this.category)
    }

    this.logDebug('item extra def imported', itemExtraDef)
  }

  async _readItems () {
    this.logDebug('reading items')

    const reader = await CategoryImportCSVParser.createRowsReaderFromStream(
      await this.createReadStream(),
      this.summary,
      async itemRow => {
        if (this.isCanceled()) {
          reader.cancel()
          return
        }
        await this._onRow(itemRow)
      },
      total => this.total = total
    )

    await reader.start()

    this.logDebug(`${this.total} items read`)

    if (this.total === 0)
      this.addError({
        error: {
          [Validator.keys.valid]: false,
          [Validator.keys.errors]: [{
            key: ValidatorErrorKeys.categoryImport.emptyFile
          }]
        }
      })
  }

  async _onRow (itemRow) {
    const { levelIndex: levelIndexItem, codes, labelsByLevel, descriptionsByLevel, extra } = itemRow

    const levels = Category.getLevelsArray(this.category)

    if (this._checkCodesNotEmpty(codes)) {
      this.levelIndexDeepest = Math.max(this.levelIndexDeepest, levelIndexItem)

      for (let levelIndex = 0; levelIndex <= levelIndexItem; levelIndex++) {
        const level = levels[levelIndex]

        const codesLevel = codes.slice(0, levelIndex + 1)

        const itemAlreadyParsed = this.itemsByCodes[codesLevel]

        const mostSpecificLevel = levelIndex === levelIndexItem

        if (itemAlreadyParsed && itemAlreadyParsed.mostSpecificLevel && mostSpecificLevel) {
          this._addErrorCodeDuplicate(codesLevel)
        } else {
          const item = this._getOrCreateItem(level, levelIndex, codesLevel, labelsByLevel, descriptionsByLevel, extra, itemAlreadyParsed)

          this.itemsByCodes[codesLevel] = {
            ...item,
            mostSpecificLevel
          }
        }
      }
    }
    this.incrementProcessedItems()
  }

  _getOrCreateItem (level, levelIndex, codesLevel, labelsByLevel, descriptionsByLevel, extra, itemAlreadyParsed) {
    const levelName = CategoryLevel.getName(level)
    const codeLastLevel = codesLevel[codesLevel.length - 1]
    const itemParentUuid = this._getParentItemUuid(codesLevel, levelIndex)

    const itemProps = {
      [CategoryItem.props.code]: codeLastLevel
    }
    ObjectUtils.setInPath([ObjectUtils.keysProps.labels], labelsByLevel[levelName], false)(itemProps)
    ObjectUtils.setInPath([ObjectUtils.keysProps.descriptions], descriptionsByLevel[levelName], false)(itemProps)
    ObjectUtils.setInPath([CategoryItem.props.extra], this.extractItemExtraProps(extra), false)(itemProps)

    return itemAlreadyParsed
      ? {
        ...itemAlreadyParsed,
        //override already inserted item props
        [CategoryItem.keys.props]: itemProps
      }
      : CategoryItem.newItem(
        CategoryLevel.getUuid(level),
        itemParentUuid,
        itemProps
      )
  }

  async _insertItems () {
    this.logDebug('inserting items')

    const surveyId = this.getSurveyId()
    const user = this.getUser()

    const items = Object.values(this.itemsByCodes)
    await CategoryManager.insertItems(user, surveyId, items, this.tx)

    this.logDebug(`${items.length} items inserted`)
  }

  _checkCodesNotEmpty (codes) {
    let errorsFound = false

    if (codes.length === 0) {
      this._addErrorCodeRequired(0)
      errorsFound = true
    } else {
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i]
        if (StringUtils.isBlank(code)) {
          this._addErrorCodeRequired(i)
          errorsFound = true
        }
      }
    }
    return !errorsFound
  }

  _addErrorCodeDuplicate (codes) {
    const levelIndex = codes.length - 1
    const code = codes[levelIndex]
    const columnName = CategoryImportSummary.getColumnName(CategoryImportSummary.columnTypes.code, levelIndex)(this.summary)

    this.addError({
      error: {
        [Validator.keys.valid]: false,
        [Validator.keys.errors]: [{
          key: ValidatorErrorKeys.categoryImport.codeDuplicate,
          params: {
            columnName,
            code
          }
        }]
      }
    })
  }

  _addErrorCodeRequired (levelIndex) {
    const columnName = CategoryImportSummary.getColumnName(CategoryImportSummary.columnTypes.code, levelIndex)(this.summary)

    this.addError({
      error: {
        [Validator.keys.valid]: false,
        [Validator.keys.errors]: [{
          key: ValidatorErrorKeys.categoryImport.codeRequired,
          params: {
            columnName
          }
        }]
      }
    })
  }

  _getParentItemUuid (codes, levelIndex) {
    if (levelIndex > 0) {
      const codesParent = codes.slice(0, levelIndex)
      const itemParent = this.itemsByCodes[codesParent]
      return CategoryItem.getUuid(itemParent)
    } else {
      return null
    }
  }

}

CategoryImportJob.type = 'CategoryImportJob'

module.exports = CategoryImportJob

