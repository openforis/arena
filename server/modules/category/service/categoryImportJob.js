import * as fs from 'fs'
import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import Job from '@server/job/job'

import * as Category from '@core/survey/category'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'

import BatchPersister from '@server/db/batchPersister'
import * as CategoryManager from '../manager/categoryManager'
import * as CategoryImportCSVParser from '../manager/categoryImportCSVParser'
import * as CategoryImportJobParams from './categoryImportJobParams'

export default class CategoryImportJob extends Job {
  constructor(params, type = CategoryImportJob.type) {
    super(type, params)

    this.itemsByCodes = {} // Cache of category items by ancestor codes
    this.summary = null
    this.category = null
    this.totalItemsInserted = 0
    this.itemsBatchInserter = null
    this.itemsBatchUpdater = null
  }

  async onStart() {
    await super.onStart()

    // 1. initialize summary (get it from params by default)
    this.summary = await this.getOrCreateSummary()
    this.logDebug('summary', this.summary)
  }

  async execute() {
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
      // Error: empty file
      this._addError(Validation.messageKeys.categoryImport.emptyFile)
      await this.setStatusFailed()
    } else if (this.hasErrors()) {
      // Errors found in csv rows
      this.logDebug(`${Object.keys(this.errors).length} errors found`)
      await this.setStatusFailed()
    } else {
      // 6. no errors found, insert remaining items
      await this.itemsBatchInserter.flush()
      await this.itemsBatchUpdater.flush()
      this.incrementProcessedItems()
      this.logDebug(`${this.totalItemsInserted} items inserted`)
    }
  }

  async logCategoryImportActivity() {
    await ActivityLogManager.insert(
      this.user,
      this.surveyId,
      ActivityLog.type.categoryImport,
      { uuid: Category.getUuid(this.category) },
      false,
      this.tx
    )
  }

  async beforeSuccess() {
    await super.beforeSuccess()

    // Validate category
    this.category = await CategoryManager.validateCategory(this.surveyId, Category.getUuid(this.category), this.tx)

    this.setResult({
      category: this.category,
    })
  }

  // Start of methods that can be overridden by subclasses
  async createReadStream() {
    return fs.createReadStream(CategoryImportSummary.getFilePath(this.summary))
  }

  async getOrCreateSummary() {
    return CategoryImportJobParams.getSummary(this.params)
  }

  extractItemExtraDef() {
    const columns = CategoryImportSummary.getColumns(this.summary)

    return Object.entries(columns).reduce((accExtraDef, [columnName, column]) => {
      if (CategoryImportSummary.isColumnExtra(column)) {
        accExtraDef[columnName] = {
          [CategoryItem.keysExtraDef.dataType]: CategoryImportSummary.getColumnDataType(column),
        }
      }

      return accExtraDef
    }, {})
  }

  extractItemExtraProps(extra) {
    return extra
  }

  // End of methods that can be overridden by subclasses

  async _fetchOrCreateCategory() {
    const categoryUuid = CategoryImportJobParams.getCategoryUuid(this.params)
    if (categoryUuid) {
      return CategoryManager.fetchCategoryAndLevelsByUuid(this.surveyId, categoryUuid, true, false, this.tx)
    }

    const category = Category.newCategory({
      [Category.keysProps.name]: CategoryImportJobParams.getCategoryName(this.params),
    })
    return CategoryManager.insertCategory({ user: this.user, surveyId: this.surveyId, category, system: true }, this.tx)
  }

  async _importLevels() {
    this.logDebug('importing levels')

    const levelNames = CategoryImportSummary.getLevelNames(this.summary)
    // Delete existing levels and insert new ones using level names from summary
    this.category = await CategoryManager.replaceLevels(this.user, this.surveyId, this.category, levelNames, this.tx)

    this.logDebug(`levels imported: ${levelNames}`)
  }

  async _importItemExtraDef() {
    this.logDebug('importing item extra def')

    const itemExtraDef = this.extractItemExtraDef()

    if (!R.isEmpty(itemExtraDef)) {
      await CategoryManager.updateCategoryProp(
        this.user,
        this.surveyId,
        Category.getUuid(this.category),
        Category.keysProps.itemExtraDef,
        itemExtraDef,
        true,
        this.tx
      )
      this.category = Category.assocItemExtraDef(itemExtraDef)(this.category)
    }

    this.logDebug('item extra def imported', itemExtraDef)
  }

  async _readItems() {
    this.logDebug('reading CSV file rows')

    this.itemsBatchInserter = new BatchPersister(async (items) =>
      CategoryManager.insertItems(this.user, this.surveyId, items, this.tx)
    )
    this.itemsBatchUpdater = new BatchPersister(async (items) =>
      CategoryManager.updateItemsExtra(this.user, this.surveyId, Category.getUuid(this.category), items, this.tx)
    )

    const reader = await CategoryImportCSVParser.createRowsReaderFromStream(
      await this.createReadStream(),
      this.summary,
      async (itemRow) => {
        if (this.isCanceled()) {
          reader.cancel()
          return
        }

        await this._onRow(itemRow)
      },
      (total) => {
        this.total = total + 1
      } // +1 consider final db inserts
    )

    await reader.start()

    this.logDebug(`${this.total - 1} rows read`)
  }

  async _onRow(itemRow) {
    const { levelIndex: levelIndexItem, codes, labelsByLevel, descriptionsByLevel, extra } = itemRow

    const levels = Category.getLevelsArray(this.category)

    if (this._checkCodesNotEmpty(codes)) {
      // For each level insert an item or replace its props if already parsed
      for (let levelIndex = 0; levelIndex <= levelIndexItem; levelIndex++) {
        const level = levels[levelIndex]
        const placeholder = levelIndex !== levelIndexItem
        const itemCodes = codes.slice(0, levelIndex + 1)
        const itemCodeKey = String(itemCodes)
        const itemCached = this._getItemCachedByCodes(itemCodes)

        if (itemCached && !placeholder && !itemCached.placeholder) {
          this._addErrorCodeDuplicate(levelIndex, itemCodeKey)
        } else if (!itemCached || !placeholder) {
          // Insert new items if not inserted already
          // update existing items (only when last level is reached)
          await this._insertOrUpdateItem(itemCodes, level, placeholder, labelsByLevel, descriptionsByLevel, extra)
        }
      }
    }

    this.incrementProcessedItems()
  }

  /**
   * Insert new item if not already created or update already inserted item if in last level
   */
  async _insertOrUpdateItem(itemCodes, level, placeholder, labelsByLevel, descriptionsByLevel, extra) {
    const itemCached = this._getItemCachedByCodes(itemCodes)

    let item = null

    const itemProps = {
      [CategoryItem.keysProps.code]: itemCodes[itemCodes.length - 1],
    }
    const levelName = CategoryLevel.getName(level)
    ObjectUtils.setInPath([ObjectUtils.keysProps.labels], labelsByLevel[levelName], false)(itemProps)
    ObjectUtils.setInPath([ObjectUtils.keysProps.descriptions], descriptionsByLevel[levelName], false)(itemProps)
    if (!placeholder) {
      ObjectUtils.setInPath([CategoryItem.keysProps.extra], this.extractItemExtraProps(extra), false)(itemProps)
    }

    if (itemCached) {
      // Update existing item if extra props are changed
      item = {
        ...itemCached,
        // Override already inserted item props
        [CategoryItem.keys.props]: itemProps,
      }
      if (!R.equals(itemCached, item)) {
        // Update already inserted item
        await this.itemsBatchUpdater.addItem(item)
      }
    } else {
      // Insert new item
      item = CategoryItem.newItem(CategoryLevel.getUuid(level), this._getParentItemUuid(itemCodes), itemProps)
      await this.itemsBatchInserter.addItem(item)
      this.totalItemsInserted++
    }

    item.placeholder = placeholder
    this._putItemToCache(itemCodes, item)
  }

  _checkCodesNotEmpty(codes) {
    if (codes.length === 0) {
      this._addErrorCodeRequired(0)
      return false
    }

    let errorsFound = false
    for (const [i, code] of codes.entries()) {
      if (StringUtils.isBlank(code)) {
        this._addErrorCodeRequired(i)
        errorsFound = true
      }
    }

    return !errorsFound
  }

  _addErrorCodeDuplicate(levelIndex, codes) {
    const code = codes[levelIndex]
    const columnName = CategoryImportSummary.getColumnName(
      CategoryImportSummary.columnTypes.code,
      levelIndex
    )(this.summary)
    this._addError(Validation.messageKeys.categoryImport.codeDuplicate, {
      columnName,
      code,
    })
  }

  _addErrorCodeRequired(levelIndex) {
    const columnName = CategoryImportSummary.getColumnName(
      CategoryImportSummary.columnTypes.code,
      levelIndex
    )(this.summary)
    this._addError(Validation.messageKeys.categoryImport.codeRequired, {
      columnName,
    })
  }

  _addError(key, params = {}) {
    this.addError({
      error: Validation.newInstance(false, {}, [{ key, params }]),
    })
  }

  _getItemCachedByCodes(itemCodes) {
    return this.itemsByCodes[String(itemCodes)]
  }

  _putItemToCache(itemCodes, item) {
    this.itemsByCodes[String(itemCodes)] = R.omit([CategoryItem.keys.props], item)
  }

  _getParentItemUuid(itemCodes) {
    if (itemCodes.length > 1) {
      const itemParent = this._getItemCachedByCodes(itemCodes.slice(0, itemCodes.length - 1))
      return CategoryItem.getUuid(itemParent)
    }

    return null
  }
}

CategoryImportJob.type = 'CategoryImportJob'
