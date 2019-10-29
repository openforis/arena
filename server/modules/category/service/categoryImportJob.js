const fs = require('fs')
const R = require('ramda')

const ActivityLog = require('@common/activityLog/activityLog')
const ActivityLogManager = require('@server/modules/activityLog/manager/activityLogManager')
const Job = require('@server/job/job')

const Category = require('@core/survey/category')
const CategoryImportSummary = require('@core/survey/categoryImportSummary')
const CategoryLevel = require('@core/survey/categoryLevel')
const CategoryItem = require('@core/survey/categoryItem')
const Validation = require('@core/validation/validation')
const StringUtils = require('@core/stringUtils')
const ObjectUtils = require('@core/objectUtils')

const CategoryManager = require('../manager/categoryManager')
const CategoryImportCSVParser = require('../manager/categoryImportCSVParser')
const CategoryImportJobParams = require('./categoryImportJobParams')

class CategoryImportJob extends Job {

  constructor (params, type = CategoryImportJob.type) {
    super(type, params)

    this.itemsByCodes = {} // cache of category items by ancestor codes
    this.summary = null
    this.category = null
  }

  async onStart () {
    await super.onStart()

    // 1. initialize summary (get it from params by default)
    this.summary = await this.getOrCreateSummary()
    this.logDebug('summary', this.summary)
  }

  async execute () {
    // 2. fetch or create category
    this.category = await this._fetchOrCreateCategory()

    await this.logCategoryImportActivity()

    // 3. import levels
    await this._importLevels()
    // 4. import item extra def
    await this._importItemExtraDef()
    // 5. read items from csv file
    await this._readItems()

    if (this.total === 0) {
      // error: empty file
      this._addError(Validation.messageKeys.categoryImport.emptyFile)
      await this.setStatusFailed()
    } else if (this.hasErrors()) {
      // errors found in csv rows
      this.logDebug(`${Object.keys(this.errors).length} errors found`)
      await this.setStatusFailed()
    } else {
      // 6. no errors found, insert items
      await this._insertItems()
    }
  }

  async logCategoryImportActivity () {
    await ActivityLogManager.insert(this.user, this.surveyId, ActivityLog.type.categoryImport, { uuid: Category.getUuid(this.category) }, false, this.tx)
  }

  async beforeSuccess () {
    await super.beforeSuccess()

    // validate category
    this.category = await CategoryManager.validateCategory(this.surveyId, Category.getUuid(this.category), this.tx)

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
      return await CategoryManager.fetchCategoryAndLevelsByUuid(this.surveyId, categoryUuid, true, false, this.tx)
    } else {
      const category = Category.newCategory({
        [Category.props.name]: CategoryImportJobParams.getCategoryName(this.params)
      })
      return await CategoryManager.insertCategory(this.user, this.surveyId, category, true, this.tx)
    }
  }

  async _importLevels () {
    this.logDebug('importing levels')

    const levelNames = CategoryImportSummary.getLevelNames(this.summary)
    // delete existing levels and insert new ones using level names from summary
    this.category = await CategoryManager.replaceLevels(this.user, this.surveyId, this.category, levelNames, this.tx)

    this.logDebug(`levels imported: ${levelNames}`)
  }

  async _importItemExtraDef () {
    this.logDebug('importing item extra def')

    const itemExtraDef = this.extractItemExtraDef()

    if (!R.isEmpty(itemExtraDef)) {
      await CategoryManager.updateCategoryProp(this.user, this.surveyId, Category.getUuid(this.category), Category.props.itemExtraDef, itemExtraDef, true, this.tx)
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
      // for each level insert an item or replace its props if already parsed
      for (let levelIndex = 0; levelIndex <= levelIndexItem; levelIndex++) {
        const level = levels[levelIndex]
        const lastLevel = levelIndex === levelIndexItem
        const itemCodes = codes.slice(0, levelIndex + 1)
        const itemCodeKey = String(itemCodes)
        const itemCached = this._getItemCachedByCodes(itemCodes)

        if (itemCached && lastLevel && !itemCached.placeholder) {
          this._addErrorCodeDuplicate(levelIndex, itemCodeKey)
        } else {
          const item = this._getOrCreateItem(level, itemCodes, labelsByLevel, descriptionsByLevel, extra)
          if (!lastLevel) {
            item.placeholder = true
          }
          this.itemsByCodes[itemCodeKey] = item
        }
      }
    }
    this.incrementProcessedItems()
  }

  _getOrCreateItem (level, itemCodes, labelsByLevel, descriptionsByLevel, extra) {
    const levelName = CategoryLevel.getName(level)

    const itemProps = {
      [CategoryItem.props.code]: itemCodes[itemCodes.length - 1]
    }
    ObjectUtils.setInPath([ObjectUtils.keysProps.labels], labelsByLevel[levelName], false)(itemProps)
    ObjectUtils.setInPath([ObjectUtils.keysProps.descriptions], descriptionsByLevel[levelName], false)(itemProps)
    ObjectUtils.setInPath([CategoryItem.props.extra], this.extractItemExtraProps(extra), false)(itemProps)

    const itemCached = this._getItemCachedByCodes(itemCodes)

    return itemCached
      ? {
        ...itemCached,
        //override already inserted item props
        [CategoryItem.keys.props]: itemProps
      }
      : CategoryItem.newItem(
        CategoryLevel.getUuid(level),
        this._getParentItemUuid(itemCodes),
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
    this._addError(Validation.messageKeys.categoryImport.codeDuplicate, { columnName, code })
  }

  _addErrorCodeRequired (levelIndex) {
    const columnName = CategoryImportSummary.getColumnName(CategoryImportSummary.columnTypes.code, levelIndex)(this.summary)
    this._addError(Validation.messageKeys.categoryImport.codeRequired, { columnName })
  }

  _addError (key, params = {}) {
    this.addError({
      error: Validation.newInstance(false, {}, [{ key, params }])
    })
  }

  _getItemCachedByCodes (itemCodes) {
    return this.itemsByCodes[String(itemCodes)]
  }

  _getParentItemUuid (itemCodes) {
    if (itemCodes.length > 1) {
      const itemParent = this._getItemCachedByCodes(itemCodes.slice(0, itemCodes.length - 1))
      return CategoryItem.getUuid(itemParent)
    } else {
      return null
    }
  }

}

CategoryImportJob.type = 'CategoryImportJob'

module.exports = CategoryImportJob

