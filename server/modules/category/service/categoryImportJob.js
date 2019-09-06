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
  }

  async execute () {
    //initialize summary (get it from params by default)
    this.summary = await this.getOrCreateSummary()

    this.logDebug('summary', this.summary)

    this.category = await this.getOrCreateCategory()

    // levels
    await this._importLevels()

    // item extra def
    await this._importItemExtraDef()

    // items
    await this._readItems()

    if (this.hasErrors()) {
      // errors found
      this.logDebug(`${Object.keys(this.errors).length} errors found`)
      await this.setStatusFailed()
    } else {
      // no errors found
      await this.insertItems()
    }
  }

  async getOrCreateCategory () {
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

  async getOrCreateSummary () {
    return CategoryImportJobParams.getSummary(this.params)
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

  async _readItems () {
    this.logDebug('reading items')

    const reader = await CategoryImportCSVParser.createRowsReaderFromStream(
      this.createReadStream(),
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

  createReadStream () {
    return fs.createReadStream(CategoryImportSummary.getFilePath(this.summary))
  }

  async _onRow (itemRow) {
    const { levelIndexDeeper, codes, labelsByLevel, descriptionsByLevel, extra } = itemRow

    const levels = Category.getLevelsArray(this.category)

    if (this._checkCodesNotEmpty(codes)) {
      for (let levelIndex = 0; levelIndex <= levelIndexDeeper; levelIndex++) {
        const level = levels[levelIndex]
        const levelName = CategoryLevel.getName(level)

        const codesLevel = codes.slice(0, levelIndex + 1)

        const alreadyInserted = !!this.itemsByCodes[codesLevel]

        if (alreadyInserted) {
          if (levelIndex === levelIndexDeeper) {
            this._addErrorCodeDuplicate(codesLevel)
          }
        } else {
          let itemParentUuid = null
          if (levelIndex > 0) {
            const codesParent = codesLevel.slice(0, levelIndex)

            const itemParent = this.itemsByCodes[codesParent]
            itemParentUuid = CategoryItem.getUuid(itemParent)
          }

          const codeLevel = codesLevel[codesLevel.length - 1]

          const itemProps = this.extractItemProps(codeLevel, levelName, labelsByLevel, descriptionsByLevel, extra)

          this.itemsByCodes[codesLevel] = CategoryItem.newItem(
            CategoryLevel.getUuid(level),
            itemParentUuid,
            itemProps
          )
        }
      }
    }
    this.incrementProcessedItems()
  }

  extractItemProps (codeLevel, levelName, labelsByLevel, descriptionsByLevel, extra) {
    const itemProps = {
      [CategoryItem.props.code]: codeLevel
    }

    ObjectUtils.setInPath([ObjectUtils.keysProps.labels], labelsByLevel[levelName], false)(itemProps)
    ObjectUtils.setInPath([ObjectUtils.keysProps.descriptions], descriptionsByLevel[levelName], false)(itemProps)
    ObjectUtils.setInPath([CategoryItem.props.extra], extra, false)(itemProps)

    return itemProps
  }

  async insertItems () {
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
      this.addErrorCodeRequired(0)
      errorsFound = true
    } else {
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i]
        if (StringUtils.isBlank(code)) {
          this.addErrorCodeRequired(i)
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

  addErrorCodeRequired (levelIndex) {
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
}

CategoryImportJob.type = 'CategoryImportJob'

module.exports = CategoryImportJob

