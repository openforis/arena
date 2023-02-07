import * as fs from 'fs'
import * as R from 'ramda'

import { SRSs } from '@openforis/arena-core'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import Job from '@server/job/job'

import * as Category from '@core/survey/category'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as CategoryLevel from '@core/survey/categoryLevel'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'
import * as PromiseUtils from '@core/promiseUtils'

import * as CategoryManager from '../manager/categoryManager'
import * as CategoryImportCSVParser from '../manager/categoryImportCSVParser'
import * as CategoryImportJobParams from './categoryImportJobParams'
import CategoryItemsUpdater from './categoryItemsUpdater'

export default class CategoryImportJob extends Job {
  constructor(params, type = CategoryImportJob.type) {
    super(type, params)

    this.itemsByCodes = {} // Cache of category items by ancestor codes
    this.summary = null
    this.category = null
    this.totalItemsInserted = 0

    this.itemsUpdater = null
  }

  async onStart() {
    await super.onStart()

    await SRSs.init()

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
      if (await this.itemsUpdater.flush()) {
        this.incrementProcessedItems()
        this.logDebug(`${this.totalItemsInserted} items inserted`)
      } else {
        this.setStatusFailed()
      }
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
    this.logDebug('category validation start')
    this.category = await CategoryManager.validateCategory(this.surveyId, Category.getUuid(this.category), this.tx)
    this.logDebug('category validation end')

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
    const items = CategoryImportSummary.getItems(this.summary)

    return items.reduce((accExtraDef, item) => {
      if (CategoryImportSummary.isItemExtra(item)) {
        const itemKey = CategoryImportSummary.getItemKey(item)
        accExtraDef[itemKey] = ExtraPropDef.newItem({
          dataType: CategoryImportSummary.getItemDataType(item),
        })
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
      return CategoryManager.fetchCategoryAndLevelsByUuid(
        {
          surveyId: this.surveyId,
          categoryUuid,
          draft: true,
          includeValidation: false,
        },
        this.tx
      )
    }

    const category = Category.newCategory({
      [Category.keysProps.name]: CategoryImportJobParams.getCategoryName(this.params),
    })
    return CategoryManager.insertCategory({ user: this.user, surveyId: this.surveyId, category, system: true }, this.tx)
  }

  async _importLevels() {
    this.logDebug('importing levels')

    const { category, surveyId, summary, user, tx } = this

    const levelNames = CategoryImportSummary.getLevelNames(summary)

    if (Category.isPublished(category)) {
      await this._updateExistingLevels()
    } else {
      this.logDebug('draft category: replacing levels')
      // Delete existing levels and insert new ones using level names from summary
      this.category = await CategoryManager.replaceLevels(user, surveyId, category, levelNames, tx)
    }

    this.logDebug(`levels imported: ${levelNames}`)
  }

  async _updateExistingLevels() {
    this.logDebug('published category: updating levels')

    const { category, surveyId, summary, user, tx } = this

    const levelNames = CategoryImportSummary.getLevelNames(summary)

    const levelsExisting = Category.getLevelsArray(category)

    // check that there are no published levels missing in the imported file
    const publishedLevelsExisting = levelsExisting.filter(CategoryLevel.isPublished)
    if (levelNames.length < publishedLevelsExisting.length) {
      const deletedLevelNames = publishedLevelsExisting
        .map(CategoryLevel.getName)
        .filter((oldLevelName) => !levelNames.includes(oldLevelName))
        .flat()
      this._addError(Validation.messageKeys.categoryImport.cannotDeleteLevelsOfPublishedCategory, { deletedLevelNames })
      this.setStatusFailed()
      return
    }

    await PromiseUtils.each(levelNames, async (levelName, index) => {
      const levelOld = levelsExisting[index]
      if (!levelOld) {
        // insert new level
        const level = Category.newLevel(category, { [CategoryLevel.keysProps.name]: levelName }, index)
        const { category: categoryUpdated } = await CategoryManager.insertLevel(
          { user, surveyId, level, system: true },
          tx
        )
        this.category = categoryUpdated
      } else if (CategoryLevel.getName(levelOld) !== levelName) {
        // update level name
        const { category: categoryUpdated } = await CategoryManager.updateLevelProp(
          user,
          surveyId,
          Category.getUuid(category),
          CategoryLevel.getUuid(levelOld),
          Category.keysProps.name,
          levelName,
          tx
        )
        this.category = categoryUpdated
      }
    })

    if (levelNames.length < levelsExisting.length) {
      // delete draft levels missing in imported file (starting from the last level)
      const levelsToDelete = levelsExisting.slice(levelNames.length).reverse()

      await PromiseUtils.each(levelsToDelete, async (levelToDelete) => {
        this.category = await CategoryManager.deleteLevel(
          user,
          surveyId,
          Category.getUuid(category),
          CategoryLevel.getUuid(levelToDelete),
          tx
        )
      })
    }
  }

  async _importItemExtraDef() {
    this.logDebug('importing item extra def')

    const itemExtraDef = this.extractItemExtraDef()

    if (!R.isEmpty(itemExtraDef)) {
      await CategoryManager.updateCategoryProp(
        {
          user: this.user,
          surveyId: this.surveyId,
          categoryUuid: Category.getUuid(this.category),
          key: Category.keysProps.itemExtraDef,
          value: itemExtraDef,
          system: true,
        },
        this.tx
      )
      this.category = Category.assocItemExtraDef(itemExtraDef)(this.category)
    }

    this.logDebug('item extra def imported', itemExtraDef)
  }

  async _readItems() {
    this.logDebug('reading CSV file rows')

    const { surveyId, category, user, tx } = this

    // init items updater
    this.itemsUpdater = new CategoryItemsUpdater({
      surveyId,
      category,
      user,
      errorHandler: this._addError.bind(this),
      itemExtraPropsExtrator: this.extractItemExtraProps.bind(this),
      tx,
    })
    await this.itemsUpdater.init()

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
        this.total = total + 1 // +1 consider final db inserts
      }
    )

    await reader.start()

    this.logDebug(`${this.total - 1} rows read`)
  }

  async _onRow(itemRow) {
    const { levelIndex, codes, labelsByLang, descriptionsByLang, extra } = itemRow

    if (this._checkCodesNotEmpty(codes)) {
      const itemCodeKey = String(codes)
      const itemCached = this.itemsUpdater.getItemCachedByCodes(codes)

      if (itemCached && !itemCached.placeholder) {
        this._addErrorCodeDuplicate(levelIndex, itemCodeKey)
      } else if (!itemCached) {
        const levels = Category.getLevelsArray(this.category)
        const level = levels[levelIndex]

        const { inserted } = await this.itemsUpdater.insertOrUpdateItem({
          itemCodes: codes,
          level,
          placeholder: false,
          labelsByLang,
          descriptionsByLang,
          extra,
        })

        if (inserted) {
          this.totalItemsInserted++
        }
      }
    }

    this.incrementProcessedItems()
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
      CategoryImportSummary.itemTypes.code,
      levelIndex
    )(this.summary)
    this._addError(Validation.messageKeys.categoryImport.codeDuplicate, {
      columnName,
      code,
    })
  }

  _addErrorCodeRequired(levelIndex) {
    const columnName = CategoryImportSummary.getColumnName(
      CategoryImportSummary.itemTypes.code,
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
}

CategoryImportJob.type = 'CategoryImportJob'
