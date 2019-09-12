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
    // 1. initialize summary (get it from params by default)
    this.summary = await this.getOrCreateSummary()

    this.logDebug('summary', this.summary)

    //skip import if summary is not specified
    if (!this.summary)
      return

    // 2. fetch or create category
    this.category = await this._fetchOrCreateCategory()

    // 3. import levels
    await this._importLevels()
    // 4. import item extra def
    await this._importItemExtraDef()
    // 5. read items from csv file
    await this._readItems()

    if (this.total === 0) {
      // error: empty file
      this._addError(ValidatorErrorKeys.categoryImport.emptyFile)
    } else if (this.hasErrors()) {
      // errors found in csv rows
      this.logDebug(`${Object.keys(this.errors).length} errors found`)
      await this.setStatusFailed()
    }
  }

  async beforeSuccess () {
    await super.beforeSuccess()

    await this._insertItems()

    // fetch and validate category
    this.category = await CategoryManager.fetchCategoryByUuid(this.surveyId, Category.getUuid(this.category), true, true, this.tx)

    this.setResult({
      category: this.category
    })
  }

  // start of methods that can be overridden by subclasses
  async createReadStream () {
    return fs.createReadStream(CategoryImportSummary.getFilePath(this.summary))
  }

  async getOrCreateSummary () {
    return CategoryImportJobParams.getSummary(this.params)
  }

  extractItemExtraDef () {
    const columns = CategoryImportSummary.getColumns(this.summary)

    return Object.entries(columns).reduce(
      (accExtraDef, [columnName, column]) => {
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

  async _fetchOrCreateCategory () {
    const categoryUuid = CategoryImportJobParams.getCategoryUuid(this.params)
    if (categoryUuid) {
      return await CategoryManager.fetchCategoryByUuid(this.surveyId, categoryUuid, true, false, this.tx)
    } else {
      const category = Category.newCategory({
        [Category.props.name]: CategoryImportJobParams.getCategoryName(this.params)
      })
      return await CategoryManager.insertCategory(this.user, this.surveyId, category, this.tx)
    }
  }

  async _importLevels () {
    this.logDebug('importing levels')

    const levelNames = CategoryImportSummary.getLevelNames(this.summary)
    // delete existing levels and insert new ones using level names from summary
    this.category = await CategoryManager.replaceLevels(this.user, this.surveyId, Category.getUuid(this.category), levelNames, this.tx)

    this.logDebug(`levels imported: ${levelNames}`)
  }

  async _importItemExtraDef () {
    this.logDebug('importing item extra def')

    const itemExtraDef = this.extractItemExtraDef()

    if (!R.isEmpty(itemExtraDef)) {
      await CategoryManager.updateCategoryProp(this.user, this.surveyId, Category.getUuid(this.category), Category.props.itemExtraDef, itemExtraDef, this.tx)
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
      total => this.total = total + 1 //+1 consider db insert
    )

    await reader.start()

    this.logDebug(`${this.total} items read`)
  }

  async _onRow (itemRow) {
    const { levelIndex: levelIndexItem, codes, labelsByLevel, descriptionsByLevel, extra } = itemRow

    const levels = Category.getLevelsArray(this.category)

    if (this._checkCodesNotEmpty(codes)) {
      this.levelIndexDeepest = Math.max(this.levelIndexDeepest, levelIndexItem)

      // for each level insert an item or replace its props if already parsed
      for (let levelIndex = 0; levelIndex <= levelIndexItem; levelIndex++) {
        const level = levels[levelIndex]

        const codesLevel = codes.slice(0, levelIndex + 1)

        const itemAlreadyParsed = this.itemsByCodes[codesLevel]

        const mostSpecificLevel = levelIndex === levelIndexItem

        if (itemAlreadyParsed && itemAlreadyParsed.mostSpecificLevel && mostSpecificLevel) {
          this._addErrorCodeDuplicate(levelIndex, codesLevel)
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

    const itemProps = {
      [CategoryItem.props.code]: codesLevel[codesLevel.length - 1]
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
        this._getParentItemUuid(codesLevel, levelIndex),
        itemProps
      )
  }

  async _insertItems () {
    this.logDebug('inserting items')
    const items = Object.values(this.itemsByCodes)
    await CategoryManager.insertItems(this.user, this.surveyId, items, this.tx)
    this.incrementProcessedItems()
    this.logDebug(`${items.length} items inserted`)
  }

  _checkCodesNotEmpty (codes) {
    if (codes.length === 0) {
      this._addErrorCodeRequired(0)
      return false
    } else {
      let errorsFound = false
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i]
        if (StringUtils.isBlank(code)) {
          this._addErrorCodeRequired(i)
          errorsFound = true
        }
      }
      return !errorsFound
    }
  }

  _addErrorCodeDuplicate (levelIndex, codes) {
    const code = codes[levelIndex]
    const columnName = CategoryImportSummary.getColumnName(CategoryImportSummary.columnTypes.code, levelIndex)(this.summary)
    this._addError(ValidatorErrorKeys.categoryImport.codeDuplicate, { columnName, code })
  }

  _addErrorCodeRequired (levelIndex) {
    const columnName = CategoryImportSummary.getColumnName(CategoryImportSummary.columnTypes.code, levelIndex)(this.summary)
    this._addError(ValidatorErrorKeys.categoryImport.codeRequired, { columnName })
  }

  _addError (key, params = {}) {
    this.addError({
      error: {
        [Validator.keys.valid]: false,
        [Validator.keys.errors]: [{ key, params }]
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

